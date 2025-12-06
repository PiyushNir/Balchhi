/**
 * Organization RBAC (Role-Based Access Control) Middleware
 * Nepal Lost & Found Platform - KhojPayo
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from './supabase'
import type { 
  OrgMemberRole, 
  OrgVerificationStatus, 
  PermissionCheckResult 
} from './org-verification.types'

// ============================================
// PERMISSION DEFINITIONS
// ============================================

/** Actions that can be performed on organizations */
export type OrgAction = 
  | 'view'
  | 'edit_verification'
  | 'submit_verification'
  | 'post_item'
  | 'manage_claim'
  | 'manage_members'
  | 'manage_settings'
  | 'transfer_ownership'
  | 'view_analytics'
  | 'view_contracts'
  | 'manage_contracts'

/** Role to permissions mapping */
const ROLE_PERMISSIONS: Record<OrgMemberRole, OrgAction[]> = {
  org_owner: [
    'view', 'edit_verification', 'submit_verification', 'post_item', 
    'manage_claim', 'manage_members', 'manage_settings', 'transfer_ownership',
    'view_analytics', 'view_contracts', 'manage_contracts'
  ],
  org_admin: [
    'view', 'edit_verification', 'submit_verification', 'post_item', 
    'manage_claim', 'manage_members', 'manage_settings',
    'view_analytics', 'view_contracts'
  ],
  org_staff: [
    'view', 'post_item', 'manage_claim', 'view_analytics'
  ],
  org_viewer: [
    'view', 'view_analytics'
  ]
}

/** Actions that require approved organization status */
const REQUIRES_APPROVAL: OrgAction[] = [
  'post_item', 'manage_claim'
]

/** Actions allowed even when org is not approved */
const ALLOWED_PRE_APPROVAL: OrgAction[] = [
  'view', 'edit_verification', 'submit_verification', 'manage_members', 
  'manage_settings', 'view_analytics'
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract domain from email address
 */
export function extractEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || ''
}

/**
 * Check if email uses a blocked (generic) domain
 * NOTE: After running migration, these tables will exist
 */
export async function isBlockedEmailDomain(email: string): Promise<boolean> {
  const supabase = createAdminClient()
  const domain = extractEmailDomain(email)
  
  const { data } = await (supabase
    .from('blocked_email_domains' as any) as any)
    .select('domain')
    .eq('domain', domain)
    .single()
  
  return !!data
}

/**
 * Check if email uses an approved official domain
 */
export async function checkApprovedDomain(email: string): Promise<{
  isApproved: boolean
  trustLevel: number
}> {
  const supabase = createAdminClient()
  const domain = extractEmailDomain(email)
  
  // Check exact match first
  const { data } = await (supabase
    .from('approved_org_domains' as any) as any)
    .select('trust_level')
    .eq('domain', domain)
    .single()
  
  if (data) {
    return { isApproved: true, trustLevel: (data as any).trust_level }
  }
  
  // Check if it's a subdomain of approved domain (e.g., sub.gov.np matches gov.np)
  const { data: domains } = await (supabase
    .from('approved_org_domains' as any) as any)
    .select('domain, trust_level')
  
  if (domains) {
    for (const d of domains as any[]) {
      if (domain.endsWith('.' + d.domain)) {
        return { isApproved: true, trustLevel: d.trust_level }
      }
    }
  }
  
  return { isApproved: false, trustLevel: 0 }
}

/**
 * Validate email domain for organization registration
 */
export async function validateOrgEmail(email: string): Promise<{
  valid: boolean
  isBlocked: boolean
  isApproved: boolean
  trustLevel: number
  requiresManualOverride: boolean
  message: string
}> {
  const isBlocked = await isBlockedEmailDomain(email)
  const { isApproved, trustLevel } = await checkApprovedDomain(email)
  
  if (isBlocked) {
    return {
      valid: false,
      isBlocked: true,
      isApproved: false,
      trustLevel: 0,
      requiresManualOverride: true,
      message: 'Generic email providers (Gmail, Yahoo, etc.) are not allowed. Please use your official organization email. Contact support if you need a manual override.'
    }
  }
  
  if (isApproved) {
    return {
      valid: true,
      isBlocked: false,
      isApproved: true,
      trustLevel,
      requiresManualOverride: false,
      message: 'Email domain is pre-approved as an official organization domain.'
    }
  }
  
  // Not blocked, not pre-approved - allowed but will need verification
  return {
    valid: true,
    isBlocked: false,
    isApproved: false,
    trustLevel: 1,
    requiresManualOverride: false,
    message: 'Email domain accepted. Email verification will be required.'
  }
}

/**
 * Get user's role in an organization
 * NOTE: member_role column added via migration
 */
