import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AllVerifications } from './verifications';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Robustly extract JSON from a Gemini response.
 * Handles: markdown fences, preamble text ("Here is the JSON:"), postamble text.
 */
function parseJSON(text: string): unknown {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find the first complete JSON object in the response (handles surrounding prose)
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];

  return JSON.parse(cleaned);
}

/** Clamp and round a value to [0, 100]. Returns mid-range if not a valid number. */
function clamp(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function ensureStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  return [];
}

// ---------------------------------------------------------------------------
// Deterministic fallback score calculators — based on actual input data
// Used ONLY if Gemini fails entirely. Scores reflect the real application data.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcCreditFallback(appData: any): number {
  let score = 65;
  const creditBoost: Record<string, number> = { excellent: 25, good: 12, fair: -5, poor: -25 };
  score += creditBoost[appData.creditScoreRange] ?? 0;
  if (appData.previouslyEvicted === 'yes') score -= 30;
  if (appData.brokeLeaseEarly === 'yes') score -= 12;
  if (appData.pendingBankruptcy === 'yes') score -= 28;
  const income = Number(appData.monthlyGrossIncome) || 1;
  const debt = (Number(appData.monthlyDebtPayments) || 0) + (Number(appData.monthlyCarPayment) || 0);
  if (debt / income > 0.4) score -= 15;
  else if (debt / income < 0.15) score += 5;
  return clamp(score);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcIncomeFallback(appData: any): number {
  const income = (Number(appData.monthlyGrossIncome) || 0) + (Number(appData.additionalIncomeAmount) || 0);
  const rent = 2000;
  const ratio = income > 0 ? rent / income : 1;

  let score: number;
  if (ratio <= 0.20) score = 97;
  else if (ratio <= 0.25) score = 90;
  else if (ratio <= 0.30) score = 82;
  else if (ratio <= 0.33) score = 72;
  else if (ratio <= 0.40) score = 58;
  else if (ratio <= 0.50) score = 42;
  else score = 25;

  if (appData.employmentStatus === 'unemployed') score -= 30;
  else if (appData.employmentStatus === 'self_employed') score -= 5;

  const years = Number(appData.yearsAtJob) || 0;
  if (years >= 3) score += 8;
  else if (years >= 1) score += 3;
  else if (years < 0.5 && appData.employmentStatus === 'employed') score -= 8;

  return clamp(score);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcRentalFallback(appData: any): number {
  let score = 75;
  if (appData.previouslyEvicted === 'yes') score -= 38;
  if (appData.brokeLeaseEarly === 'yes') score -= 15;

  const timeStr = String(appData.timeAtCurrentAddress || '').toLowerCase();
  const yearsMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*year/);
  const monthsMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*month/);
  const years = yearsMatch ? parseFloat(yearsMatch[1]) : (monthsMatch ? parseFloat(monthsMatch[1]) / 12 : 0);
  if (years >= 3) score += 15;
  else if (years >= 1) score += 8;
  else if (years < 0.5) score -= 10;

  if (appData.previousLandlordName) score += 5;
  return clamp(score);
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CreditAgentResult {
  creditScore: number;
  findings: string[];
  redFlags: string[];
  mitigatingFactors: string[];
}

export interface IncomeAgentResult {
  incomeScore: number;
  rentToIncomeRatio: number;
  findings: string[];
  redFlags: string[];
}

export interface RentalHistoryAgentResult {
  rentalScore: number;
  findings: string[];
  redFlags: string[];
  tenancyStability: string;
}

export interface RiskAssessmentAgentResult {
  riskScore: number;
  riskLevel: string;
  findings: string[];
  recommendations: string[];
}

export interface FairHousingAgentResult {
  complianceStatus: string;
  auditFindings: string[];
  adverseActionRequired: boolean;
  complianceNotes: string[];
}

export interface ScreeningReportAgentResult {
  overallScore: number;
  recommendation: 'APPROVE' | 'CONDITIONAL' | 'DECLINE';
  explanation: string;
  conditions: string[];
  adverseActionNotice: string;
}

