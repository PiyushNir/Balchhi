/**
 * Email Verification API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for organization email domain verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { 
  requireOrgRole,
  validateOrgEmail,
  logVerificationAudit,
  getClientIP,
  getUserAgent
} from '@/lib/org-rbac'

// ============================================
// POST /api/organizations/[id]/email-verify
// Send verification OTP to organization email
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Check permission
  const permission = await requireOrgRole(request, organizationId, ['org_owner', 'org_admin'])
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Get verification record
    const { data: verification, error: fetchError } = await adminClient
      .from('organization_verification')
      .select('id, official_email, email_verification_status, is_generic_email')
      .eq('organization_id', organizationId)
      .single()
    
    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Please complete verification details first' },
        { status: 400 }
      )
    }
    
    // Check if generic email needs override
    if (verification.is_generic_email) {
      return NextResponse.json({
        error: 'Generic email domains require manual override by admin',
        requires_manual_override: true
      }, { status: 400 })
    }
    
    // Check if already verified
    if (verification.email_verification_status === 'verified') {
      return NextResponse.json({
        message: 'Email is already verified',
        already_verified: true
      })
    }
    
    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    
    // Store OTP (in production, hash this)
    const { error: updateError } = await adminClient
      .from('organization_verification')
      .update({
        email_verification_token: otp, // In production, store hashed
        email_verification_token_expires: expiresAt.toISOString(),
        email_verification_status: 'code_sent'
      })
      .eq('id', verification.id)
    
    if (updateError) throw updateError
    
    // In production, send email here using your email service
    // For now, we'll return success and the OTP in development
    const isDev = process.env.NODE_ENV === 'development'
    
    // TODO: Send email with OTP
    // await sendVerificationEmail(verification.official_email, otp)
    
    console.log(`[DEV] Email verification OTP for ${verification.official_email}: ${otp}`)
    
    return NextResponse.json({
      message: 'Verification code sent to ' + verification.official_email,
      expires_at: expiresAt.toISOString(),
      // Only include OTP in development
      ...(isDev && { dev_otp: otp })
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT /api/organizations/[id]/email-verify
// Verify OTP and confirm email
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Check permission
  const permission = await requireOrgRole(request, organizationId, ['org_owner', 'org_admin'])
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const { otp } = body
    
    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Valid 6-digit OTP is required' },
        { status: 400 }
      )
    }
    
    // Get verification record
    const { data: verification, error: fetchError } = await adminClient
      .from('organization_verification')
      .select('id, email_verification_token, email_verification_token_expires, email_verification_status')
      .eq('organization_id', organizationId)
      .single()
    
    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification record not found' },
        { status: 400 }
      )
    }
    
    // Check if already verified
    if (verification.email_verification_status === 'verified') {
      return NextResponse.json({
        message: 'Email is already verified',
        verified: true
      })
    }
    
    // Check if code was sent
    if (verification.email_verification_status !== 'code_sent') {
      return NextResponse.json(
        { error: 'Please request a verification code first' },
        { status: 400 }
      )
    }
    
    // Check expiration
    if (new Date(verification.email_verification_token_expires!) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }
    
    // Verify OTP
    if (verification.email_verification_token !== otp) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }
    
    // Mark as verified
    const { error: updateError } = await adminClient
      .from('organization_verification')
      .update({
        email_verification_status: 'verified',
        email_verified_at: new Date().toISOString(),
        email_verification_token: null,
        email_verification_token_expires: null
      })
      .eq('id', verification.id)
    
    if (updateError) throw updateError
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: 'updated',
      performedBy: permission.userId!,
      comments: 'Email verified successfully',
      details: { email_verified: true },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

// ============================================
// GET /api/organizations/[id]/email-verify
// Check email domain validity
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    )
  }
  
  try {
    const validation = await validateOrgEmail(email)
    
    return NextResponse.json({
      email,
      domain: email.split('@')[1]?.toLowerCase(),
      ...validation
    })
  } catch (error) {
    console.error('Error validating email:', error)
    return NextResponse.json(
      { error: 'Failed to validate email' },
      { status: 500 }
    )
  }
}
