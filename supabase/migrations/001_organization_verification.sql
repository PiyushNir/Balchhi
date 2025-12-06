-- ============================================
-- ORGANIZATION VERIFICATION SYSTEM MIGRATION
-- Nepal Lost & Found Platform - KhojPayo
-- ============================================
-- This migration adds comprehensive organization verification
-- following Nepal's business registration requirements

-- ============================================
-- NEW ENUM TYPES
-- ============================================

-- Organization verification workflow status
CREATE TYPE org_verification_status AS ENUM (
  'draft',           -- Initial creation, not yet submitted
  'submitted',       -- Submitted for review
  'under_review',    -- Being reviewed by admin
  'pending_call',    -- Awaiting phone verification callback
  'pending_documents', -- Awaiting additional documents
  'rejected',        -- Rejected (can resubmit)
  'approved',        -- Fully approved
  'suspended'        -- Suspended (was approved, now restricted)
);

-- Nepal registration/license types
CREATE TYPE nepal_registration_type AS ENUM (
  'company_registrar',    -- Office of Company Registrar
  'pan',                  -- Permanent Account Number
  'vat',                  -- VAT Registration
  'education_board',      -- Education board registration (schools/colleges)
  'hospital_license',     -- Health facility license
  'hotel_license',        -- Tourism license for hotels
  'transport_license',    -- Transport authority license
  'police_unit',          -- Police station code
  'government_office',    -- Government office code
  'bank_license',         -- Nepal Rastra Bank license
  'ngo_registration',     -- Social Welfare Council registration
  'other'
);

-- Contact person role in organization
CREATE TYPE org_contact_role AS ENUM (
  'owner',           -- Business owner
  'director',        -- Director/Board member
  'manager',         -- General manager
  'it_admin',        -- IT/System administrator
  'operations',      -- Operations manager
  'hr',              -- HR representative
  'other'
);

-- Phone verification status
CREATE TYPE phone_verification_status AS ENUM (
  'not_started',
  'scheduled',
  'in_progress',
  'completed_verified',
  'completed_failed',
  'unreachable'
);

-- Contract status
CREATE TYPE contract_status AS ENUM (
  'none',
  'draft',
  'pending_signature',
  'signed',
  'active',
  'expired',
  'terminated'
);

-- Email domain verification status
CREATE TYPE email_verification_status AS ENUM (
  'pending',
  'code_sent',
  'verified',
  'failed',
  'manual_override'
);

-- Enhanced organization member roles
CREATE TYPE org_member_role AS ENUM (
  'org_owner',       -- Full control, can transfer ownership
  'org_admin',       -- Can manage members, items, claims
  'org_staff',       -- Can manage items and claims
  'org_viewer'       -- Read-only access
);

-- ============================================
-- ORGANIZATION VERIFICATION DETAILS TABLE
-- Extended fields for Nepal-specific verification
-- ============================================
CREATE TABLE organization_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Registration details
  registered_name TEXT NOT NULL,                    -- Official registered name
  registration_type nepal_registration_type NOT NULL,
  registration_number TEXT NOT NULL,               -- PAN/VAT/Company Reg number
  registration_date DATE,                          -- When the org was registered
  registration_authority TEXT,                     -- Which authority issued it
  
  -- Nepal address breakdown
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  municipality TEXT NOT NULL,                      -- Municipality/Metro/Sub-metro
  ward_number INTEGER,
  street_address TEXT,
  postal_code TEXT,
  
  -- Official contact details
  official_email TEXT NOT NULL,                    -- Must be verified domain email
  official_phone TEXT NOT NULL,                    -- Official landline/mobile
  official_phone_alt TEXT,                         -- Alternative phone
  official_website TEXT,
  
  -- Domain verification
  email_domain TEXT,                               -- Extracted domain for validation
  email_verification_status email_verification_status DEFAULT 'pending',
  email_verification_token TEXT,                   -- OTP or magic link token
  email_verification_token_expires TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  is_generic_email BOOLEAN DEFAULT false,          -- True if @gmail.com etc
  generic_email_override_by UUID REFERENCES profiles(id), -- Admin who approved generic
  generic_email_override_reason TEXT,
  
  -- Document evidence (stored in Supabase Storage)
  registration_certificate_url TEXT,              -- PDF/image of certificate
  pan_certificate_url TEXT,
  vat_certificate_url TEXT,
  letterhead_url TEXT,                            -- Sample letterhead
  other_documents JSONB DEFAULT '[]',             -- Array of {name, url, type}
  
  -- Verification workflow
  verification_status org_verification_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_verification UNIQUE(organization_id)
);

