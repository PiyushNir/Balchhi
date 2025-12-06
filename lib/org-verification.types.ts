/**
 * Organization Verification System Types
 * Nepal Lost & Found Platform - KhojPayo
 */

import type { Database } from './database.types'

// Helper type aliases from database
export type Json = Database['public']['Tables']['activity_logs']['Row']['details']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']

// ============================================
// NEW ENUM TYPES
// ============================================

/** Organization verification workflow status */
export type OrgVerificationStatus = 
  | 'draft'           // Initial creation, not yet submitted
  | 'submitted'       // Submitted for review
  | 'under_review'    // Being reviewed by admin
  | 'pending_call'    // Awaiting phone verification callback
  | 'pending_documents' // Awaiting additional documents
  | 'rejected'        // Rejected (can resubmit)
  | 'approved'        // Fully approved
  | 'suspended'       // Suspended (was approved, now restricted)

/** Nepal registration/license types */
export type NepalRegistrationType =
  | 'company_registrar'    // Office of Company Registrar
  | 'pan'                  // Permanent Account Number
  | 'vat'                  // VAT Registration
  | 'education_board'      // Education board registration
  | 'hospital_license'     // Health facility license
  | 'hotel_license'        // Tourism license for hotels
  | 'transport_license'    // Transport authority license
  | 'police_unit'          // Police station code
  | 'government_office'    // Government office code
  | 'bank_license'         // Nepal Rastra Bank license
  | 'ngo_registration'     // Social Welfare Council registration
  | 'other'

/** Contact person role in organization */
export type OrgContactRole =
  | 'owner'           // Business owner
  | 'director'        // Director/Board member
  | 'manager'         // General manager
  | 'it_admin'        // IT/System administrator
  | 'operations'      // Operations manager
  | 'hr'              // HR representative
  | 'other'

/** Phone verification status */
export type PhoneVerificationStatus =
  | 'not_started'
  | 'scheduled'
  | 'in_progress'
  | 'completed_verified'
  | 'completed_failed'
  | 'unreachable'

/** Contract status */
export type ContractStatus =
  | 'none'
  | 'draft'
  | 'pending_signature'
  | 'signed'
  | 'active'
  | 'expired'
  | 'terminated'

/** Email domain verification status */
export type EmailVerificationStatus =
  | 'pending'
  | 'code_sent'
  | 'verified'
  | 'failed'
  | 'manual_override'

/** Enhanced organization member roles */
export type OrgMemberRole =
  | 'org_owner'       // Full control, can transfer ownership
  | 'org_admin'       // Can manage members, items, claims
  | 'org_staff'       // Can manage items and claims
  | 'org_viewer'      // Read-only access

/** Phone source for verification calls */
export type PhoneSource =
  | 'provided'           // Number provided by org
  | 'website'            // Found on their website
  | 'google_listing'     // Google Business listing
  | 'official_directory' // Government/official directory
  | 'other'

/** Contract types */
export type ContractType =
  | 'standard'
  | 'premium'
  | 'enterprise'
  | 'government'
  | 'ngo'
  | 'educational'

/** Verification audit actions */
export type VerificationAuditAction =
  | 'created'
  | 'submitted'
  | 'assigned_reviewer'
  | 'review_started'
  | 'document_requested'
  | 'document_received'
  | 'call_scheduled'
  | 'call_completed'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'reactivated'
  | 'updated'
  | 'contact_added'
  | 'contact_removed'
  | 'contract_uploaded'
  | 'contract_signed'
  | 'manual_override'

/** Rejection categories */
export type RejectionCategory =
  | 'invalid_registration'
  | 'document_mismatch'
  | 'unverifiable_contact'
  | 'suspicious_activity'
  | 'incomplete_info'
  | 'failed_phone_verification'
  | 'other'

// ============================================
// TABLE TYPES
// ============================================

/** Organization verification details */
export interface OrganizationVerification {
  id: string
  organization_id: string
  
  // Registration details
  registered_name: string
  registration_type: NepalRegistrationType
  registration_number: string
  registration_date: string | null
  registration_authority: string | null
  
  // Nepal address breakdown
  province: string
  district: string
  municipality: string
  ward_number: number | null
  street_address: string | null
  postal_code: string | null
  
  // Official contact details
  official_email: string
  official_phone: string
  official_phone_alt: string | null
  official_website: string | null
  
  // Domain verification
  email_domain: string | null
  email_verification_status: EmailVerificationStatus
  email_verification_token: string | null
  email_verification_token_expires: string | null
  email_verified_at: string | null
  is_generic_email: boolean
  generic_email_override_by: string | null
  generic_email_override_reason: string | null
  