export async function getUserOrgRole(
  userId: string, 
  organizationId: string
): Promise<OrgMemberRole | null> {
  const supabase = createAdminClient()
  
  const { data } = await (supabase
    .from('organization_members') as any)
    .select('member_role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()
  
  return (data as any)?.member_role as OrgMemberRole | null
}

/**
 * Get organization's verification status
 * NOTE: verification_status, can_post_items, can_manage_claims columns added via migration
 */
export async function getOrgVerificationStatus(
  organizationId: string
): Promise<{
  status: OrgVerificationStatus
  canPostItems: boolean
  canManageClaims: boolean
  isActive: boolean
} | null> {
  const supabase = createAdminClient()
  
  const { data } = await (supabase
    .from('organizations') as any)
    .select('verification_status, can_post_items, can_manage_claims, is_active')
    .eq('id', organizationId)
    .single()
  
  if (!data) return null
  
  const row = data as any
  return {
    status: row.verification_status as OrgVerificationStatus,
    canPostItems: row.can_post_items,
    canManageClaims: row.can_manage_claims,
    isActive: row.is_active
  }
}

/**
 * Check if user can perform an action on an organization
 */
export async function canUserPerformAction(
  userId: string,
  organizationId: string,
  action: OrgAction
): Promise<PermissionCheckResult> {
  // Get user's role
  const role = await getUserOrgRole(userId, organizationId)
  
  if (!role) {
    return {
      allowed: false,
      reason: 'User is not a member of this organization'
    }
  }
  
  // Check if role has permission for this action
  const rolePermissions = ROLE_PERMISSIONS[role]
  if (!rolePermissions.includes(action)) {
    return {
      allowed: false,
      reason: `Your role (${role}) does not have permission for this action`,
      user_role: role
    }
  }
  
  // Get organization status
  const orgStatus = await getOrgVerificationStatus(organizationId)
  
  if (!orgStatus) {
    return {
      allowed: false,
      reason: 'Organization not found'
    }
  }
  
  if (!orgStatus.isActive) {
    return {
      allowed: false,
      reason: 'Organization is not active',
      org_status: orgStatus.status,
      user_role: role
    }
  }
  
  // Check if action requires approved status
  if (REQUIRES_APPROVAL.includes(action)) {
    if (orgStatus.status !== 'approved') {
      return {
        allowed: false,
        reason: 'Organization must be verified and approved to perform this action',
        org_status: orgStatus.status,
        user_role: role
      }
    }
    
    // Additional check for specific actions
    if (action === 'post_item' && !orgStatus.canPostItems) {
      return {
        allowed: false,
        reason: 'Organization is not authorized to post items',
        org_status: orgStatus.status,
        user_role: role
      }
    }
    
    if (action === 'manage_claim' && !orgStatus.canManageClaims) {
      return {
        allowed: false,
        reason: 'Organization is not authorized to manage claims',
        org_status: orgStatus.status,
        user_role: role
      }
    }
  }
  
  return {
    allowed: true,
    org_status: orgStatus.status,
    user_role: role
  }
}

/**
 * Check if user is a platform admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  return data?.role === 'admin'
}

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Middleware to require organization membership
 */
export async function requireOrgMembership(
  request: NextRequest,
  organizationId: string
): Promise<{ allowed: boolean; userId?: string; role?: OrgMemberRole; error?: NextResponse }> {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const role = await getUserOrgRole(user.id, organizationId)
  
  if (!role) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'You are not a member of this organization' }, 
        { status: 403 }
      )
    }
  }
  
  return { allowed: true, userId: user.id, role }
}

/**
 * Middleware to require specific organization role
 */
export async function requireOrgRole(
  request: NextRequest,
  organizationId: string,
  requiredRoles: OrgMemberRole[]
): Promise<{ allowed: boolean; userId?: string; role?: OrgMemberRole; error?: NextResponse }> {
  const result = await requireOrgMembership(request, organizationId)
  
  if (!result.allowed) {
    return result
  }
  
  if (!requiredRoles.includes(result.role!)) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: `This action requires one of these roles: ${requiredRoles.join(', ')}` },
        { status: 403 }
      )
    }
  }
  
  return result
}

/**
 * Middleware to require organization action permission
 */
export async function requireOrgAction(
  request: NextRequest,
  organizationId: string,
  action: OrgAction
): Promise<{ allowed: boolean; userId?: string; role?: OrgMemberRole; error?: NextResponse }> {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const permResult = await canUserPerformAction(user.id, organizationId, action)
  
  if (!permResult.allowed) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: permResult.reason },
        { status: 403 }
      )
    }
  }
  
  return { 
    allowed: true, 
    userId: user.id, 
    role: permResult.user_role 
  }
}

/**
 * Middleware to require platform admin
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ allowed: boolean; userId?: string; error?: NextResponse }> {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const isAdmin = await isUserAdmin(user.id)
  
  if (!isAdmin) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'This action requires platform administrator privileges' },
        { status: 403 }
      )
    }
  }
  
  return { allowed: true, userId: user.id }
}

/**
 * Middleware to require approved organization for item/claim operations
 */
export async function requireApprovedOrg(
  request: NextRequest,
  organizationId: string
): Promise<{ allowed: boolean; userId?: string; error?: NextResponse }> {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  // Check membership
  const role = await getUserOrgRole(user.id, organizationId)
  if (!role) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      )
    }
  }
  
  // Check org status
  const orgStatus = await getOrgVerificationStatus(organizationId)
  if (!orgStatus || orgStatus.status !== 'approved') {
    return {
      allowed: false,
      error: NextResponse.json(
        { 
          error: 'Organization must be verified and approved',
          verification_status: orgStatus?.status 
        },
        { status: 403 }
      )
    }
  }
  
  return { allowed: true, userId: user.id }
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log an audit entry for organization verification
 * NOTE: organization_verification_audit table created via migration
 */
export async function logVerificationAudit(params: {
  organizationId: string
  action: string
  performedBy: string
  previousStatus?: OrgVerificationStatus
  newStatus?: OrgVerificationStatus
  comments?: string
  details?: Record<string, unknown>
  rejectionReason?: string
  rejectionCategory?: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  const supabase = createAdminClient()
  
  await (supabase.from('organization_verification_audit' as any) as any).insert({
    organization_id: params.organizationId,
    action: params.action,
    performed_by: params.performedBy,
    previous_status: params.previousStatus,
    new_status: params.newStatus,
    comments: params.comments,
    details: params.details,
    rejection_reason: params.rejectionReason,
    rejection_category: params.rejectionCategory,
    ip_address: params.ipAddress,
    user_agent: params.userAgent
  })
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         undefined
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined
}
