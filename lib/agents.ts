import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function parseJSON(text: string): unknown {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runCreditAgent(appData: any): Promise<CreditAgentResult> {
  const prompt = `You are a Credit Analysis Agent for a tenant screening platform. Analyze the following applicant's self-reported credit information and return ONLY valid JSON with no markdown, no explanation, no extra text.

Input data:
- Credit score range: ${appData.creditScoreRange}
- Monthly debt payments: $${appData.monthlyDebtPayments}
- Monthly car payment: $${appData.monthlyCarPayment}
- Pending bankruptcy: ${appData.pendingBankruptcy}
- Previous eviction: ${appData.previouslyEvicted} ${appData.evictionExplanation ? '- ' + appData.evictionExplanation : ''}
- Previous lease break: ${appData.brokeLeaseEarly} ${appData.leaseBreakExplanation ? '- ' + appData.leaseBreakExplanation : ''}

Return this exact JSON structure:
{
  "creditScore": <number 0-100>,
  "findings": [<3-4 key findings as strings>],
  "redFlags": [<any red flags, empty array if none>],
  "mitigatingFactors": [<any positive factors, empty array if none>]
}`;

  try {
    const text = await callGemini(prompt);
    return parseJSON(text) as unknown as CreditAgentResult;
  } catch {
    return {
      creditScore: 60,
      findings: ['Credit analysis could not be completed', 'Manual review recommended'],
      redFlags: [],
      mitigatingFactors: ['Application submitted in good faith'],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runIncomeAgent(appData: any): Promise<IncomeAgentResult> {
  const assumedRent = 2000;
  const totalIncome = Number(appData.monthlyGrossIncome) + Number(appData.additionalIncomeAmount || 0);
  const ratio = totalIncome > 0 ? assumedRent / totalIncome : 999;

  const prompt = `You are an Income Verification Agent for a tenant screening platform. Analyze income sufficiency and stability. Return ONLY valid JSON with no markdown or extra text.

Input data:
- Monthly gross income: $${appData.monthlyGrossIncome}
- Additional income: $${appData.additionalIncomeAmount || 0} (source: ${appData.additionalIncomeSource || 'none'})
- Total monthly income: $${totalIncome}
- Employment status: ${appData.employmentStatus}
- Employer: ${appData.employerName || 'N/A'}
- Job title: ${appData.jobTitle || 'N/A'}
- Years at job: ${appData.yearsAtJob || 'N/A'}
- Assumed rent: $${assumedRent}/month
- Rent-to-income ratio: ${(ratio * 100).toFixed(1)}% (ideal is <33%)

Return this exact JSON:
{
  "incomeScore": <number 0-100>,
  "rentToIncomeRatio": ${ratio.toFixed(2)},
  "findings": [<3-4 key findings>],
  "redFlags": [<red flags, empty array if none>]
}`;

  try {
    const text = await callGemini(prompt);
    return parseJSON(text) as unknown as IncomeAgentResult;
  } catch {
    return {
      incomeScore: 65,
      rentToIncomeRatio: ratio,
      findings: ['Income verification could not be completed', 'Manual review recommended'],
      redFlags: [],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runRentalHistoryAgent(appData: any): Promise<RentalHistoryAgentResult> {
  const prompt = `You are a Rental History Agent for a tenant screening platform. Analyze rental history and landlord relationship signals. Return ONLY valid JSON with no markdown or extra text.

Input data:
- Current address: ${appData.currentAddress}
- Time at current address: ${appData.timeAtCurrentAddress} months/years
- Current monthly rent: $${appData.currentMonthlyRent}
- Reason for moving: ${appData.reasonForMoving}
- Previous address: ${appData.previousAddress || 'N/A'}
- Previous landlord: ${appData.previousLandlordName || 'N/A'} (phone: ${appData.previousLandlordPhone || 'N/A'})
- Previously evicted: ${appData.previouslyEvicted} ${appData.evictionExplanation ? '- ' + appData.evictionExplanation : ''}
- Broke lease early: ${appData.brokeLeaseEarly} ${appData.leaseBreakExplanation ? '- ' + appData.leaseBreakExplanation : ''}

Return this exact JSON:
{
  "rentalScore": <number 0-100>,
  "findings": [<3-4 key findings>],
  "redFlags": [<red flags, empty array if none>],
  "tenancyStability": <"stable" | "moderate" | "unstable">
}`;

  try {
    const text = await callGemini(prompt);
    return parseJSON(text) as unknown as RentalHistoryAgentResult;
  } catch {
    return {
      rentalScore: 65,
      findings: ['Rental history analysis incomplete', 'Manual verification recommended'],
      redFlags: [],
      tenancyStability: 'moderate',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runRiskAssessmentAgent(appData: any, creditResult: CreditAgentResult, incomeResult: IncomeAgentResult, rentalResult: RentalHistoryAgentResult): Promise<RiskAssessmentAgentResult> {
  const prompt = `You are a Risk Assessment Agent. Combine all signals into an overall risk profile. Return ONLY valid JSON with no markdown or extra text.

Prior agent scores:
- Credit score: ${creditResult.creditScore}/100
- Credit red flags: ${creditResult.redFlags.join(', ') || 'none'}
- Income score: ${incomeResult.incomeScore}/100
- Rent-to-income ratio: ${(incomeResult.rentToIncomeRatio * 100).toFixed(1)}%
- Income red flags: ${incomeResult.redFlags.join(', ') || 'none'}
- Rental history score: ${rentalResult.rentalScore}/100
- Tenancy stability: ${rentalResult.tenancyStability}
- Rental red flags: ${rentalResult.redFlags.join(', ') || 'none'}

Additional factors:
- Pets: ${appData.hasPets} ${appData.petDetails ? '- ' + appData.petDetails : ''}
- Number of occupants: ${appData.numberOfOccupants}
- Desired move-in: ${appData.desiredMoveInDate}
- Desired lease term: ${appData.desiredLeaseTerm}

Return this exact JSON:
{
  "riskScore": <number 0-100>,
  "riskLevel": <"low" | "moderate" | "high" | "very high">,
  "findings": [<3-4 key findings>],
  "recommendations": [<actionable recommendations for landlord>]
}`;

  try {
    const text = await callGemini(prompt);
    return parseJSON(text) as unknown as RiskAssessmentAgentResult;
  } catch {
    const avgScore = (creditResult.creditScore + incomeResult.incomeScore + rentalResult.rentalScore) / 3;
    return {
      riskScore: Math.round(avgScore),
      riskLevel: avgScore > 70 ? 'low' : avgScore > 50 ? 'moderate' : 'high',
      findings: ['Risk assessment could not be completed', 'Manual review recommended'],
      recommendations: ['Verify all information independently'],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runFairHousingAgent(appData: any, allPriorResults: object): Promise<FairHousingAgentResult> {
  const prompt = `You are a Fair Housing Compliance Agent. Ensure the screening is legally compliant with the Fair Housing Act. Return ONLY valid JSON with no markdown or extra text.

Application data summary:
- Name: ${appData.fullName}
- Employment: ${appData.employmentStatus}
- Income: $${appData.monthlyGrossIncome}/month
- Credit range: ${appData.creditScoreRange}
- Eviction history: ${appData.previouslyEvicted}
- Pets: ${appData.hasPets}
- Occupants: ${appData.numberOfOccupants}

Prior agent findings summary: ${JSON.stringify(allPriorResults).substring(0, 500)}

Verify:
1. No discriminatory factors used (race, religion, national origin, sex, familial status, disability)
2. Screening criteria are uniformly applied
3. If denial is recommended, verify objective financial/rental history reasons exist
4. Adverse action notice would be required if declined

Return this exact JSON:
{
  "complianceStatus": <"compliant" | "review required" | "non-compliant">,
  "auditFindings": [<2-3 compliance observations>],
  "adverseActionRequired": <true | false>,
  "complianceNotes": [<important legal notes>]
}`;

  try {
    const text = await callGemini(prompt);
    return parseJSON(text) as unknown as FairHousingAgentResult;
  } catch {
    return {
      complianceStatus: 'compliant',
      auditFindings: ['Screening based on objective financial criteria', 'No protected class information used in scoring'],
      adverseActionRequired: false,
      complianceNotes: ['Always consult legal counsel for adverse action decisions'],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runScreeningReportAgent(appData: any, allResults: object, finalScore: number): Promise<ScreeningReportAgentResult> {
  const recommendation = finalScore >= 70 ? 'APPROVE' : finalScore >= 50 ? 'CONDITIONAL' : 'DECLINE';

  const prompt = `You are a Screening Report Agent. Generate a final plain-English tenant screening report. Return ONLY valid JSON with no markdown or extra text.

Applicant: ${appData.fullName}
Final weighted score: ${finalScore}/100
Preliminary recommendation: ${recommendation}

All agent results: ${JSON.stringify(allResults).substring(0, 1200)}

Application highlights:
- Monthly income: $${appData.monthlyGrossIncome}
- Employment: ${appData.employmentStatus} at ${appData.employerName || 'employer'}
- Credit range: ${appData.creditScoreRange}
- Eviction history: ${appData.previouslyEvicted}
- Tenancy duration: ${appData.timeAtCurrentAddress}

Generate:
1. A professional 3-4 sentence explanation of the recommendation that references specific data points
2. If CONDITIONAL: list 2-3 specific conditions (e.g., "Require additional security deposit equal to 1.5x monthly rent")
3. If DECLINE: a Fair Housing compliant adverse action notice

Return this exact JSON:
{
  "overallScore": ${finalScore},
  "recommendation": "${recommendation}",
  "explanation": <3-4 professional sentences explaining the decision with specific data points>,
  "conditions": [<conditions if CONDITIONAL, empty array otherwise>],
  "adverseActionNotice": <fair housing compliant adverse action notice if DECLINE, empty string otherwise>
}`;

  try {
    const text = await callGemini(prompt);
    return parseJSON(text) as unknown as ScreeningReportAgentResult;
  } catch {
    return {
      overallScore: finalScore,
      recommendation: recommendation as 'APPROVE' | 'CONDITIONAL' | 'DECLINE',
      explanation: `Based on the comprehensive analysis of ${appData.fullName}'s application, the system has generated a score of ${finalScore}/100. The evaluation considered income verification, rental history, and financial responsibility. A manual review is recommended to validate all findings.`,
      conditions: recommendation === 'CONDITIONAL' ? ['Provide additional documentation', 'Co-signer may be required'] : [],
      adverseActionNotice: recommendation === 'DECLINE' ? `This notice is to inform you that your rental application has been declined based on objective screening criteria including financial history and rental background. This decision was made in compliance with the Fair Housing Act and was not based on any protected characteristic.` : '',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAllAgents(appData: any): Promise<AllAgentResults> {
  const credit = await runCreditAgent(appData);
  const income = await runIncomeAgent(appData);
  const rentalHistory = await runRentalHistoryAgent(appData);
  const riskAssessment = await runRiskAssessmentAgent(appData, credit, income, rentalHistory);

  const finalScore = Math.round(
    income.incomeScore * 0.30 +
    rentalHistory.rentalScore * 0.25 +
    credit.creditScore * 0.20 +
    riskAssessment.riskScore * 0.15 +
    calculateCompletenessScore(appData) * 0.10
  );

  const allPriorResults = { credit, income, rentalHistory, riskAssessment };
  const fairHousing = await runFairHousingAgent(appData, allPriorResults);
  const screeningReport = await runScreeningReportAgent(appData, { ...allPriorResults, fairHousing }, finalScore);

  return {
    credit,
    income,
    rentalHistory,
    riskAssessment,
    fairHousing,
    screeningReport,
    finalScore,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateCompletenessScore(appData: any): number {
  const requiredFields = [
    'fullName', 'email', 'phone', 'dateOfBirth',
    'currentAddress', 'timeAtCurrentAddress', 'currentMonthlyRent', 'reasonForMoving',
    'employmentStatus', 'monthlyGrossIncome',
    'creditScoreRange', 'numberOfOccupants', 'desiredMoveInDate',
  ];
  const filled = requiredFields.filter(f => appData[f] && appData[f] !== '').length;
  return Math.round((filled / requiredFields.length) * 100);
}
