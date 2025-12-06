/**
 * Admin Verification Review API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for admins to review and approve/reject organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { 
  requireAdmin,
  logVerificationAudit,
  getClientIP,
  getUserAgent
} from '@/lib/org-rbac'
import type { OrgVerificationStatus, RejectionCategory } from '@/lib/org-verification.types'

// ============================================
// GET /api/admin/verifications/[id]
// Get full verification details for an organization
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  const permission = await requireAdmin(request)
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Get organization
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()
    
    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    // Get verification details
    const { data: verification } = await adminClient
      .from('organization_verification')
      .select('*')
      .eq('organization_id', organizationId)
      .single()
    
    // Get contacts
    const { data: contacts } = await adminClient
      .from('organization_contacts')
      .select(`
        *,
        user:profiles(id, name, email, avatar_url, phone, is_verified)
      `)
      .eq('organization_id', organizationId)
      .order('is_primary_contact', { ascending: false })
    
    // Get call logs
    const { data: callLogs } = await adminClient
      .from('organization_call_logs')
      .select(`
        *,
        caller:profiles(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('called_at', { ascending: false })
    
    // Get audit trail
    const { data: auditTrail } = await adminClient
      .from('organization_verification_audit')
      .select(`
        *,
        performer:profiles(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    // Get contract
    const { data: contract } = await adminClient
      .from('organization_contracts')
      .select('*')
      .eq('organization_id', organizationId)
      .single()
    
    return NextResponse.json({
      organization,
      verification,
      contacts: contacts || [],
      call_logs: callLogs || [],
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
// POST /api/admin/verifications/[id]
// Perform review action (approve/reject/etc)
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  const permission = await requireAdmin(request)
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const {
      action,
      comments,
      rejection_reason,
      rejection_category
    } = body as {
      action: 'start_review' | 'approve' | 'reject' | 'request_documents' | 'schedule_call' | 'suspend' | 'reactivate'
      comments?: string
      rejection_reason?: string
      rejection_category?: RejectionCategory
    }
    
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }
    
    // Get current verification
    const { data: verification, error: fetchError } = await adminClient
      .from('organization_verification')
      .select('id, verification_status')
      .eq('organization_id', organizationId)
      .single()
    
    if (fetchError || !verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }
    
    const previousStatus = verification.verification_status as OrgVerificationStatus
    let newStatus: OrgVerificationStatus
    let auditAction: string
    
    // Validate action based on current status
    switch (action) {
      case 'start_review':
        if (!['submitted'].includes(previousStatus)) {
          return NextResponse.json(
            { error: 'Can only start review on submitted verifications' },
            { status: 400 }
          )
        }
        newStatus = 'under_review'
        auditAction = 'review_started'
        break
        
      case 'approve':
        if (!['under_review', 'pending_call', 'pending_documents'].includes(previousStatus)) {
          return NextResponse.json(
            { error: 'Invalid status for approval' },
            { status: 400 }
          )
        }
        newStatus = 'approved'
        auditAction = 'approved'
        break
        
      case 'reject':
        if (!['under_review', 'pending_call', 'pending_documents'].includes(previousStatus)) {
          return NextResponse.json(
            { error: 'Invalid status for rejection' },
            { status: 400 }
          )
        }
        if (!rejection_reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          )
        }
        newStatus = 'rejected'
        auditAction = 'rejected'
        break
        
      case 'request_documents':
        if (!['under_review'].includes(previousStatus)) {
          return NextResponse.json(
            { error: 'Invalid status for requesting documents' },
            { status: 400 }
          )
        }
        newStatus = 'pending_documents'
        auditAction = 'document_requested'
        break
        
      case 'schedule_call':
        if (!['under_review', 'pending_documents'].includes(previousStatus)) {
          return NextResponse.json(
            { error: 'Invalid status for scheduling call' },
            { status: 400 }
          )
        }
        newStatus = 'pending_call'
        auditAction = 'call_scheduled'
        break
        
      case 'suspend':
        if (previousStatus !== 'approved') {
          return NextResponse.json(
            { error: 'Can only suspend approved organizations' },
            { status: 400 }
          )
        }
        newStatus = 'suspended'
        auditAction = 'suspended'
        break
        
      case 'reactivate':
        if (previousStatus !== 'suspended') {
          return NextResponse.json(
            { error: 'Can only reactivate suspended organizations' },
            { status: 400 }
          )
        }
        newStatus = 'approved'
        auditAction = 'reactivated'
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Update verification status
    const { error: updateError } = await adminClient
      .from('organization_verification')
      .update({ verification_status: newStatus })
      .eq('id', verification.id)
    
    if (updateError) throw updateError
    
    // Update organization table as well
    const orgUpdate: Record<string, unknown> = {
      verification_status: newStatus,
      can_post_items: newStatus === 'approved',
      can_manage_claims: newStatus === 'approved'
    }
    
    if (newStatus === 'approved') {
      orgUpdate.verification_approved_at = new Date().toISOString()
      orgUpdate.verification_approved_by = permission.userId
      orgUpdate.is_verified = true
    }
    
    if (newStatus === 'suspended') {
      orgUpdate.suspended_at = new Date().toISOString()
      orgUpdate.suspended_by = permission.userId
      orgUpdate.suspension_reason = rejection_reason || comments
    }
    
    if (newStatus === 'approved' && previousStatus === 'suspended') {
      orgUpdate.suspended_at = null
      orgUpdate.suspended_by = null
      orgUpdate.suspension_reason = null
    }
    
    await adminClient
      .from('organizations')
      .update(orgUpdate)
      .eq('id', organizationId)
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: auditAction,
      performedBy: permission.userId!,
      previousStatus,
      newStatus,
      comments,
      rejectionReason: rejection_reason,
      rejectionCategory: rejection_category,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    // TODO: Send notification to organization
    
    return NextResponse.json({
      message: `Verification ${auditAction} successfully`,
      previous_status: previousStatus,
      new_status: newStatus
    })
  } catch (error) {
    console.error('Error processing review action:', error)
    return NextResponse.json(
      { error: 'Failed to process review action' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT /api/admin/verifications/[id]
// Update verification details (admin override)
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  const permission = await requireAdmin(request)
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const { 
      override_generic_email,
      override_reason,
      trust_score,
      ...otherUpdates 
    } = body
    
    // Get current verification
    const { data: verification, error: fetchError } = await adminClient
      .from('organization_verification')
      .select('id')
      .eq('organization_id', organizationId)
      .single()
    
    if (fetchError || !verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }
    
    const updates: Record<string, unknown> = { ...otherUpdates }
    
    // Handle generic email override
    if (override_generic_email) {
      updates.email_verification_status = 'manual_override'
      updates.generic_email_override_by = permission.userId
      updates.generic_email_override_reason = override_reason
      updates.email_verified_at = new Date().toISOString()
    }
    
    // Update verification
    const { data: updated, error: updateError } = await adminClient
      .from('organization_verification')
      .update(updates)
      .eq('id', verification.id)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Update trust score on organization if provided
    if (trust_score !== undefined) {
      await adminClient
        .from('organizations')
        .update({ trust_score })
        .eq('id', organizationId)
    }
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: override_generic_email ? 'manual_override' : 'updated',
      performedBy: permission.userId!,
      comments: override_generic_email ? `Email override: ${override_reason}` : 'Admin update',
      details: { updated_fields: Object.keys(updates) },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ verification: updated })
  } catch (error) {
    console.error('Error updating verification:', error)
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    )
  }
}