-- Indexes for organization verification
CREATE INDEX idx_org_verification_status ON organization_verification(verification_status);
CREATE INDEX idx_org_verification_org ON organization_verification(organization_id);
CREATE INDEX idx_org_verification_domain ON organization_verification(email_domain);
CREATE INDEX idx_org_verification_reg_number ON organization_verification(registration_number);

-- ============================================
-- ORGANIZATION CONTACT PERSONS TABLE
-- Links users to organizations with roles
-- ============================================
CREATE TABLE organization_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contact details
  full_name TEXT NOT NULL,
  position_title TEXT NOT NULL,                   -- Job title
  role org_contact_role NOT NULL,
  department TEXT,
  
  -- Contact info
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_alt TEXT,
  
  -- Identity verification (optional, for stronger verification)
  id_type TEXT CHECK (id_type IN ('citizenship', 'passport', 'driving_license', 'employee_id')),
  id_number_hash TEXT,                            -- Hashed for privacy
  id_document_url TEXT,                           -- Stored in private bucket
  
  -- Verification status
  is_primary_contact BOOLEAN DEFAULT false,       -- Main point of contact
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Authorization level
  can_manage_items BOOLEAN DEFAULT true,
  can_manage_claims BOOLEAN DEFAULT true,
  can_manage_members BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES profiles(id),
  deactivation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_contact UNIQUE(organization_id, user_id)
);

-- Indexes for organization contacts
CREATE INDEX idx_org_contacts_org ON organization_contacts(organization_id);
CREATE INDEX idx_org_contacts_user ON organization_contacts(user_id);
CREATE INDEX idx_org_contacts_primary ON organization_contacts(organization_id, is_primary_contact) WHERE is_primary_contact = true;

-- ============================================
-- PHONE VERIFICATION CALL LOGS TABLE
-- Tracks manual verification calls to orgs
-- ============================================
CREATE TABLE organization_call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Call details
  caller_id UUID NOT NULL REFERENCES profiles(id), -- Admin/staff who made the call
  
  -- Phone numbers used
  phone_called TEXT NOT NULL,                      -- The number that was called
  phone_source TEXT NOT NULL CHECK (phone_source IN (
    'provided',           -- Number provided by org
    'website',            -- Found on their website
    'google_listing',     -- Google Business listing
    'official_directory', -- Government/official directory
    'other'
  )),
  phone_source_url TEXT,                          -- URL where number was found
  
  -- Call timing
  scheduled_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ NOT NULL,
  call_duration_seconds INTEGER,
  
  -- Call result
  call_status phone_verification_status NOT NULL,
  answered_by TEXT,                               -- Name of person who answered
  answered_by_position TEXT,                      -- Their stated position
  
  -- Verification questions asked
  verification_questions JSONB DEFAULT '[]',      -- Array of {question, answer, verified}
  
  -- Summary
  call_summary TEXT,
  verification_result BOOLEAN,                    -- Overall: verified or not
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for call logs
CREATE INDEX idx_org_call_logs_org ON organization_call_logs(organization_id);
CREATE INDEX idx_org_call_logs_status ON organization_call_logs(call_status);
CREATE INDEX idx_org_call_logs_date ON organization_call_logs(called_at);

-- ============================================
-- ORGANIZATION VERIFICATION AUDIT TRAIL
-- Tracks all status changes and reviews
-- ============================================
CREATE TABLE organization_verification_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL CHECK (action IN (
    'created',
    'submitted',
    'assigned_reviewer',
    'review_started',
    'document_requested',
    'document_received',
    'call_scheduled',
    'call_completed',
    'approved',
    'rejected',
    'suspended',
    'reactivated',
    'updated',
    'contact_added',
    'contact_removed',
    'contract_uploaded',
    'contract_signed',
    'manual_override'
  )),
  
  -- Status transition
  previous_status org_verification_status,
  new_status org_verification_status,
  
  -- Who performed the action
  performed_by UUID NOT NULL REFERENCES profiles(id),
  
  -- Details
  comments TEXT,
  details JSONB,                                  -- Additional structured data
  
  -- For rejections
  rejection_reason TEXT,
  rejection_category TEXT CHECK (rejection_category IN (
    'invalid_registration',
    'document_mismatch',
    'unverifiable_contact',
    'suspicious_activity',
    'incomplete_info',
    'failed_phone_verification',
    'other'
  )),
  
  -- IP tracking for security
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit trail
CREATE INDEX idx_org_audit_org ON organization_verification_audit(organization_id);
CREATE INDEX idx_org_audit_action ON organization_verification_audit(action);
CREATE INDEX idx_org_audit_date ON organization_verification_audit(created_at);
CREATE INDEX idx_org_audit_performer ON organization_verification_audit(performed_by);

