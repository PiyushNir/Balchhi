import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  if (!token || !type) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
  }

  try {
    const supabase = createServerClient()
    
    if (type === 'email') {
      const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: 'email_change' })
      
      if (error) {
        return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
      }
    }

    return NextResponse.redirect(new URL('/dashboard?verified=true', request.url))
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=verification_error', request.url))
  }
}
