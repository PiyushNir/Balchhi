-- KhojPayo - Nepal Lost & Found Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_role AS ENUM ('individual', 'user', 'verified_user', 'organization', 'admin');
CREATE TYPE item_status AS ENUM ('active', 'claimed', 'resolved', 'expired', 'deleted');
CREATE TYPE item_type AS ENUM ('lost', 'found');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE handover_method AS ENUM ('meetup', 'delivery');
CREATE TYPE organization_type AS ENUM (
  'police', 'traffic_police', 'airport', 'bus_park', 
  'hotel', 'mall', 'university', 'college', 'school', 
  'hospital', 'bank', 'other'
);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ne')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type organization_type NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  location JSONB NOT NULL,
  address TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by everyone"
  ON organizations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage their organizations"
  ON organizations FOR ALL
  USING (auth.uid() = admin_id);

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organization"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_ne TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Insert default categories
INSERT INTO categories (name, name_ne, icon) VALUES
  ('Electronics', 'इलेक्ट्रोनिक्स', 'smartphone'),
  ('Documents', 'कागजातहरू', 'file-text'),
  ('Jewelry', 'गहना', 'gem'),
  ('Bags & Luggage', 'झोला र सामान', 'briefcase'),
  ('Wallets & Purses', 'वालेट र पर्स', 'wallet'),
  ('Keys', 'चाबीहरू', 'key'),
  ('Pets', 'पाल्तु जनावर', 'paw-print'),
  ('Clothing', 'कपडा', 'shirt'),
  ('Books & Stationery', 'किताब र स्टेशनरी', 'book'),
  ('Sports Equipment', 'खेलकुद सामग्री', 'dumbbell'),
  ('Musical Instruments', 'संगीत वाद्ययन्त्र', 'music'),
  ('Glasses & Eyewear', 'चश्मा', 'glasses'),
  ('Vehicles', 'सवारी साधन', 'car'),
  ('Other', 'अन्य', 'package');

-- ============================================
-- ITEMS TABLE (Lost & Found)
-- ============================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type item_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  location JSONB NOT NULL,
  date_lost_found DATE NOT NULL,
  time_lost_found TIME,
  reward_amount INTEGER,
  contact_phone TEXT,
  contact_email TEXT,
  show_contact BOOLEAN DEFAULT true,
  status item_status DEFAULT 'active',
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  storage_location TEXT,
  retention_date DATE,
  is_verified_listing BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better search performance
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_date ON items(date_lost_found);
CREATE INDEX idx_items_location ON items USING GIN (location);
CREATE INDEX idx_items_search ON items USING GIN (to_tsvector('english', title || ' ' || description));

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active items are viewable by everyone"
  ON items FOR SELECT
  USING (status IN ('active', 'claimed'));

CREATE POLICY "Users can manage their own items"
  ON items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can manage org items"
  ON items FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- ITEM MEDIA TABLE
-- ============================================
CREATE TABLE item_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Item media is viewable by everyone"
  ON item_media FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their item media"
  ON item_media FOR ALL
  USING (
    item_id IN (SELECT id FROM items WHERE user_id = auth.uid())
  );

-- ============================================
-- CLAIMS TABLE
-- ============================================
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status claim_status DEFAULT 'pending',
  secret_info TEXT NOT NULL,
  proof_description TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims"
  ON claims FOR SELECT
  USING (
    claimant_id = auth.uid() OR
    item_id IN (SELECT id FROM items WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create claims"
  ON claims FOR INSERT
  WITH CHECK (claimant_id = auth.uid());

CREATE POLICY "Item owners can review claims"
  ON claims FOR UPDATE
  USING (item_id IN (SELECT id FROM items WHERE user_id = auth.uid()));

-- ============================================
-- CLAIM EVIDENCE TABLE
-- ============================================
CREATE TABLE claim_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'document')),
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claim parties can view evidence"
  ON claim_evidence FOR SELECT
  USING (
    claim_id IN (
      SELECT id FROM claims WHERE 
        claimant_id = auth.uid() OR
        item_id IN (SELECT id FROM items WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- IDENTITY VERIFICATIONS TABLE
-- ============================================
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  id_type TEXT NOT NULL CHECK (id_type IN ('citizenship', 'passport', 'driving_license')),
  id_number_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  status verification_status DEFAULT 'pending',
  payment_id TEXT,
  payment_amount INTEGER,
  payment_method TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications"
  ON identity_verifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create verifications"
  ON identity_verifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- HANDOVERS TABLE
-- ============================================
CREATE TABLE handovers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  method handover_method NOT NULL,
  meetup_location JSONB,
  meetup_time TIMESTAMPTZ,
  delivery_address TEXT,
  delivery_courier TEXT,
  delivery_tracking TEXT,
  delivery_cost INTEGER,
  payer TEXT CHECK (payer IN ('finder', 'owner', 'split')),
  handover_code TEXT DEFAULT encode(gen_random_bytes(3), 'hex'),
  finder_confirmed BOOLEAN DEFAULT false,
  owner_confirmed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Handover parties can view"
  ON handovers FOR SELECT
  USING (
    claim_id IN (
      SELECT id FROM claims WHERE 
        claimant_id = auth.uid() OR
        item_id IN (SELECT id FROM items WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Message parties can view"
  ON messages FOR SELECT
  USING (
    claim_id IN (
      SELECT id FROM claims WHERE 
        claimant_id = auth.uid() OR
        item_id IN (SELECT id FROM items WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_identity_verifications_updated_at
  BEFORE UPDATE ON identity_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_handovers_updated_at
  BEFORE UPDATE ON handovers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_item_views(item_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE items SET view_count = view_count + 1 WHERE id = item_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Storage settings or via API

-- Create bucket for item images
-- INSERT INTO storage.buckets (id, name, public) VALUES ('items', 'items', true);

-- Create bucket for profile avatars
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create bucket for claim evidence
-- INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false);

-- Create bucket for organization logos
-- INSERT INTO storage.buckets (id, name, public) VALUES ('organizations', 'organizations', true);

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
