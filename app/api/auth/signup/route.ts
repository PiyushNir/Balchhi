import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    try {
      // Create auth user with email confirmed
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          name,
          role,
        },
        email_confirm: true, // Auto-confirm email for admin-created users
      })

      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }

      console.log('User created:', authData.user.id)

      // Create profile - use a simple insert without checking for conflicts
      try {
        await adminClient
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email,
            name,
            role,
            updated_at: new Date().toISOString(),
          })
      } catch (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue anyway - profile creation is secondary
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name,
            role,
          },
        },
        { status: 201 }
      )
    } catch (innerError) {
      console.error('Inner error:', innerError)
      throw innerError
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    )
  }
}


