# Organization Verification System

## Overview

This document describes the comprehensive organization verification system for the KhojPayo (Nepal Lost & Found) platform. The system implements a 7-step verification process specifically designed for Nepal's business environment.

## Architecture

### Database Schema

The migration file `supabase/migrations/001_organization_verification.sql` creates the following:

#### New Tables

1. **`organization_verification`** - Extended verification details
   - Registration info (PAN, VAT, Company Registrar number)
   - Nepal address breakdown (province, district, municipality, ward)
   - Official contact details
   - Email domain verification status
   - Document URLs (registration certificate, PAN, VAT, letterhead)

2. **`organization_contacts`** - Contact persons linked to orgs
   - User linkage with role (owner, director, manager, etc.)
   - Verification status
   - Permission flags (can_manage_items, can_manage_claims, etc.)

3. **`organization_call_logs`** - Phone verification call history
   - Caller tracking
   - Phone source (provided, website, Google listing, etc.)
   - Verification questions and results

4. **`organization_verification_audit`** - Complete audit trail
   - All status changes with timestamps
   - Performer tracking
   - Rejection reasons and categories

5. **`organization_contracts`** - Service agreements for larger orgs
   - Contract type and status
   - Documents (draft, signed)
   - Bank details for payouts
   - Service limits

6. **`blocked_email_domains`** - Generic email providers to reject
   - Pre-populated with Gmail, Yahoo, Outlook, etc.

7. **`approved_org_domains`** - Pre-approved official domains
   - Pre-populated with Nepal government domains (gov.np, etc.)
   - Trust levels (1-5)

#### New Enum Types

- `org_verification_status`: draft → submitted → under_review → pending_call → pending_documents → rejected → approved → suspended
- `nepal_registration_type`: company_registrar, pan, vat, education_board, etc.
- `org_contact_role`: owner, director, manager, it_admin, operations, hr
- `phone_verification_status`: not_started, scheduled, in_progress, completed_verified, completed_failed
- `contract_status`: none, draft, pending_signature, signed, active, expired, terminated
- `email_verification_status`: pending, code_sent, verified, failed, manual_override
- `org_member_role`: org_owner, org_admin, org_staff, org_viewer

#### Enhanced Existing Tables

- **`organizations`** - Added fields:
  - `verification_status`
  - `can_post_items`, `can_manage_claims`
  - `trust_score`
  - `suspension_reason`, `suspended_at`, `suspended_by`

- **`organization_members`** - Added fields:
  - `member_role` (RBAC role)
  - `permissions` (JSON)
  - `invited_by`, `invited_at`, `accepted_at`
  - `is_active`, `deactivated_at`, `deactivated_by`

### API Endpoints

#### Organization Verification (for org admins)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations/[id]/verification` | Get verification details |
| POST | `/api/organizations/[id]/verification` | Save/update verification details |
| PUT | `/api/organizations/[id]/verification` | Submit for review |

#### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations/[id]/email-verify?email=x` | Check email domain validity |
| POST | `/api/organizations/[id]/email-verify` | Send OTP to email |
| PUT | `/api/organizations/[id]/email-verify` | Verify OTP |

#### Organization Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations/[id]/contacts` | List contacts |
| POST | `/api/organizations/[id]/contacts` | Add contact |
| PATCH | `/api/organizations/[id]/contacts` | Update contact |
| DELETE | `/api/organizations/[id]/contacts?contact_id=x` | Remove contact |

#### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/verifications` | List all verifications |
| GET | `/api/admin/verifications/[id]` | Get full details |
| POST | `/api/admin/verifications/[id]` | Review action (approve/reject/etc) |
| PUT | `/api/admin/verifications/[id]` | Admin update/override |
| GET | `/api/admin/verifications/[id]/calls` | Get call logs |
| POST | `/api/admin/verifications/[id]/calls` | Log verification call |
| GET | `/api/admin/verifications/[id]/contract` | Get contract |
| POST | `/api/admin/verifications/[id]/contract` | Create/update contract |
| PUT | `/api/admin/verifications/[id]/contract` | Contract actions (sign, activate, etc) |

