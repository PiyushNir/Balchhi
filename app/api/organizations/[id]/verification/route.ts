/**
 * Organization Verification API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for organization verification workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { 
  requireOrgRole, 
  requireOrgAction,
  validateOrgEmail,
  logVerificationAudit,
  getClientIP,
  getUserAgent
} from '@/lib/org-rbac'
import type {
  OrganizationVerificationInsert,
  OrganizationContactInsert,
  OrgVerificationStatus
} from '@/lib/org-verification.types'

// ============================================
// GET /api/organizations/[id]/verification
// Get verification details for an organization
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  const supabase = createServerClient()
  
  // Check user has access
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  const permission = await requireOrgAction(request, organizationId, 'view')
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Get verification details
    const { data: verification, error: verError } = await adminClient
      .from('organization_verification')
      .select('*')
      .eq('organization_id', organizationId)
      .single()
    
    // Get contacts
    const { data: contacts } = await adminClient
      .from('organization_contacts')
      .select(`
        *,
        user:profiles(id, name, email, avatar_url)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('is_primary_contact', { ascending: false })
    
    // Get audit trail (limited)
    const { data: auditTrail } = await adminClient
      .from('organization_verification_audit')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Get contract if exists
    const { data: contract } = await adminClient
      .from('organization_contracts')
      .select('*')
      .eq('organization_id', organizationId)
      .single()
    
    return NextResponse.json({
      verification,
      contacts: contacts || [],
      audit_trail: auditTrail || [],
      contract
    })
  } catch (error) {
    console.error('Error fetching verification details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification details' },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/organizations/[id]/verification
// Submit or update verification details
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Check permission
  const permission = await requireOrgAction(request, organizationId, 'edit_verification')
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const {
      registered_name,
      registration_type,
      registration_number,
      registration_date,
      registration_authority,
      province,
      district,
      municipality,
      ward_number,
      street_address,
      postal_code,
      official_email,
      official_phone,
      official_phone_alt,
      official_website,
      registration_certificate_url,
      pan_certificate_url,
      vat_certificate_url,
      letterhead_url,
      other_documents
    } = body
    
    // Validate required fields
    if (!registered_name || !registration_type || !registration_number ||
        !province || !district || !municipality || !official_email || !official_phone) {
      return NextResponse.json(
        { error: 'Missing required verification fields' },
        { status: 400 }
      )
    }
    
    // Validate email domain
    const emailValidation = await validateOrgEmail(official_email)
    if (!emailValidation.valid) {
      return NextResponse.json({
        error: emailValidation.message,
        email_validation: emailValidation
      }, { status: 400 })
    }
    
    // Extract domain
    const email_domain = official_email.split('@')[1]?.toLowerCase()
    
    // Check if verification record exists
    const { data: existing } = await adminClient
      .from('organization_verification')
      .select('id, verification_status')
      .eq('organization_id', organizationId)
      .single()
    
    const verificationData: Partial<OrganizationVerificationInsert> = {
      registered_name,
      registration_type,
      registration_number,
      registration_date,
      registration_authority,
      province,
      district,
      municipality,
      ward_number,
      street_address,
      postal_code,
      official_email,
      official_phone,
      official_phone_alt,
      official_website,
      email_domain,
      is_generic_email: emailValidation.isBlocked,
      registration_certificate_url,
      pan_certificate_url,
      vat_certificate_url,
      letterhead_url,
      other_documents: other_documents || []
    }
    
    let verification
    let action: string
    
    if (existing) {
      // Update existing - only if not yet approved
      if (existing.verification_status === 'approved') {
        return NextResponse.json(
          { error: 'Cannot modify approved verification. Contact support for changes.' },
          { status: 400 }
        )
      }
      
      const { data, error } = await adminClient
        .from('organization_verification')
        .update(verificationData as any)
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      verification = data
      action = 'updated'
    } else {
      // Create new
      const { data, error } = await adminClient
        .from('organization_verification')
        .insert({
          ...verificationData,
          organization_id: organizationId
        } as any)
        .select()
        .single()
      
      if (error) throw error
      verification = data
      action = 'created'
    }
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action,
      performedBy: permission.userId!,
      details: { updated_fields: Object.keys(verificationData) },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ 
      verification,
      email_validation: emailValidation
    })
  } catch (error) {
    console.error('Error saving verification:', error)
    return NextResponse.json(
      { error: 'Failed to save verification details' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT /api/organizations/[id]/verification/submit
// Submit verification for review
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Check permission
  const permission = await requireOrgAction(request, organizationId, 'submit_verification')
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Get current verification
    const { data: verification, error: fetchError } = await adminClient
      .from('organization_verification')
      .select('*')
      .eq('organization_id', organizationId)
      .single()
    
    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Please complete verification details before submitting' },
        { status: 400 }
      )
    }
    
    // Check if already submitted
    if (!['draft', 'rejected'].includes(verification.verification_status || '')) {
      return NextResponse.json(
        { error: `Verification is already ${verification.verification_status}` },
        { status: 400 }
      )
    }
    
    // Validate required documents
    if (!verification.registration_certificate_url) {
      return NextResponse.json(
        { error: 'Registration certificate is required' },
        { status: 400 }
      )
    }
    
    // Check if primary contact exists
    const { data: primaryContact } = await adminClient
      .from('organization_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_primary_contact', true)
      .eq('is_active', true)
      .single()
    
    if (!primaryContact) {
      return NextResponse.json(
        { error: 'Please add a primary contact person' },
        { status: 400 }
      )
    }
    
    const previousStatus = verification.verification_status as OrgVerificationStatus
    
    // Update status to submitted
    const { data: updated, error: updateError } = await adminClient
      .from('organization_verification')
      .update({
        verification_status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', verification.id)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Also update org's verification_submitted_at
    await adminClient
      .from('organizations')
      .update({ 
        verification_submitted_at: new Date().toISOString(),
        verification_status: 'submitted'
      })
      .eq('id', organizationId)
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: 'submitted',
      performedBy: permission.userId!,
      previousStatus,
      newStatus: 'submitted',
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({
      message: 'Verification submitted successfully',
      verification: updated
    })
  } catch (error) {
    console.error('Error submitting verification:', error)
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    )
  }
}
