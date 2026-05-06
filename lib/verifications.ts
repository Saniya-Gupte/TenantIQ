export interface ZipVerification {
  valid: boolean;
  city?: string;
  state?: string;
  mismatch?: boolean;
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

// Plaid income simulation — demonstrates what a real Plaid integration would return.
// A real deployment would use Plaid Link for the applicant to connect their bank,
// then call /transactions/get with their access token. Here we simulate that result
// based on stated income so the agents receive plausible, consistent data.
function simulatePlaidIncome(statedMonthlyIncome: number): PlaidIncomeVerification {
  if (statedMonthlyIncome <= 0) {
    return {
      available: true,
      sandboxMode: true,
      incomeMatch: 'unverified',
      note: 'Plaid (demo): No income stated — income verification skipped',
    };
  }

  // Simulate ±6% payroll variance (biweekly deposits can vary slightly)
  const seed = statedMonthlyIncome % 97; // deterministic-ish per income level
  const varianceFactor = 0.94 + (seed / 97) * 0.12; // 0.94–1.06
  const verifiedMonthlyIncome = Math.round(statedMonthlyIncome * varianceFactor);

  // Account balance: 1.5×–3× monthly income (reasonable checking + savings)
  const balanceFactor = 1.5 + (seed % 17) / 10; // 1.5–3.2
  const accountBalance = Math.round(statedMonthlyIncome * balanceFactor);

  const payrollDeposits = 6; // biweekly over 90 days
  const diff = Math.abs(verifiedMonthlyIncome - statedMonthlyIncome);
  const pct = diff / statedMonthlyIncome;
  const incomeMatch: 'match' | 'discrepancy' | 'unverified' = pct <= 0.20 ? 'match' : 'discrepancy';
  const discrepancyAmount = incomeMatch === 'discrepancy' ? diff : undefined;

  return {
    available: true,
    sandboxMode: true,
    verifiedMonthlyIncome,
    payrollDeposits,
    accountBalance,
    incomeMatch,
    discrepancyAmount,
    note: incomeMatch === 'match'
      ? `Plaid (demo): ~$${verifiedMonthlyIncome.toLocaleString()}/mo in payroll deposits — matches stated income, balance $${accountBalance.toLocaleString()}`
      : `Plaid (demo): ~$${verifiedMonthlyIncome.toLocaleString()}/mo detected vs $${statedMonthlyIncome.toLocaleString()}/mo stated — $${diff.toLocaleString()} discrepancy`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAllVerifications(appData: any): Promise<AllVerifications> {
  const statedMonthlyIncome =
    (Number(appData.monthlyGrossIncome) || 0) + (Number(appData.additionalIncomeAmount) || 0);

  const [zipRes, employerRes] = await Promise.allSettled([
    verifyZip(appData.currentAddress || ''),
    appData.employerName && appData.employmentStatus !== 'unemployed'
      ? verifyEmployer(appData.employerName)
      : Promise.resolve(null),
  ]);

  const plaidIncome = simulatePlaidIncome(statedMonthlyIncome);

  return {
    zip: zipRes.status === 'fulfilled' ? zipRes.value : { valid: false, note: 'ZIP verification failed' },
    employer: employerRes.status === 'fulfilled' ? employerRes.value : null,
    plaidIncome,
  };
}
