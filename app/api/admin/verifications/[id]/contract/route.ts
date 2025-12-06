/**
 * Admin Organization Contracts API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for managing organization contracts/service agreements
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
  ContractType,
  ContractStatus,
  ContractAmendment
} from '@/lib/org-verification.types'

// ============================================
// GET /api/admin/verifications/[id]/contract
// Get contract details for an organization
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
    const { data: contract, error } = await adminClient
      .from('organization_contracts')
      .select(`
        *,
        platform_signatory:profiles(id, name, email)
      `)
      .eq('organization_id', organizationId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }
    
    return NextResponse.json({ contract: contract || null })
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/admin/verifications/[id]/contract
// Create or update contract for an organization
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
      contract_type,
      contract_status,
      start_date,
      end_date,
      auto_renew,
      contract_document_url,
      signed_document_url,
      org_signatory_name,
      org_signatory_position,
      monthly_item_limit,
      monthly_claim_limit,
      storage_limit_mb,
      api_rate_limit,
      internal_notes,
      special_terms,
      bank_name,
      bank_branch,
      account_holder_name
    } = body as {
      contract_type: ContractType
      contract_status?: ContractStatus
      start_date?: string
      end_date?: string
      auto_renew?: boolean
      contract_document_url?: string
      signed_document_url?: string
      org_signatory_name?: string
      org_signatory_position?: string
      monthly_item_limit?: number
      monthly_claim_limit?: number
      storage_limit_mb?: number
      api_rate_limit?: number
      internal_notes?: string
      special_terms?: string
      bank_name?: string
      bank_branch?: string
      account_holder_name?: string
    }
    
    if (!contract_type) {
      return NextResponse.json(
        { error: 'contract_type is required' },
        { status: 400 }
      )
    }
    
    // Check if contract exists
    const { data: existing } = await adminClient
      .from('organization_contracts')
      .select('id')
      .eq('organization_id', organizationId)
      .single()
    
    const contractData = {
      organization_id: organizationId,
      contract_type,
      contract_status: contract_status || 'draft',
      start_date,
      end_date,
      auto_renew: auto_renew || false,
      contract_document_url,
      signed_document_url,
      org_signatory_name,
      org_signatory_position,
      monthly_item_limit,
      monthly_claim_limit,
      storage_limit_mb,
      api_rate_limit,
      internal_notes,
      special_terms,
      bank_name,
      bank_branch,
      account_holder_name
    }
    
    let contract
    let action: string
    
    if (existing) {
      // Update existing
      const { data, error } = await adminClient
        .from('organization_contracts')
        .update(contractData)
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      contract = data
      action = 'updated'
    } else {
      // Create new
      const { data, error } = await adminClient
        .from('organization_contracts')
        .insert(contractData)
        .select()
        .single()
      
      if (error) throw error
      contract = data
      action = 'contract_uploaded'
    }
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action,
      performedBy: permission.userId!,
      details: { contract_type, contract_status },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ contract }, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Error saving contract:', error)
    return NextResponse.json(
      { error: 'Failed to save contract' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT /api/admin/verifications/[id]/contract
// Sign contract (platform side)
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
    const { action, signed_document_url, amendment } = body as {
      action: 'sign' | 'activate' | 'terminate' | 'add_amendment' | 'verify_bank'
      signed_document_url?: string
      amendment?: ContractAmendment
    }
    
    // Get existing contract
    const { data: contract, error: fetchError } = await adminClient
      .from('organization_contracts')
      .select('*')
      .eq('organization_id', organizationId)
      .single()
    
    if (fetchError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    
    let updates: Record<string, unknown> = {}
    let auditAction: string
    
    switch (action) {
      case 'sign':
        if (contract.contract_status !== 'pending_signature') {
          return NextResponse.json(
            { error: 'Contract must be in pending_signature status' },
            { status: 400 }
          )
        }
        updates = {
          contract_status: 'signed',
          platform_signatory_id: permission.userId,
          platform_signed_at: new Date().toISOString(),
          signed_document_url
        }
        auditAction = 'contract_signed'
        break
        
      case 'activate':
        if (contract.contract_status !== 'signed') {
          return NextResponse.json(
            { error: 'Contract must be signed before activation' },
            { status: 400 }
          )
        }
        updates = {
          contract_status: 'active',
          start_date: contract.start_date || new Date().toISOString().split('T')[0]
        }
        auditAction = 'updated'
        break
        
      case 'terminate':
        updates = {
          contract_status: 'terminated',
          end_date: new Date().toISOString().split('T')[0]
        }
        auditAction = 'updated'
        break
        
      case 'add_amendment':
        if (!amendment) {
          return NextResponse.json(
            { error: 'Amendment details required' },
            { status: 400 }
          )
        }
        const currentAmendments = (contract.amendments as unknown as ContractAmendment[]) || []
        updates = {
          amendments: [...currentAmendments, amendment]
        }
        auditAction = 'updated'
        break
        
      case 'verify_bank':
        updates = {
          bank_verified: true,
          bank_verified_at: new Date().toISOString(),
          bank_verified_by: permission.userId
        }
        auditAction = 'updated'
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Update contract
    const { data: updated, error: updateError } = await adminClient
      .from('organization_contracts')
      .update(updates)
      .eq('id', contract.id)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: auditAction,
      performedBy: permission.userId!,
      comments: `Contract action: ${action}`,
      details: { action, ...updates },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ contract: updated })
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}