-- ============================================
-- ORGANIZATION CONTRACTS TABLE
-- For larger organizations with service agreements
-- ============================================
CREATE TABLE organization_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contract details
  contract_type TEXT NOT NULL CHECK (contract_type IN (
    'standard',           -- Standard terms
    'premium',            -- Premium service tier
    'enterprise',         -- Enterprise/custom
    'government',         -- Government partnership
    'ngo',               -- NGO partnership
    'educational'        -- Educational institution
  )),
  contract_status contract_status DEFAULT 'none',
  
  -- Contract terms
  start_date DATE,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  
  -- Contract documents (Supabase Storage)
  contract_document_url TEXT,
  signed_document_url TEXT,
  amendments JSONB DEFAULT '[]',                  -- Array of {date, description, document_url}
  
  -- Signatories
  org_signatory_name TEXT,
  org_signatory_position TEXT,
  org_signed_at TIMESTAMPTZ,
  platform_signatory_id UUID REFERENCES profiles(id),
  platform_signed_at TIMESTAMPTZ,
  
  -- Financial details (for future payout integration)
  bank_name TEXT,
  bank_branch TEXT,
  account_number_encrypted TEXT,                  -- Encrypted bank account
  account_holder_name TEXT,
  bank_verified BOOLEAN DEFAULT false,
  bank_verified_at TIMESTAMPTZ,
  bank_verified_by UUID REFERENCES profiles(id),
  
  -- Service limits (based on contract tier)
  monthly_item_limit INTEGER,
  monthly_claim_limit INTEGER,
  storage_limit_mb INTEGER,
  api_rate_limit INTEGER,
  
  -- Notes
  internal_notes TEXT,
  special_terms TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contracts
CREATE INDEX idx_org_contracts_org ON organization_contracts(organization_id);
CREATE INDEX idx_org_contracts_status ON organization_contracts(contract_status);
CREATE INDEX idx_org_contracts_end_date ON organization_contracts(end_date);

-- ============================================
-- ENHANCED ORGANIZATION MEMBERS TABLE
-- Replace existing simple roles with RBAC
-- ============================================

-- Add new columns to existing organization_members table
ALTER TABLE organization_members 
  ADD COLUMN IF NOT EXISTS member_role org_member_role DEFAULT 'org_staff',
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES profiles(id);

-- Create index for active members
CREATE INDEX IF NOT EXISTS idx_org_members_active 
  ON organization_members(organization_id, user_id) 
  WHERE is_active = true;

-- ============================================
-- BLOCKED EMAIL DOMAINS TABLE
-- List of generic email providers to reject
-- ============================================
CREATE TABLE blocked_email_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,
  reason TEXT,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common generic email providers
INSERT INTO blocked_email_domains (domain, reason) VALUES
  ('gmail.com', 'Generic email provider'),
  ('yahoo.com', 'Generic email provider'),
  ('hotmail.com', 'Generic email provider'),
  ('outlook.com', 'Generic email provider'),
  ('live.com', 'Generic email provider'),
  ('msn.com', 'Generic email provider'),
  ('aol.com', 'Generic email provider'),
  ('icloud.com', 'Generic email provider'),
  ('mail.com', 'Generic email provider'),
  ('protonmail.com', 'Generic email provider'),
  ('zoho.com', 'Generic email provider'),
  ('yandex.com', 'Generic email provider'),
  ('gmx.com', 'Generic email provider'),
  ('tutanota.com', 'Generic email provider'),
  ('fastmail.com', 'Generic email provider');

-- ============================================
-- ALLOWED GOVERNMENT DOMAINS TABLE
-- Pre-approved Nepal government domains
-- ============================================
CREATE TABLE approved_org_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,
  organization_type organization_type,
  trust_level INTEGER DEFAULT 1 CHECK (trust_level BETWEEN 1 AND 5), -- 5 = highest trust
  notes TEXT,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert known Nepal government and institutional domains
