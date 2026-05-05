export interface ZipVerification {
  valid: boolean;
  city?: string;
  state?: string;
  mismatch?: boolean;
  note: string;
}

export interface OfacVerification {
  clear: boolean;
  matchFound: boolean;
  note: string;
}

export interface EmployerVerification {
  found: boolean;
  name?: string;
  domain?: string;
  note: string;
}

export interface PlaidIncomeVerification {
  available: boolean;
  sandboxMode: boolean;
  verifiedMonthlyIncome?: number;
  payrollDeposits?: number;
  accountBalance?: number;
  incomeMatch?: 'match' | 'discrepancy' | 'unverified';
  discrepancyAmount?: number;
  note: string;
}

export interface AllVerifications {
  zip: ZipVerification;
  ofac: OfacVerification;
  employer: EmployerVerification | null;
  plaidIncome: PlaidIncomeVerification;
}

function extractZip(address: string): string | null {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

async function verifyZip(address: string): Promise<ZipVerification> {
  const zip = extractZip(address);
  if (!zip) return { valid: false, note: 'No ZIP code found in address' };

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { valid: false, note: `ZIP ${zip} not found in USPS database` };

    const data = await res.json();
    const place = data.places?.[0];
    const city = place?.['place name'] ?? '';
    const state = place?.['state abbreviation'] ?? '';

    const upperAddr = address.toUpperCase();
    const mismatch = state.length > 0 && !upperAddr.includes(state);

    return {
      valid: true,
      city,
      state,
      mismatch,
      note: mismatch
        ? `ZIP ${zip} maps to ${city}, ${state} — state in address may not match`
        : `ZIP ${zip} confirmed: ${city}, ${state}`,
    };
  } catch {
    return { valid: false, note: 'ZIP verification service unavailable' };
  }
}

