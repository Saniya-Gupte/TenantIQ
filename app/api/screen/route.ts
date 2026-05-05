import { NextRequest, NextResponse } from 'next/server';
import { runAllAgents } from '@/lib/agents';
import { runAllVerifications } from '@/lib/verifications';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const appData = await req.json();

    let applicationId = crypto.randomUUID();
    let createdAt = new Date().toISOString();
    let supabaseAvailable = true;
    let supabase;

    try {
      supabase = getServiceSupabase();
    } catch {
      supabaseAvailable = false;
    }

    if (supabaseAvailable && supabase) {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          applicant_name: appData.fullName,
          applicant_email: appData.email,
          application_data: appData,
          status: 'processing',
          overall_score: 0,
          recommendation: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        applicationId = data.id;
        createdAt = data.created_at;
      }
    }

    // Run external verifications in parallel (graceful — never throws)
    let verifications = null;
    try {
      verifications = await runAllVerifications(appData);
    } catch {
      // verifications remain null; agents still run without them
    }

    const agentResults = await runAllAgents(appData, verifications);

    if (supabaseAvailable && supabase) {
      await supabase
        .from('applications')
        .update({
          agent_results: { ...agentResults, verifications },
          overall_score: agentResults.finalScore,
          recommendation: agentResults.screeningReport.recommendation,
          status: 'complete',
        })
        .eq('id', applicationId);
    }

    return NextResponse.json({
      id: applicationId,
      agentResults: { ...agentResults, verifications },
      overallScore: agentResults.finalScore,
      recommendation: agentResults.screeningReport.recommendation,
      applicantName: appData.fullName,
      createdAt,
    });
  } catch (error) {
    console.error('Screening error:', error);
    return NextResponse.json(
      { error: 'Screening failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