  // Document evidence
  registration_certificate_url: string | null
  pan_certificate_url: string | null
  vat_certificate_url: string | null
  letterhead_url: string | null
  other_documents: DocumentAttachment[]
  
  // Verification workflow
  verification_status: OrgVerificationStatus
  submitted_at: string | null
  
  created_at: string
  updated_at: string
}

/** Document attachment structure */
export interface DocumentAttachment {
  name: string
  url: string
  type: 'pdf' | 'image' | 'other'
  uploaded_at?: string
}

/** Organization verification insert type */
export type OrganizationVerificationInsert = Omit<OrganizationVerification, 
  'id' | 'created_at' | 'updated_at' | 'email_verified_at' | 'submitted_at'
> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** Organization verification update type */
export type OrganizationVerificationUpdate = Partial<Omit<OrganizationVerification, 
  'id' | 'organization_id' | 'created_at'
>>

// ============================================
// ORGANIZATION CONTACTS
// ============================================

/** Organization contact person */
export interface OrganizationContact {
  id: string
  organization_id: string
  user_id: string
  
  // Contact details
  full_name: string
  position_title: string
  role: OrgContactRole
  department: string | null
  
  // Contact info
  email: string
  phone: string
  phone_alt: string | null
  
  // Identity verification
  id_type: 'citizenship' | 'passport' | 'driving_license' | 'employee_id' | null
  id_number_hash: string | null
  id_document_url: string | null
  
  // Verification status
  is_primary_contact: boolean
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  
  // Authorization level
  can_manage_items: boolean
  can_manage_claims: boolean
  can_manage_members: boolean
  can_view_analytics: boolean
  
  // Status
  is_active: boolean
  deactivated_at: string | null
  deactivated_by: string | null
  deactivation_reason: string | null
  
  created_at: string
  updated_at: string
}

export type OrganizationContactInsert = Omit<OrganizationContact,
  'id' | 'created_at' | 'updated_at' | 'verified_at' | 'deactivated_at'
> & {
  id?: string
}

export type OrganizationContactUpdate = Partial<Omit<OrganizationContact,
  'id' | 'organization_id' | 'user_id' | 'created_at'
>>

// ============================================
// CALL LOGS
// ============================================

/** Phone verification call log */
export interface OrganizationCallLog {
  id: string
  organization_id: string
  caller_id: string
  
  // Phone numbers
  phone_called: string
  phone_source: PhoneSource
  phone_source_url: string | null
  
  // Call timing
  scheduled_at: string | null
  called_at: string
  call_duration_seconds: number | null
  
  // Call result
  call_status: PhoneVerificationStatus
  answered_by: string | null
  answered_by_position: string | null
  
  // Verification
  verification_questions: VerificationQuestion[]
  call_summary: string | null
  verification_result: boolean | null
  follow_up_required: boolean
  follow_up_notes: string | null
  
  created_at: string
}

/** Verification question asked during call */
export interface VerificationQuestion {
  question: string
  answer: string
  verified: boolean
}

export type OrganizationCallLogInsert = Omit<OrganizationCallLog, 'id' | 'created_at'> & {
  id?: string
}

// ============================================
// AUDIT TRAIL
// ============================================

/** Verification audit entry */
export interface OrganizationVerificationAudit {
  id: string
  organization_id: string
  
  action: VerificationAuditAction
  previous_status: OrgVerificationStatus | null
  new_status: OrgVerificationStatus | null
  
  performed_by: string
  comments: string | null
  details: Json | null
  
  rejection_reason: string | null
  rejection_category: RejectionCategory | null
  
  ip_address: string | null
  user_agent: string | null
  
  created_at: string
}

export type OrganizationVerificationAuditInsert = Omit<OrganizationVerificationAudit, 
  'id' | 'created_at'
> & {
  id?: string
}

// ============================================
// CONTRACTS
// ============================================

/** Organization contract/service agreement */
export interface OrganizationContract {
  id: string
  organization_id: string
  
  contract_type: ContractType
  contract_status: ContractStatus
  
  // Contract terms
  start_date: string | null
  end_date: string | null
  auto_renew: boolean
  
  // Documents
  contract_document_url: string | null
  signed_document_url: string | null
  amendments: ContractAmendment[]
  
  // Signatories
  org_signatory_name: string | null
  org_signatory_position: string | null
  org_signed_at: string | null
  platform_signatory_id: string | null
  platform_signed_at: string | null
  
  // Bank details (for payouts)
  bank_name: string | null
  bank_branch: string | null
  account_number_encrypted: string | null
  account_holder_name: string | null
  bank_verified: boolean
  bank_verified_at: string | null
  bank_verified_by: string | null
  
