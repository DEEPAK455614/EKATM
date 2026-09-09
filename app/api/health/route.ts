import { NextResponse } from 'next/server';
export async function GET(){
  return NextResponse.json({
    ok:true,
    service:'ekatm-yatra-survey-crm',
    version:'1.0.0',
    databaseConfigured:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    aiConfigured:Boolean(process.env.GEMINI_API_KEY),
    time:new Date().toISOString()
  });
}