-- NOTE: Using 'other' for government offices since 'government_office' may not exist in enum
INSERT INTO approved_org_domains (domain, organization_type, trust_level, notes) VALUES
  ('gov.np', 'other', 5, 'Nepal Government'),
  ('nepal.gov.np', 'other', 5, 'Nepal Government main'),
  ('moha.gov.np', 'other', 5, 'Ministry of Home Affairs'),
  ('nrb.org.np', 'bank', 5, 'Nepal Rastra Bank'),
  ('nepalpolice.gov.np', 'police', 5, 'Nepal Police'),
  ('caan.gov.np', 'other', 5, 'Civil Aviation Authority'),
  ('tribhuvan-airport.com.np', 'airport', 4, 'TIA'),
  ('nea.org.np', 'other', 4, 'Nepal Electricity Authority'),
  ('ntc.net.np', 'other', 4, 'Nepal Telecom'),
  ('tu.edu.np', 'university', 4, 'Tribhuvan University'),
  ('ku.edu.np', 'university', 4, 'Kathmandu University'),
  ('pu.edu.np', 'university', 4, 'Pokhara University'),
  ('neb.gov.np', 'other', 5, 'National Examination Board'),
  ('hseb.gov.np', 'other', 5, 'Higher Secondary Education Board');

-- ============================================
-- UPDATE ORGANIZATIONS TABLE
-- Add new verification-related columns
-- ============================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS verification_status org_verification_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_approved_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS last_verification_check TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS can_post_items BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_claims BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);

-- Create index for verification status
CREATE INDEX IF NOT EXISTS idx_organizations_verification_status 
  ON organizations(verification_status);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Organization Verification
ALTER TABLE organization_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view their verification"
  ON organization_verification FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND member_role IN ('org_owner', 'org_admin')
    )
  );

CREATE POLICY "Org admins can insert verification"
  ON organization_verification FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND member_role IN ('org_owner', 'org_admin')
    )
  );

CREATE POLICY "Org admins can update their verification"
  ON organization_verification FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND member_role IN ('org_owner', 'org_admin')
    )
    AND verification_status NOT IN ('approved', 'suspended')
  );

-- Organization Contacts
ALTER TABLE organization_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view contacts"
  ON organization_contacts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage contacts"
  ON organization_contacts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND member_role IN ('org_owner', 'org_admin')
    )
  );

-- Call Logs (admin only, no public RLS policy)
ALTER TABLE organization_call_logs ENABLE ROW LEVEL SECURITY;

-- Audit Trail (read-only for org admins)
ALTER TABLE organization_verification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view their audit trail"
  ON organization_verification_audit FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND member_role IN ('org_owner', 'org_admin')
    )
  );

-- Contracts (org admins can view)
ALTER TABLE organization_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view their contracts"
  ON organization_contracts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND member_role IN ('org_owner', 'org_admin')
    )
  );

-- Blocked domains (public read)
ALTER TABLE blocked_email_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked domains"
  ON blocked_email_domains FOR SELECT
  USING (true);

-- Approved domains (public read)
ALTER TABLE approved_org_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved domains"
  ON approved_org_domains FOR SELECT
  USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if email domain is blocked (generic provider)
