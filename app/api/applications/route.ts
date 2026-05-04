import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('applications')
      .select('id, created_at, applicant_name, applicant_email, overall_score, recommendation, status')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ applications: [], error: error.message });
    }

    return NextResponse.json({ applications: data || [] });
  } catch (error) {
    return NextResponse.json(
      { applications: [], error: error instanceof Error ? error.message : 'Supabase not configured' }
    );
  }
}