### RBAC System

Located in `lib/org-rbac.ts`:

#### Role Permissions

| Role | Permissions |
|------|-------------|
| `org_owner` | All permissions including transfer_ownership |
| `org_admin` | All except transfer_ownership and manage_contracts |
| `org_staff` | view, post_item, manage_claim, view_analytics |
| `org_viewer` | view, view_analytics |

#### Key Functions

```typescript
// Check if user can perform action
const result = await canUserPerformAction(userId, orgId, 'post_item')
if (!result.allowed) {
  // Handle denied
}

// Middleware for routes
const permission = await requireOrgAction(request, orgId, 'manage_claim')
if (!permission.allowed) {
  return permission.error
}

// Admin-only check
const adminCheck = await requireAdmin(request)
```

## Verification Workflow

### Step 1: Organization Registration
1. User creates organization via POST `/api/organizations`
2. System validates email domain
3. Organization created with `verification_status: 'draft'`
4. `can_post_items` and `can_manage_claims` set to `false`

### Step 2: Complete Verification Details
1. Org admin fills POST `/api/organizations/[id]/verification`:
   - Registration number (PAN/VAT/Company Reg)
   - Full Nepal address
   - Official contact details
2. Upload documents to Supabase Storage:
   - Registration certificate
   - PAN/VAT certificate
   - Letterhead sample

### Step 3: Email Domain Verification
1. Check domain: GET `/api/organizations/[id]/email-verify?email=x`
2. Send OTP: POST `/api/organizations/[id]/email-verify`
3. Verify OTP: PUT `/api/organizations/[id]/email-verify`
4. Generic emails (Gmail, etc.) require admin override

### Step 4: Add Contact Persons
1. Add primary contact: POST `/api/organizations/[id]/contacts`
2. At least one verified primary contact required

### Step 5: Submit for Review
1. Submit: PUT `/api/organizations/[id]/verification`
2. Status changes: `draft` → `submitted`
3. Admin notified

### Step 6: Admin Review
1. Admin starts review: POST `/api/admin/verifications/[id]` with `action: 'start_review'`
2. Status: `submitted` → `under_review`
3. Admin can:
   - Request documents (`pending_documents`)
   - Schedule call (`pending_call`)
   - Approve (`approved`)
   - Reject (`rejected`)

### Step 7: Phone Verification (if needed)
1. Admin logs call: POST `/api/admin/verifications/[id]/calls`
2. Records:
   - Phone source (website, Google listing, etc.)
   - Verification questions asked
   - Result

### Step 8: Approval
1. Admin approves: POST `/api/admin/verifications/[id]` with `action: 'approve'`
2. Organization:
   - `verification_status` → `approved`
   - `can_post_items` → `true`
   - `can_manage_claims` → `true`
   - `is_verified` → `true`

### Step 9: Contract (for larger orgs)
1. Create contract: POST `/api/admin/verifications/[id]/contract`
2. Sign: PUT with `action: 'sign'`
3. Activate: PUT with `action: 'activate'`

## TypeScript Types

Located in `lib/org-verification.types.ts`:

- All enum types
- Table row types
- Insert/Update types
- API request/response types
- Composite types for full data

## Running the Migration

```sql
-- In Supabase SQL Editor or via CLI:
\i supabase/migrations/001_organization_verification.sql
```

## Storage Buckets

Create these buckets in Supabase Storage:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('org-documents', 'org-documents', false),
  ('org-contracts', 'org-contracts', false);
```

## Environment Variables

No new environment variables required. Uses existing Supabase configuration.

## Security Considerations

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Admin Routes**: Protected by `requireAdmin()` middleware
3. **Org Routes**: Protected by role-based checks
4. **Audit Trail**: All actions logged with IP and user agent
5. **ID Hashing**: Contact person ID numbers are hashed
6. **Bank Details**: Account numbers should be encrypted (field provided, encryption to be implemented)

## Future Enhancements

1. Implement actual email sending (currently logs OTP to console in dev)
2. Add encryption for bank account numbers
3. Implement webhook notifications
4. Add scheduled job for contract expiration
5. Build admin dashboard UI
