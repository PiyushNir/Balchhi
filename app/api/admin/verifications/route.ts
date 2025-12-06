/**
 * Admin Verification Management API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for platform admins to manage organization verification
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
  OrgVerificationStatus,
  VerificationDashboardStats 
} from '@/lib/org-verification.types'

// ============================================
// GET /api/admin/verifications
// List all organization verifications (with filters)
// ============================================
export async function GET(request: NextRequest) {
  // Check admin permission
  const permission = await requireAdmin(request)
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)
  
  const status = searchParams.get('status') as OrgVerificationStatus | null
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sortBy = searchParams.get('sort_by') || 'submitted_at'
  const sortOrder = searchParams.get('sort_order') === 'asc' ? true : false
  
  try {
    let query = adminClient
      .from('organization_verification')
      .select(`
        *,
        organization:organizations(id, name, type, logo_url, is_active),
        primary_contact:organization_contacts(full_name, email, phone)
      `, { count: 'exact' })
    
    // Filter by status
    if (status) {
      query = query.eq('verification_status', status)
    }
    
    // Search by name or registration number
    if (search) {
      query = query.or(`registered_name.ilike.%${search}%,registration_number.ilike.%${search}%`)
    }
    
    // Filter only primary contacts
    query = query.eq('primary_contact.is_primary_contact', true)
    
    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Sorting
    query = query.order(sortBy, { ascending: sortOrder })
    
    const { data: verifications, count, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      verifications: verifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching verifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    )
  }
}

// ============================================
// GET /api/admin/verifications/stats
// Get dashboard statistics
// ============================================
export async function getStats(request: NextRequest) {
  const permission = await requireAdmin(request)
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Get counts by status
    const { data: statusCounts } = await adminClient
      .from('organization_verification')
      .select('verification_status')
    
    const counts: Record<string, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      pending_call: 0,
      pending_documents: 0,
      approved: 0,
      rejected: 0,
      suspended: 0
    }
    
    statusCounts?.forEach(row => {
      if (row.verification_status) {
        counts[row.verification_status] = (counts[row.verification_status] || 0) + 1
      }
    })
    
    // Get this week's counts
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { count: weekSubmissions } = await adminClient
      .from('organization_verification')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', weekAgo.toISOString())
    
    const { data: weekApprovals } = await adminClient
      .from('organization_verification_audit')
      .select('id')
      .eq('action', 'approved')
      .gte('created_at', weekAgo.toISOString())
    
    const stats: VerificationDashboardStats = {
      total_pending: counts.submitted,
      total_under_review: counts.under_review,
      total_pending_call: counts.pending_call,
      total_pending_documents: counts.pending_documents,
      total_approved: counts.approved,
      total_rejected: counts.rejected,
      total_suspended: counts.suspended,
      avg_approval_time_days: 0, // TODO: Calculate from audit trail
      this_week_submissions: weekSubmissions || 0,
      this_week_approvals: weekApprovals?.length || 0
    }
    
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
