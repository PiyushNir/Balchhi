import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Try to fetch from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Supabase database is connected!',
      data 
    })
  } catch (err) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Connection test failed',
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
