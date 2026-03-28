import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check if env vars are set
  if (!url || !key) {
    return NextResponse.json({
      status: 'error',
      message: 'Supabase environment variables not set',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: url ? 'SET' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? 'SET' : 'MISSING',
      }
    }, { status: 500 })
  }
  
  try {
    // Create a simple Supabase client for testing
    const supabase = createClient(url, key)
    
    // Test connection by listing tables
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, stock_number, make, model, year')
      .limit(5)
    
    if (error) {
      // Table might be empty or not exist yet
      return NextResponse.json({
        status: 'connected',
        message: 'Supabase connection successful',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: 'SET',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'SET',
        },
        query_result: {
          error: error.message,
          hint: error.hint || 'Table may be empty or RLS policies may restrict access',
        }
      })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection and query successful',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'SET',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'SET',
      },
      vehicles_count: data?.length || 0,
      sample_data: data?.slice(0, 3) || [],
    })
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Supabase',
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