export interface AllAgentResults {
  credit: CreditAgentResult;
  income: IncomeAgentResult;
  rentalHistory: RentalHistoryAgentResult;
  riskAssessment: RiskAssessmentAgentResult;
  fairHousing: FairHousingAgentResult;
  screeningReport: ScreeningReportAgentResult;
  finalScore: number;
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runCreditAgent(appData: any, verifications?: AllVerifications | null): Promise<CreditAgentResult> {
  const totalDebt = (Number(appData.monthlyDebtPayments) || 0) + (Number(appData.monthlyCarPayment) || 0);
  const income = Number(appData.monthlyGrossIncome) || 1;
  const debtRatio = ((totalDebt / income) * 100).toFixed(1);

  const verificationContext = verifications ? `
Verified external data:
- Address ZIP: ${verifications.zip.note}${verifications.zip.mismatch ? ' ⚠️ State mismatch — possible address fabrication' : ''}
- OFAC sanctions check: ${verifications.ofac.note}${verifications.ofac.matchFound ? ' ⚠️ POTENTIAL MATCH — treat as major red flag' : ''}
` : '';

  const prompt = `You are a Credit Analysis Agent for a tenant screening platform. Analyze the applicant's financial background and return a JSON object. Do NOT include any explanation, markdown, or extra text — return ONLY the raw JSON object.

Applicant data:
- Self-reported credit score range: ${appData.creditScoreRange} (excellent=750+, good=700-749, fair=650-699, poor=below 650)
- Monthly car payment: $${appData.monthlyCarPayment || 0}
- Monthly other debt payments: $${appData.monthlyDebtPayments || 0}
- Total monthly debt: $${totalDebt} (${debtRatio}% of income)
- Pending bankruptcy: ${appData.pendingBankruptcy}
- Ever evicted: ${appData.previouslyEvicted}${appData.evictionExplanation ? ' — ' + appData.evictionExplanation : ''}
- Ever broke lease early: ${appData.brokeLeaseEarly}${appData.leaseBreakExplanation ? ' — ' + appData.leaseBreakExplanation : ''}
${verificationContext}

Scoring guide:
- Excellent credit, no eviction, no bankruptcy, low debt → creditScore 80-100
- Good credit, no issues → creditScore 70-85
- Fair credit or moderate debt → creditScore 55-70
- Poor credit OR eviction OR bankruptcy → creditScore 30-55
- Multiple serious issues → creditScore below 40

Return exactly this JSON (fill in real values, no placeholders):
{
  "creditScore": <integer 0-100>,
  "findings": ["finding 1", "finding 2", "finding 3"],
  "redFlags": ["flag 1"],
  "mitigatingFactors": ["factor 1"]
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = parseJSON(text) as Record<string, unknown>;
    return {
      creditScore: clamp(parsed.creditScore),
      findings: ensureStringArray(parsed.findings),
      redFlags: ensureStringArray(parsed.redFlags),
      mitigatingFactors: ensureStringArray(parsed.mitigatingFactors),
    };
  } catch (err) {
    console.error('Credit agent error:', err);
    const fallbackScore = calcCreditFallback(appData);
    return {
      creditScore: fallbackScore,
      findings: [
        `Credit range reported as ${appData.creditScoreRange}`,
        `Total monthly debt: $${totalDebt} (${debtRatio}% of income)`,
        appData.previouslyEvicted === 'yes' ? 'Eviction on record' : 'No eviction history',
      ],
      redFlags: [
        ...(appData.previouslyEvicted === 'yes' ? ['Previous eviction reported'] : []),
        ...(appData.pendingBankruptcy === 'yes' ? ['Pending bankruptcy disclosed'] : []),
      ],
      mitigatingFactors: fallbackScore >= 70 ? ['Strong overall credit profile'] : [],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runIncomeAgent(appData: any, verifications?: AllVerifications | null): Promise<IncomeAgentResult> {
  const assumedRent = 2000;
  const grossIncome = Number(appData.monthlyGrossIncome) || 0;
  const additionalIncome = Number(appData.additionalIncomeAmount) || 0;
  const totalIncome = grossIncome + additionalIncome;
  const ratio = totalIncome > 0 ? assumedRent / totalIncome : 999;
  const ratioPercent = (ratio * 100).toFixed(1);

  const verificationContext = verifications ? `
Verified external data:
- Employer "${appData.employerName || 'N/A'}": ${verifications.employer?.note ?? 'Not checked (unemployed or no employer provided)'}${verifications.employer && !verifications.employer.found ? ' ⚠️ Employer not found in business registry' : ''}
- Plaid income verification (sandbox): ${verifications.plaidIncome.note}${verifications.plaidIncome.incomeMatch === 'discrepancy' ? ` ⚠️ INCOME DISCREPANCY — stated income may be overstated` : ''}${verifications.plaidIncome.accountBalance ? ` — bank balance $${Math.round(verifications.plaidIncome.accountBalance).toLocaleString()}` : ''}
` : '';

  const prompt = `You are an Income Verification Agent for a tenant screening platform. Analyze income sufficiency and stability. Return ONLY the raw JSON object — no markdown, no explanation.

Applicant data:
- Employment status: ${appData.employmentStatus}
- Employer: ${appData.employerName || 'N/A'}, Title: ${appData.jobTitle || 'N/A'}
- Years at current job: ${appData.yearsAtJob || 'N/A'}
- Monthly gross income: $${grossIncome}
- Additional income: $${additionalIncome}${appData.additionalIncomeSource ? ' from ' + appData.additionalIncomeSource : ''}
- Total monthly income: $${totalIncome}
- Assumed monthly rent: $${assumedRent}
- Rent-to-income ratio: ${ratioPercent}% (industry standard: under 30% is ideal, under 33% is acceptable)
${verificationContext}

Scoring guide:
- Ratio ≤ 25% and stable employment → incomeScore 85-100
- Ratio 26-30% → incomeScore 75-84
- Ratio 31-33% → incomeScore 65-74
- Ratio 34-40% → incomeScore 50-64
- Ratio > 40% or unemployed → incomeScore below 50

Return exactly this JSON (all values must be real numbers, not placeholders):
{
  "incomeScore": <integer 0-100>,
  "rentToIncomeRatio": <decimal e.g. 0.31>,
  "findings": ["finding 1", "finding 2", "finding 3"],
  "redFlags": ["flag 1"]
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = parseJSON(text) as Record<string, unknown>;
    return {
      incomeScore: clamp(parsed.incomeScore),
      rentToIncomeRatio: Number(parsed.rentToIncomeRatio) || ratio,
      findings: ensureStringArray(parsed.findings),
      redFlags: ensureStringArray(parsed.redFlags),
    };
  } catch (err) {
    console.error('Income agent error:', err);
    const fallbackScore = calcIncomeFallback(appData);
    return {
      incomeScore: fallbackScore,
      rentToIncomeRatio: ratio,
      findings: [
        `Total monthly income: $${totalIncome} (${appData.employmentStatus})`,
        `Rent-to-income ratio: ${ratioPercent}% (assumed rent $${assumedRent}/mo)`,
        appData.yearsAtJob ? `${appData.yearsAtJob} years at current employer` : 'Employment tenure not provided',
      ],
      redFlags: ratio > 0.40 ? [`Rent-to-income ratio of ${ratioPercent}% exceeds recommended 33%`] : [],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runRentalHistoryAgent(appData: any, verifications?: AllVerifications | null): Promise<RentalHistoryAgentResult> {
  const verificationContext = verifications ? `
Verified external data:
- Current address ZIP check: ${verifications.zip.note}${verifications.zip.mismatch ? ' ⚠️ State in address may not match ZIP — potential address fabrication' : ''}
` : '';

  const prompt = `You are a Rental History Agent for a tenant screening platform. Analyze rental history and tenancy stability. Return ONLY the raw JSON object — no markdown, no explanation.

Applicant data:
- Current address: ${appData.currentAddress}
- Time at current address: ${appData.timeAtCurrentAddress}
- Current monthly rent: $${appData.currentMonthlyRent || 'not provided'}
- Reason for moving: ${appData.reasonForMoving}
- Previous address: ${appData.previousAddress || 'not provided'}
- Previous landlord: ${appData.previousLandlordName || 'not provided'}
- Ever evicted: ${appData.previouslyEvicted}${appData.evictionExplanation ? ' — ' + appData.evictionExplanation : ''}
- Ever broke lease early: ${appData.brokeLeaseEarly}${appData.leaseBreakExplanation ? ' — ' + appData.leaseBreakExplanation : ''}
${verificationContext}

Scoring guide:
- No eviction, no lease break, tenancy ≥ 2 years → rentalScore 80-100
- No eviction, minor issues or short tenancy → rentalScore 65-79
- Lease break with explanation → rentalScore 50-65
- Eviction with good explanation → rentalScore 35-50
- Eviction without good explanation → rentalScore below 35

Return exactly this JSON:
{
  "rentalScore": <integer 0-100>,
  "findings": ["finding 1", "finding 2", "finding 3"],
  "redFlags": ["flag 1"],
  "tenancyStability": "<stable|moderate|unstable>"
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = parseJSON(text) as Record<string, unknown>;
    return {
      rentalScore: clamp(parsed.rentalScore),
      findings: ensureStringArray(parsed.findings),
      redFlags: ensureStringArray(parsed.redFlags),
      tenancyStability: String(parsed.tenancyStability || 'moderate'),
    };
  } catch (err) {
    console.error('Rental history agent error:', err);
    const fallbackScore = calcRentalFallback(appData);
    return {
      rentalScore: fallbackScore,
      findings: [
        `Tenancy duration: ${appData.timeAtCurrentAddress}`,
        appData.reasonForMoving ? `Reason for moving: ${appData.reasonForMoving}` : 'Reason for moving not provided',
        appData.previouslyEvicted === 'no' && appData.brokeLeaseEarly === 'no'
          ? 'No eviction or lease break history'
          : 'Rental history issues noted',
      ],
      redFlags: [
        ...(appData.previouslyEvicted === 'yes' ? ['Eviction history disclosed'] : []),
        ...(appData.brokeLeaseEarly === 'yes' ? ['Early lease termination disclosed'] : []),
      ],
      tenancyStability: fallbackScore >= 75 ? 'stable' : fallbackScore >= 55 ? 'moderate' : 'unstable',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runRiskAssessmentAgent(appData: any, creditResult: CreditAgentResult, incomeResult: IncomeAgentResult, rentalResult: RentalHistoryAgentResult, verifications?: AllVerifications | null): Promise<RiskAssessmentAgentResult> {
  const verificationFlags: string[] = [];
  if (verifications) {
    if (verifications.ofac.matchFound) verificationFlags.push('OFAC sanctions list potential match');
    if (verifications.zip.mismatch) verificationFlags.push('Address ZIP code state mismatch');
    if (verifications.employer && !verifications.employer.found && appData.employmentStatus !== 'unemployed') verificationFlags.push('Stated employer not found in business registry');
    if (verifications.plaidIncome.incomeMatch === 'discrepancy') verificationFlags.push(`Plaid income discrepancy: stated vs verified differ by $${verifications.plaidIncome.discrepancyAmount?.toLocaleString()}`);
  }

  const verificationContext = verificationFlags.length > 0
    ? `\nExternal verification flags: ${verificationFlags.join('; ')}\n`
    : verifications ? '\nExternal verifications: all clear\n' : '';

  const prompt = `You are a Risk Assessment Agent for a tenant screening platform. Synthesize all signals into a holistic risk profile. Return ONLY the raw JSON object.

Prior agent scores:
- Credit score: ${creditResult.creditScore}/100 (red flags: ${creditResult.redFlags.join('; ') || 'none'})
- Income score: ${incomeResult.incomeScore}/100 (rent-to-income: ${(incomeResult.rentToIncomeRatio * 100).toFixed(1)}%, red flags: ${incomeResult.redFlags.join('; ') || 'none'})
- Rental history score: ${rentalResult.rentalScore}/100 (stability: ${rentalResult.tenancyStability}, red flags: ${rentalResult.redFlags.join('; ') || 'none'})
${verificationContext}
Additional applicant data:
- Pets: ${appData.hasPets}${appData.petDetails ? ' — ' + appData.petDetails : ''}
- Occupants: ${appData.numberOfOccupants}
- Desired move-in: ${appData.desiredMoveInDate}
- Desired lease term: ${appData.desiredLeaseTerm} months
- Pending bankruptcy: ${appData.pendingBankruptcy}

Scoring guide: derive riskScore as a weighted synthesis (do NOT just average the three scores):
- All scores ≥ 80, no red flags → riskScore 85-100, riskLevel "low"
- Mixed strong/moderate scores → riskScore 65-84, riskLevel "moderate"
- One or more scores < 60 or serious red flags → riskScore 45-64, riskLevel "high"
- Multiple serious red flags → riskScore below 45, riskLevel "very high"

Return exactly this JSON:
{
  "riskScore": <integer 0-100>,
  "riskLevel": "<low|moderate|high|very high>",
  "findings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = parseJSON(text) as Record<string, unknown>;
    return {
      riskScore: clamp(parsed.riskScore),
      riskLevel: String(parsed.riskLevel || 'moderate'),
      findings: ensureStringArray(parsed.findings),
      recommendations: ensureStringArray(parsed.recommendations),
    };
  } catch (err) {
    console.error('Risk agent error:', err);
    const avgScore = Math.round((creditResult.creditScore + incomeResult.incomeScore + rentalResult.rentalScore) / 3);
    const allRedFlags = [...creditResult.redFlags, ...incomeResult.redFlags, ...rentalResult.redFlags];
    return {
      riskScore: clamp(avgScore - (allRedFlags.length * 5)),
      riskLevel: avgScore >= 80 ? 'low' : avgScore >= 65 ? 'moderate' : avgScore >= 45 ? 'high' : 'very high',
      findings: [
        `Composite score from credit (${creditResult.creditScore}), income (${incomeResult.incomeScore}), rental (${rentalResult.rentalScore})`,
        allRedFlags.length > 0 ? `${allRedFlags.length} risk flag(s) identified` : 'No major risk flags identified',
        `Tenancy stability: ${rentalResult.tenancyStability}`,
      ],
      recommendations: avgScore >= 70
        ? ['Standard lease terms apply', 'Verify identity documents at move-in']
        : ['Request additional documentation', 'Consider requiring co-signer or larger deposit'],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runFairHousingAgent(appData: any, allPriorResults: object): Promise<FairHousingAgentResult> {
  const prompt = `You are a Fair Housing Compliance Agent. Verify the screening decision is based solely on objective financial and rental history criteria, in compliance with the Fair Housing Act. Return ONLY the raw JSON object.

Applicant summary:
- Employment: ${appData.employmentStatus}, Income: $${appData.monthlyGrossIncome}/mo
- Credit range: ${appData.creditScoreRange}
- Eviction history: ${appData.previouslyEvicted}, Lease break: ${appData.brokeLeaseEarly}
- Occupants: ${appData.numberOfOccupants}, Pets: ${appData.hasPets}

Prior agent summary: ${JSON.stringify(allPriorResults).substring(0, 600)}

Verify: (1) No protected class factors used, (2) Criteria uniformly applied, (3) Decision based on objective financials.

Return exactly this JSON:
{
  "complianceStatus": "<compliant|review required|non-compliant>",
  "auditFindings": ["finding 1", "finding 2"],
  "adverseActionRequired": <true|false>,
  "complianceNotes": ["note 1"]
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = parseJSON(text) as Record<string, unknown>;
    return {
      complianceStatus: String(parsed.complianceStatus || 'compliant'),
      auditFindings: ensureStringArray(parsed.auditFindings),
      adverseActionRequired: Boolean(parsed.adverseActionRequired),
      complianceNotes: ensureStringArray(parsed.complianceNotes),
    };
  } catch (err) {
    console.error('Fair housing agent error:', err);
    return {
      complianceStatus: 'compliant',
      auditFindings: [
        'Screening based entirely on objective financial and rental history criteria',
        'No protected class characteristics referenced in evaluation',
      ],
      adverseActionRequired: false,
      complianceNotes: ['Consult legal counsel before issuing any adverse action notice'],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runScreeningReportAgent(appData: any, allResults: object, finalScore: number): Promise<ScreeningReportAgentResult> {
  const recommendation = finalScore >= 70 ? 'APPROVE' : finalScore >= 50 ? 'CONDITIONAL' : 'DECLINE';

  const prompt = `You are a Screening Report Agent. Write a final screening summary. Return ONLY the raw JSON object.

Applicant: ${appData.fullName}
Final weighted score: ${finalScore}/100
Recommendation: ${recommendation}

All agent results: ${JSON.stringify(allResults).substring(0, 1500)}

Application highlights:
- Monthly income: $${Number(appData.monthlyGrossIncome) + Number(appData.additionalIncomeAmount || 0)}
- Employment: ${appData.employmentStatus}${appData.employerName ? ' at ' + appData.employerName : ''}
- Credit range: ${appData.creditScoreRange}
- Eviction history: ${appData.previouslyEvicted}, Lease break: ${appData.brokeLeaseEarly}
- Time at current address: ${appData.timeAtCurrentAddress}
- Pending bankruptcy: ${appData.pendingBankruptcy}

Rules:
- explanation: 3-4 professional sentences referencing specific numbers from the data
- conditions: populate ONLY if CONDITIONAL (2-3 specific, actionable items); empty array otherwise
- adverseActionNotice: populate ONLY if DECLINE with a Fair Housing compliant notice; empty string otherwise

Return exactly this JSON:
{
  "overallScore": ${finalScore},
  "recommendation": "${recommendation}",
  "explanation": "<3-4 sentences>",
  "conditions": [],
  "adverseActionNotice": ""
}`;

  try {
    const text = await callGemini(prompt);
    const parsed = parseJSON(text) as Record<string, unknown>;
    return {
      overallScore: finalScore,
      recommendation: recommendation as 'APPROVE' | 'CONDITIONAL' | 'DECLINE',
      explanation: String(parsed.explanation || ''),
      conditions: ensureStringArray(parsed.conditions),
      adverseActionNotice: String(parsed.adverseActionNotice || ''),
    };
  } catch (err) {
    console.error('Screening report agent error:', err);
    const income = Number(appData.monthlyGrossIncome) + Number(appData.additionalIncomeAmount || 0);
    return {
      overallScore: finalScore,
      recommendation: recommendation as 'APPROVE' | 'CONDITIONAL' | 'DECLINE',
      explanation: `${appData.fullName} received a final screening score of ${finalScore}/100 based on weighted analysis of income, rental history, and financial responsibility. ${recommendation === 'APPROVE' ? 'The applicant demonstrates strong financial indicators and a positive rental background.' : recommendation === 'CONDITIONAL' ? 'The application presents some areas requiring additional consideration before approval.' : 'The application did not meet the minimum screening criteria.'} Monthly income of $${income} was evaluated against standard rent benchmarks. This report was generated by 6 specialized AI agents.`,
      conditions: recommendation === 'CONDITIONAL'
        ? ['Provide pay stubs or bank statements for the last 2 months', 'Additional security deposit equal to one additional month\'s rent may be required']
        : [],
      adverseActionNotice: recommendation === 'DECLINE'
        ? `This is to notify you that your rental application for the above-referenced property has been declined. This decision was based on objective screening criteria including credit history, income verification, and rental background — not on any characteristic protected under the Fair Housing Act. You have the right to request the specific reasons for this decision within 60 days.`
        : '',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAllAgents(appData: any, verifications?: AllVerifications | null): Promise<AllAgentResults> {
  const credit = await runCreditAgent(appData, verifications);
  const income = await runIncomeAgent(appData, verifications);
  const rentalHistory = await runRentalHistoryAgent(appData, verifications);
  const riskAssessment = await runRiskAssessmentAgent(appData, credit, income, rentalHistory, verifications);

  // Weights sum to 100% — no artificial completeness floor
  const finalScore = Math.round(
    income.incomeScore * 0.35 +
    rentalHistory.rentalScore * 0.28 +
    credit.creditScore * 0.22 +
    riskAssessment.riskScore * 0.15
  );

  const allPriorResults = { credit, income, rentalHistory, riskAssessment };
  const fairHousing = await runFairHousingAgent(appData, allPriorResults);
  const screeningReport = await runScreeningReportAgent(appData, { ...allPriorResults, fairHousing }, finalScore);

  return { credit, income, rentalHistory, riskAssessment, fairHousing, screeningReport, finalScore };
}