CREATE OR REPLACE FUNCTION is_blocked_email_domain(email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  domain TEXT;
BEGIN
  domain := split_part(email, '@', 2);
  RETURN EXISTS (SELECT 1 FROM blocked_email_domains WHERE blocked_email_domains.domain = domain);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if email domain is pre-approved
CREATE OR REPLACE FUNCTION is_approved_email_domain(email TEXT)
RETURNS TABLE(is_approved BOOLEAN, trust_level INTEGER) AS $$
DECLARE
  domain TEXT;
BEGIN
  domain := split_part(email, '@', 2);
  RETURN QUERY
    SELECT true, aod.trust_level
    FROM approved_org_domains aod
    WHERE aod.domain = domain OR domain LIKE '%.' || aod.domain
    LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, 0::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to extract domain from email
CREATE OR REPLACE FUNCTION extract_email_domain(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(split_part(email, '@', 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check user's organization role
CREATE OR REPLACE FUNCTION get_user_org_role(p_user_id UUID, p_organization_id UUID)
RETURNS org_member_role AS $$
DECLARE
  v_role org_member_role;
BEGIN
  SELECT member_role INTO v_role
  FROM organization_members
  WHERE user_id = p_user_id 
    AND organization_id = p_organization_id
    AND is_active = true;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user can perform action on organization
CREATE OR REPLACE FUNCTION can_user_perform_org_action(
  p_user_id UUID, 
  p_organization_id UUID, 
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role org_member_role;
  v_org_status org_verification_status;
  v_can_post BOOLEAN;
  v_can_claims BOOLEAN;
BEGIN
  -- Get user's role
  SELECT member_role INTO v_role
  FROM organization_members
  WHERE user_id = p_user_id 
    AND organization_id = p_organization_id
    AND is_active = true;
  
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get organization status
  SELECT verification_status, can_post_items, can_manage_claims
  INTO v_org_status, v_can_post, v_can_claims
  FROM organizations
  WHERE id = p_organization_id AND is_active = true;
  
  -- Check organization approval status
  IF v_org_status != 'approved' THEN
    -- Only allow viewing for non-approved orgs
    IF p_action NOT IN ('view', 'edit_verification') THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check action permissions based on role
  CASE p_action
    WHEN 'view' THEN
      RETURN true;
    WHEN 'edit_verification' THEN
      RETURN v_role IN ('org_owner', 'org_admin');
    WHEN 'post_item' THEN
      RETURN v_can_post AND v_role IN ('org_owner', 'org_admin', 'org_staff');
    WHEN 'manage_claim' THEN
      RETURN v_can_claims AND v_role IN ('org_owner', 'org_admin', 'org_staff');
    WHEN 'manage_members' THEN
      RETURN v_role IN ('org_owner', 'org_admin');
    WHEN 'manage_settings' THEN
      RETURN v_role IN ('org_owner', 'org_admin');
    WHEN 'transfer_ownership' THEN
      RETURN v_role = 'org_owner';
    WHEN 'view_analytics' THEN
      RETURN v_role IN ('org_owner', 'org_admin', 'org_staff');
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to generate email verification token
CREATE OR REPLACE FUNCTION generate_email_verification_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate 6-digit OTP
  RETURN lpad(floor(random() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to log verification audit
CREATE OR REPLACE FUNCTION log_org_verification_audit(
  p_organization_id UUID,
  p_action TEXT,
  p_performed_by UUID,
  p_previous_status org_verification_status DEFAULT NULL,
  p_new_status org_verification_status DEFAULT NULL,
  p_comments TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO organization_verification_audit (
    organization_id, action, previous_status, new_status, 
    performed_by, comments, details
  ) VALUES (
    p_organization_id, p_action, p_previous_status, p_new_status,
    p_performed_by, p_comments, p_details
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to auto-update organization status when verification changes
CREATE OR REPLACE FUNCTION sync_org_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organizations
  SET 
    verification_status = NEW.verification_status,
    can_post_items = (NEW.verification_status = 'approved'),
    can_manage_claims = (NEW.verification_status = 'approved'),
    verification_approved_at = CASE 
      WHEN NEW.verification_status = 'approved' THEN NOW()
      ELSE verification_approved_at
    END,
    updated_at = NOW()
  WHERE id = NEW.organization_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_org_verification
  AFTER UPDATE OF verification_status ON organization_verification
  FOR EACH ROW
  WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status)
  EXECUTE FUNCTION sync_org_verification_status();

-- Trigger to update updated_at for new tables
CREATE TRIGGER update_org_verification_updated_at
  BEFORE UPDATE ON organization_verification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_org_contacts_updated_at
  BEFORE UPDATE ON organization_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_org_contracts_updated_at
  BEFORE UPDATE ON organization_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE BUCKETS (run manually in Supabase)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('org-documents', 'org-documents', false),  -- Private: registration certs, IDs
--   ('org-contracts', 'org-contracts', false);  -- Private: contracts

-- Storage policies for org-documents bucket:
-- Allow org admins to upload to their org's folder
-- Allow platform admins to view all

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE organization_verification IS 'Extended verification details for Nepal organizations';
COMMENT ON TABLE organization_contacts IS 'Contact persons linked to organizations with roles';
COMMENT ON TABLE organization_call_logs IS 'Phone verification call history';
COMMENT ON TABLE organization_verification_audit IS 'Audit trail for all verification actions';
COMMENT ON TABLE organization_contracts IS 'Service agreements for larger organizations';
COMMENT ON TABLE blocked_email_domains IS 'Generic email providers that require manual override';
COMMENT ON TABLE approved_org_domains IS 'Pre-approved official/government domains';

COMMENT ON COLUMN organization_verification.is_generic_email IS 'True if email uses a blocked domain like gmail.com';
COMMENT ON COLUMN organization_verification.generic_email_override_by IS 'Admin who approved use of generic email';
COMMENT ON COLUMN organization_call_logs.phone_source IS 'Where the called phone number was obtained from';
COMMENT ON COLUMN organization_contracts.account_number_encrypted IS 'Bank account encrypted using pgcrypto';
