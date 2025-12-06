/**
 * Admin Verification Call Logs API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for admins to log verification phone calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { 
  requireAdmin,
  logVerificationAudit,
  getClientIP,
  getUserAgent
} from '@/lib/org-rbac'
import type { 
  PhoneVerificationStatus,
  PhoneSource,
  VerificationQuestion
} from '@/lib/org-verification.types'

// ============================================
// GET /api/admin/verifications/[id]/calls
// Get all call logs for an organization
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
    const { data: callLogs, error } = await adminClient
      .from('organization_call_logs')
      .select(`
        *,
        caller:profiles(id, name, email)
      `)
      .eq('organization_id', organizationId)
      .order('called_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({ call_logs: callLogs || [] })
  } catch (error) {
    console.error('Error fetching call logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call logs' },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/admin/verifications/[id]/calls
// Log a new verification call
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
      phone_called,
      phone_source,
      phone_source_url,
      scheduled_at,
      call_status,
      answered_by,
      answered_by_position,
      verification_questions,
      call_summary,
      verification_result,
      follow_up_required,
      follow_up_notes,
      call_duration_seconds
    } = body as {
      phone_called: string
      phone_source: PhoneSource
      phone_source_url?: string
      scheduled_at?: string
      call_status: PhoneVerificationStatus
      answered_by?: string
      answered_by_position?: string
      verification_questions?: VerificationQuestion[]
      call_summary?: string
      verification_result?: boolean
      follow_up_required?: boolean
      follow_up_notes?: string
      call_duration_seconds?: number
    }
    
    // Validate required fields
    if (!phone_called || !phone_source || !call_status) {
      return NextResponse.json(
        { error: 'phone_called, phone_source, and call_status are required' },
        { status: 400 }
      )
    }
    
    // Create call log
    const { data: callLog, error } = await adminClient
      .from('organization_call_logs')
      .insert({
        organization_id: organizationId,
        caller_id: permission.userId,
        phone_called,
        phone_source,
        phone_source_url,
        scheduled_at,
        called_at: new Date().toISOString(),
        call_status,
        answered_by,
        answered_by_position,
        verification_questions: verification_questions || [],
        call_summary,
        verification_result,
        follow_up_required: follow_up_required || false,
        follow_up_notes,
        call_duration_seconds
      } as any)
      .select()
      .single()
    
    if (error) throw error
    
    // If verification was completed, update org status
    if (call_status === 'completed_verified' || call_status === 'completed_failed') {
      // Get current verification status
      const { data: verification } = await adminClient
        .from('organization_verification')
        .select('id, verification_status')
        .eq('organization_id', organizationId)
        .single()
      
      if (verification && verification.verification_status === 'pending_call') {
        // Move back to under_review after call
        await adminClient
          .from('organization_verification')
          .update({ verification_status: 'under_review' })
          .eq('id', verification.id)
      }
    }
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: 'call_completed',
      performedBy: permission.userId!,
      comments: call_summary,
      details: {
        phone_called,
        phone_source,
        call_status,
        verification_result,
        answered_by
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ call_log: callLog }, { status: 201 })
  } catch (error) {
    console.error('Error creating call log:', error)
    return NextResponse.json(
      { error: 'Failed to create call log' },
      { status: 500 }
    )
  }
}