  // Service limits
  monthly_item_limit: number | null
  monthly_claim_limit: number | null
  storage_limit_mb: number | null
  api_rate_limit: number | null
  
  // Notes
  internal_notes: string | null
  special_terms: string | null
  
  created_at: string
  updated_at: string
}

/** Contract amendment record */
export interface ContractAmendment {
  date: string
  description: string
  document_url: string
}

export type OrganizationContractInsert = Omit<OrganizationContract, 
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string
}

export type OrganizationContractUpdate = Partial<Omit<OrganizationContract,
  'id' | 'organization_id' | 'created_at'
>>

// ============================================
// BLOCKED/APPROVED DOMAINS
// ============================================

/** Blocked email domain */
export interface BlockedEmailDomain {
  id: string
  domain: string
  reason: string | null
  added_by: string | null
  created_at: string
}

/** Approved organization domain */
export interface ApprovedOrgDomain {
  id: string
  domain: string
  organization_type: string | null
  trust_level: number
  notes: string | null
  added_by: string | null
  created_at: string
}

// ============================================
// ENHANCED ORGANIZATION MEMBER
// ============================================

/** Enhanced organization member with RBAC */
export interface OrganizationMemberEnhanced {
  id: string
  organization_id: string
  user_id: string
  role: 'admin' | 'member'  // Legacy field
  member_role: OrgMemberRole
  permissions: MemberPermissions
  invited_by: string | null
  invited_at: string | null
  accepted_at: string | null
  is_active: boolean
  deactivated_at: string | null
  deactivated_by: string | null
  created_at: string
}

/** Custom permissions override */
export interface MemberPermissions {
  can_post_items?: boolean
  can_manage_claims?: boolean
  can_view_analytics?: boolean
  can_manage_settings?: boolean
  custom?: Record<string, boolean>
}

// ============================================
// EXTENDED ORGANIZATION TYPE
// ============================================

/** Extended organization with verification fields */
export interface OrganizationExtended extends Organization {
  verification_status: OrgVerificationStatus
  verification_submitted_at: string | null
  verification_approved_at: string | null
  verification_approved_by: string | null
  last_verification_check: string | null
  trust_score: number
  can_post_items: boolean
  can_manage_claims: boolean
  suspension_reason: string | null
  suspended_at: string | null
  suspended_by: string | null
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/** Request to submit organization for verification */
export interface SubmitVerificationRequest {
  organization_id: string
  verification: Omit<OrganizationVerificationInsert, 'organization_id' | 'verification_status'>
  primary_contact: Omit<OrganizationContactInsert, 'organization_id' | 'user_id' | 'is_primary_contact'>
}

/** Response from email verification check */
export interface EmailDomainCheckResult {
  email: string
  domain: string
  is_blocked: boolean
  is_approved: boolean
  trust_level: number
  requires_manual_override: boolean
  message: string
}

/** Request to verify email with OTP */
export interface VerifyEmailOTPRequest {
  organization_id: string
  otp: string
}

/** Request to log a verification call */
export interface LogVerificationCallRequest {
  organization_id: string
  phone_called: string
  phone_source: PhoneSource
  phone_source_url?: string
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

/** Admin review action request */
export interface AdminReviewRequest {
  organization_id: string
  action: 'approve' | 'reject' | 'request_documents' | 'schedule_call' | 'suspend' | 'reactivate'
  comments?: string
  rejection_reason?: string
  rejection_category?: RejectionCategory
}

/** Organization permission check result */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  org_status?: OrgVerificationStatus
  user_role?: OrgMemberRole
}

// ============================================
// COMPOSITE TYPES FOR API RESPONSES
// ============================================

/** Full organization verification details */
export interface OrganizationVerificationFull {
  organization: OrganizationExtended
  verification: OrganizationVerification | null
  contacts: (OrganizationContact & { user?: Profile })[]
  call_logs: OrganizationCallLog[]
  audit_trail: OrganizationVerificationAudit[]
  contract: OrganizationContract | null
}

/** Summary for admin dashboard */
export interface VerificationSummary {
  organization_id: string
  organization_name: string
  organization_type: string
  verification_status: OrgVerificationStatus
  submitted_at: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  email_verified: boolean
  phone_verified: boolean
  documents_count: number
  last_activity: string
}

/** Dashboard stats for verification workflow */
export interface VerificationDashboardStats {
  total_pending: number
  total_under_review: number
  total_pending_call: number
  total_pending_documents: number
  total_approved: number
  total_rejected: number
  total_suspended: number
  avg_approval_time_days: number
  this_week_submissions: number
  this_week_approvals: number
}
