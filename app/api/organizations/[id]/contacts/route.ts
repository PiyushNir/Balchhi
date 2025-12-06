/**
 * Organization Contacts API Routes
 * Nepal Lost & Found Platform - KhojPayo
 * 
 * Endpoints for managing organization contact persons
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { 
  requireOrgRole,
  logVerificationAudit,
  getClientIP,
  getUserAgent
} from '@/lib/org-rbac'
import type { OrganizationContactInsert } from '@/lib/org-verification.types'

// ============================================
// GET /api/organizations/[id]/contacts
// List all contacts for an organization
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  const supabase = createServerClient()
  
  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const adminClient = createAdminClient()
  
  try {
    // Get contacts with user profiles
    const { data: contacts, error } = await adminClient
      .from('organization_contacts')
      .select(`
        *,
        user:profiles(id, name, email, avatar_url, phone),
        verified_by_user:profiles!organization_contacts_verified_by_fkey(name)
      `)
      .eq('organization_id', organizationId)
      .order('is_primary_contact', { ascending: false })
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json({ contacts: contacts || [] })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/organizations/[id]/contacts
// Add a new contact person
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
  
  // Check permission (org_owner or org_admin)
  const permission = await requireOrgRole(request, organizationId, ['org_owner', 'org_admin'])
  if (!permission.allowed) {
    return permission.error
  }
  
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const {
      user_id,
      full_name,
      position_title,
      role,
      department,
      email,
      phone,
      phone_alt,
      is_primary_contact,
      can_manage_items,
      can_manage_claims,
      can_manage_members,
      can_view_analytics
    } = body
    
    // Validate required fields
    if (!user_id || !full_name || !position_title || !role || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, full_name, position_title, role, email, phone' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const { data: userExists } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()
    
    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }
    
    // Check if contact already exists
    const { data: existingContact } = await adminClient
      .from('organization_contacts')
      .select('id, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', user_id)
      .single()
    
    if (existingContact) {
      if (existingContact.is_active) {
        return NextResponse.json(
          { error: 'This user is already a contact for this organization' },
          { status: 400 }
        )
      }
      // Reactivate if inactive
      const { data: reactivated, error } = await adminClient
        .from('organization_contacts')
        .update({
          full_name,
          position_title,
          role,
          department,
          email,
          phone,
          phone_alt,
          is_primary_contact: is_primary_contact || false,
          can_manage_items: can_manage_items ?? true,
          can_manage_claims: can_manage_claims ?? true,
          can_manage_members: can_manage_members ?? false,
          can_view_analytics: can_view_analytics ?? true,
          is_active: true,
          deactivated_at: null,
          deactivated_by: null,
          deactivation_reason: null
        })
        .eq('id', existingContact.id)
        .select()
        .single()
      
      if (error) throw error
      
      // Log audit
      await logVerificationAudit({
        organizationId,
        action: 'contact_added',
        performedBy: permission.userId!,
        details: { contact_id: reactivated.id, user_id, reactivated: true },
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })
      
      return NextResponse.json({ contact: reactivated })
    }
    
    // If setting as primary, unset other primaries
    if (is_primary_contact) {
      await adminClient
        .from('organization_contacts')
        .update({ is_primary_contact: false })
        .eq('organization_id', organizationId)
        .eq('is_primary_contact', true)
    }
    
    // Create contact
    const contactData: OrganizationContactInsert = {
      organization_id: organizationId,
      user_id,
      full_name,
      position_title,
      role,
      department: department || null,
      email,
      phone,
      phone_alt: phone_alt || null,
      is_primary_contact: is_primary_contact || false,
      is_verified: false,
      can_manage_items: can_manage_items ?? true,
      can_manage_claims: can_manage_claims ?? true,
      can_manage_members: can_manage_members ?? false,
      can_view_analytics: can_view_analytics ?? true,
      is_active: true,
      id_type: null,
      id_number_hash: null,
      id_document_url: null,
      verified_by: null,
      verification_notes: null,
      deactivated_by: null,
      deactivation_reason: null
    }
    
    const { data: contact, error } = await adminClient
      .from('organization_contacts')
      .insert(contactData)
      .select()
      .single()
    
    if (error) throw error
    
    // Also add to organization_members if not already
    const { data: existingMember } = await adminClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user_id)
      .single()
    
    if (!existingMember) {
      await adminClient
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id,
          role: 'member',
          member_role: 'org_staff',
          invited_by: permission.userId,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
          is_active: true
        })
    }
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: 'contact_added',
      performedBy: permission.userId!,
      details: { contact_id: contact.id, user_id },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Error adding contact:', error)
    return NextResponse.json(
      { error: 'Failed to add contact' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH /api/organizations/[id]/contacts
// Update a contact person
// ============================================
export async function PATCH(
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
    const { contact_id, ...updates } = body
    
    if (!contact_id) {
      return NextResponse.json(
        { error: 'contact_id is required' },
        { status: 400 }
      )
    }
    
    // Verify contact belongs to this org
    const { data: existingContact } = await adminClient
      .from('organization_contacts')
      .select('id, organization_id, is_primary_contact')
      .eq('id', contact_id)
      .single()
    
    if (!existingContact || existingContact.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // If setting as primary, unset other primaries
    if (updates.is_primary_contact && !existingContact.is_primary_contact) {
      await adminClient
        .from('organization_contacts')
        .update({ is_primary_contact: false })
        .eq('organization_id', organizationId)
        .eq('is_primary_contact', true)
    }
    
    // Update contact
    const { data: contact, error } = await adminClient
      .from('organization_contacts')
      .update(updates)
      .eq('id', contact_id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/organizations/[id]/contacts
// Deactivate a contact person
// ============================================
export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')
    const reason = searchParams.get('reason') || 'Removed by admin'
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'contact_id is required' },
        { status: 400 }
      )
    }
    
    // Verify contact belongs to this org
    const { data: existingContact } = await adminClient
      .from('organization_contacts')
      .select('id, organization_id, user_id')
      .eq('id', contactId)
      .single()
    
    if (!existingContact || existingContact.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // Deactivate (soft delete)
    const { error } = await adminClient
      .from('organization_contacts')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: permission.userId,
        deactivation_reason: reason
      })
      .eq('id', contactId)
    
    if (error) throw error
    
    // Log audit
    await logVerificationAudit({
      organizationId,
      action: 'contact_removed',
      performedBy: permission.userId!,
      details: { contact_id: contactId, user_id: existingContact.user_id, reason },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ message: 'Contact removed successfully' })
  } catch (error) {
    console.error('Error removing contact:', error)
    return NextResponse.json(
      { error: 'Failed to remove contact' },
      { status: 500 }
    )
  }
}