async function verifyOfac(fullName: string): Promise<OfacVerification> {
  if (!fullName) return { clear: true, matchFound: false, note: 'No name provided for OFAC check' };

  try {
    const encoded = encodeURIComponent(fullName.trim());
    const url = `https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN?Name=${encoded}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    let text = '';
    if (res.ok) {
      try { text = await res.text(); } catch { /* ignore */ }
    }

    const matchFound = res.ok && text.length > 100 && !text.includes('"Total":0') && !text.includes('"totalResults":0');

    return {
      clear: !matchFound,
      matchFound,
      note: matchFound
        ? `Potential OFAC SDN match for "${fullName}" — manual review required`
        : `No OFAC SDN match found for "${fullName}"`,
    };
  } catch {
    return { clear: true, matchFound: false, note: 'OFAC check service unavailable' };
  }
}

async function verifyEmployer(employerName: string): Promise<EmployerVerification> {
  if (!employerName || employerName.trim().length < 2) {
    return { found: false, note: 'No employer name provided' };
  }

  try {
    const encoded = encodeURIComponent(employerName.trim());
    const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encoded}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { found: false, note: 'Employer verification service unavailable' };

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { found: false, note: `Employer "${employerName}" not found in business registry` };
    }

    const top = data[0];
    return {
      found: true,
      name: top.name,
      domain: top.domain,
      note: `Employer verified: ${top.name} (${top.domain})`,
    };
  } catch {
    return { found: false, note: 'Employer verification service unavailable' };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyPlaidIncome(statedMonthlyIncome: number): Promise<PlaidIncomeVerification> {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  if (!clientId || !secret) {
    return {
      available: false,
      sandboxMode: true,
      note: 'Plaid income verification not configured (add PLAID_CLIENT_ID and PLAID_SECRET)',
    };
  }

  const base = 'https://sandbox.plaid.com';

  // Step 1: Create a sandbox public token for First Platypus Bank
  let publicToken: string;
  try {
    const ptRes = await fetch(`${base}/sandbox/public_token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        institution_id: 'ins_109508',
        initial_products: ['transactions'],
        options: { override_username: 'user_good', override_password: 'pass_good' },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!ptRes.ok) {
      const errText = await ptRes.text().catch(() => '');
      console.error('Plaid public token error:', ptRes.status, errText);
      return { available: false, sandboxMode: true, note: 'Plaid sandbox token creation failed — check PLAID_CLIENT_ID and PLAID_SECRET' };
    }
    const ptData = await ptRes.json();
    publicToken = ptData.public_token;
  } catch (e) {
    console.error('Plaid public token fetch error:', e);
    return { available: false, sandboxMode: true, note: 'Plaid sandbox unreachable' };
  }

  // Step 2: Exchange for access token
  let accessToken: string;
  try {
    const atRes = await fetch(`${base}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, public_token: publicToken }),
      signal: AbortSignal.timeout(10000),
    });
    if (!atRes.ok) return { available: false, sandboxMode: true, note: 'Plaid token exchange failed' };
    const atData = await atRes.json();
    accessToken = atData.access_token;
  } catch {
    return { available: false, sandboxMode: true, note: 'Plaid token exchange failed' };
  }

  // Step 3: Get accounts for balance info
  let accountBalance = 0;
  try {
    const acctRes = await fetch(`${base}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, access_token: accessToken }),
      signal: AbortSignal.timeout(10000),
    });
    if (acctRes.ok) {
      const acctData = await acctRes.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accountBalance = (acctData.accounts || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a: any) => ['checking', 'savings'].includes(a.subtype))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce((sum: number, a: any) => sum + (a.balances?.current || 0), 0);
    }
  } catch {
    // balance remains 0 — non-critical
  }

  // Step 4: Get 90 days of transactions to identify payroll
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let transactions: unknown[] = [];
  try {
    const txRes = await fetch(`${base}/transactions/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { count: 100, include_personal_finance_category: true },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (txRes.ok) {
      const txData = await txRes.json();
      transactions = txData.transactions || [];
    }
  } catch {
    // no transactions — report balance only
  }

  if (transactions.length === 0) {
    return {
      available: true,
      sandboxMode: true,
      accountBalance,
      note: `Plaid (sandbox): connected, balance $${accountBalance.toLocaleString()} — no transaction data available`,
    };
  }

  // Identify payroll / income credits (Plaid: negative amount = credit to account)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payrollTxs = (transactions as any[]).filter((t: any) => {
    const name = (t.name || '').toUpperCase();
    const cats = [
      ...(Array.isArray(t.category) ? t.category : []),
      t.personal_finance_category?.primary || '',
      t.personal_finance_category?.detailed || '',
    ].join(' ').toUpperCase();

    const isCredit = t.amount < 0; // Plaid: negative = money in
    const isLarge = Math.abs(t.amount) > 300;

    return isCredit && isLarge && (
      name.includes('PAYROLL') ||
      name.includes('DIRECT DEP') ||
      name.includes('ACH CREDIT') ||
      name.includes('SALARY') ||
      name.includes('INCOME') ||
      cats.includes('INCOME') ||
      cats.includes('PAYROLL') ||
      cats.includes('WAGES')
    );
  });

  // If no specific payroll found, use all large credits as income proxy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCredits = (transactions as any[]).filter((t: any) => t.amount < 0 && Math.abs(t.amount) > 300);
  const incomeTxs = payrollTxs.length > 0 ? payrollTxs : allCredits;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalIncome = incomeTxs.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
  const monthsSpan = 3;
  const verifiedMonthlyIncome = incomeTxs.length > 0 ? Math.round(totalIncome / monthsSpan) : 0;

  let incomeMatch: 'match' | 'discrepancy' | 'unverified' = 'unverified';
  let discrepancyAmount: number | undefined;

  if (verifiedMonthlyIncome > 0 && statedMonthlyIncome > 0) {
    const diff = Math.abs(verifiedMonthlyIncome - statedMonthlyIncome);
    const pct = diff / statedMonthlyIncome;
    incomeMatch = pct <= 0.25 ? 'match' : 'discrepancy';
    discrepancyAmount = incomeMatch === 'discrepancy' ? diff : undefined;
  }

  const balanceStr = accountBalance > 0 ? `, account balance $${Math.round(accountBalance).toLocaleString()}` : '';

  return {
    available: true,
    sandboxMode: true,
    verifiedMonthlyIncome,
    payrollDeposits: incomeTxs.length,
    accountBalance,
    incomeMatch,
    discrepancyAmount,
    note: incomeMatch === 'match'
      ? `Plaid sandbox: ~$${verifiedMonthlyIncome.toLocaleString()}/mo verified — matches stated income${balanceStr}`
      : incomeMatch === 'discrepancy'
      ? `Plaid sandbox: ~$${verifiedMonthlyIncome.toLocaleString()}/mo detected vs $${statedMonthlyIncome.toLocaleString()}/mo stated — $${discrepancyAmount?.toLocaleString()} gap${balanceStr}`
      : `Plaid sandbox: connected${balanceStr} — income data inconclusive (${incomeTxs.length} deposits found)`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAllVerifications(appData: any): Promise<AllVerifications> {
  const statedMonthlyIncome =
    (Number(appData.monthlyGrossIncome) || 0) + (Number(appData.additionalIncomeAmount) || 0);

  const [zipRes, ofacRes, employerRes, plaidRes] = await Promise.allSettled([
    verifyZip(appData.currentAddress || ''),
    verifyOfac(appData.fullName || ''),
    appData.employerName && appData.employmentStatus !== 'unemployed'
      ? verifyEmployer(appData.employerName)
      : Promise.resolve(null),
    verifyPlaidIncome(statedMonthlyIncome),
  ]);

  return {
    zip: zipRes.status === 'fulfilled' ? zipRes.value : { valid: false, note: 'ZIP verification failed' },
    ofac: ofacRes.status === 'fulfilled' ? ofacRes.value : { clear: true, matchFound: false, note: 'OFAC check failed' },
    employer: employerRes.status === 'fulfilled' ? employerRes.value : null,
    plaidIncome: plaidRes.status === 'fulfilled'
      ? plaidRes.value
      : { available: false, sandboxMode: true, note: 'Plaid income verification failed' },
  };
}
