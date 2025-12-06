export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User roles
export type UserRole = 'user' | 'verified_user' | 'organization' | 'admin'

// Item status
export type ItemStatus = 'active' | 'claimed' | 'resolved' | 'expired' | 'deleted'

// Item type
export type ItemType = 'lost' | 'found'

// Claim status
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

// Verification status
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

// Handover method
export type HandoverMethod = 'meetup' | 'delivery'

// Organization type
export type OrganizationType = 
  | 'police'
  | 'traffic_police'
  | 'airport'
  | 'bus_park'
  | 'hotel'
  | 'mall'
  | 'university'
  | 'college'
  | 'school'
  | 'hospital'
  | 'bank'
  | 'other'

// Nepal location
export interface NepaliLocation {
  province: string
  district: string
  municipality: string
  ward?: number
  landmark?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface Database {
  public: {
    Tables: {
      // User profiles
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          preferred_language: 'en' | 'ne'
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          preferred_language?: 'en' | 'ne'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          preferred_language?: 'en' | 'ne'
          is_verified?: boolean
          updated_at?: string
        }
      }

      // Organizations
      organizations: {
        Row: {
          id: string
          name: string
          type: OrganizationType
          description: string | null
          logo_url: string | null
          contact_email: string
          contact_phone: string
          location: Json // NepaliLocation
          address: string
          is_verified: boolean
          is_active: boolean
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: OrganizationType
          description?: string | null
          logo_url?: string | null
          contact_email: string
          contact_phone: string
          location: Json
          address: string
          is_verified?: boolean
          is_active?: boolean
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: OrganizationType
          description?: string | null
          logo_url?: string | null
          contact_email?: string
          contact_phone?: string
          location?: Json
          address?: string
          is_verified?: boolean
          is_active?: boolean
          updated_at?: string
        }
      }

      // Organization members
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Update: {
          role?: 'admin' | 'member'
        }
      }

      // Categories
      categories: {
        Row: {
          id: string
          name: string
          name_ne: string
          icon: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ne: string
          icon?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          name_ne?: string
          icon?: string | null
          parent_id?: string | null
        }
      }

      // Items (lost & found)
      items: {
        Row: {
          id: string
          type: ItemType
          title: string
          description: string
          category_id: string
          location: Json // NepaliLocation
          date_lost_found: string
          time_lost_found: string | null
          reward_amount: number | null
          contact_phone: string | null
          contact_email: string | null
          show_contact: boolean
          status: ItemStatus
          user_id: string
          organization_id: string | null
          storage_location: string | null
          retention_date: string | null
          is_verified_listing: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: ItemType
          title: string
          description: string
          category_id: string
          location: Json
          date_lost_found: string
          time_lost_found?: string | null
          reward_amount?: number | null
          contact_phone?: string | null
          contact_email?: string | null
          show_contact?: boolean
          status?: ItemStatus
          user_id: string
          organization_id?: string | null
          storage_location?: string | null
          retention_date?: string | null
          is_verified_listing?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: ItemType
          title?: string
          description?: string
          category_id?: string
          location?: Json
          date_lost_found?: string
          time_lost_found?: string | null
          reward_amount?: number | null
          contact_phone?: string | null
          contact_email?: string | null
          show_contact?: boolean
          status?: ItemStatus
          storage_location?: string | null
          retention_date?: string | null
          is_verified_listing?: boolean
          view_count?: number
          updated_at?: string
        }
      }

      // Item media (photos)
      item_media: {
        Row: {
          id: string
          item_id: string
          url: string
          thumbnail_url: string | null
          is_primary: boolean
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          url: string
          thumbnail_url?: string | null
          is_primary?: boolean
          order?: number
          created_at?: string
        }
        Update: {
          url?: string
          thumbnail_url?: string | null
          is_primary?: boolean
          order?: number
        }
      }

      // Claims
      claims: {
        Row: {
          id: string
          item_id: string
          claimant_id: string
          status: ClaimStatus
          secret_info: string
          proof_description: string | null
          reviewer_id: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          claimant_id: string
          status?: ClaimStatus
          secret_info: string
          proof_description?: string | null
          reviewer_id?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: ClaimStatus
          secret_info?: string
          proof_description?: string | null
          reviewer_id?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          updated_at?: string
        }
      }

      // Claim evidence
      claim_evidence: {
        Row: {
          id: string
          claim_id: string
          type: 'image' | 'document'
          url: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          claim_id: string
          type: 'image' | 'document'
          url: string
          description?: string | null
          created_at?: string
        }
        Update: {
          type?: 'image' | 'document'
          url?: string
          description?: string | null
        }
      }

      // Identity verifications
      identity_verifications: {
        Row: {
          id: string
          user_id: string
          full_name: string
          date_of_birth: string
          id_type: 'citizenship' | 'passport' | 'driving_license'
          id_number_hash: string
          phone: string
          phone_verified: boolean
          status: VerificationStatus
          payment_id: string | null
          payment_amount: number | null
          payment_method: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          date_of_birth: string
          id_type: 'citizenship' | 'passport' | 'driving_license'
          id_number_hash: string
          phone: string
          phone_verified?: boolean
          status?: VerificationStatus
          payment_id?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          date_of_birth?: string
          id_type?: 'citizenship' | 'passport' | 'driving_license'
          id_number_hash?: string
          phone?: string
          phone_verified?: boolean
          status?: VerificationStatus
          payment_id?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          updated_at?: string
        }
      }

      // Handovers / Deliveries
      handovers: {
        Row: {
          id: string
          claim_id: string
          method: HandoverMethod
          meetup_location: Json | null // NepaliLocation
          meetup_time: string | null
          delivery_address: string | null
          delivery_courier: string | null
          delivery_tracking: string | null
          delivery_cost: number | null
          payer: 'finder' | 'owner' | 'split' | null
          handover_code: string
          finder_confirmed: boolean
          owner_confirmed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          claim_id: string
          method: HandoverMethod
          meetup_location?: Json | null
          meetup_time?: string | null
          delivery_address?: string | null
          delivery_courier?: string | null
          delivery_tracking?: string | null
          delivery_cost?: number | null
          payer?: 'finder' | 'owner' | 'split' | null
          handover_code?: string
          finder_confirmed?: boolean
          owner_confirmed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          method?: HandoverMethod
          meetup_location?: Json | null
          meetup_time?: string | null
          delivery_address?: string | null
          delivery_courier?: string | null
          delivery_tracking?: string | null
          delivery_cost?: number | null
          payer?: 'finder' | 'owner' | 'split' | null
          finder_confirmed?: boolean
          owner_confirmed?: boolean
          completed_at?: string | null
          updated_at?: string
        }
      }

      // Messages between users about claims
      messages: {
        Row: {
          id: string
          claim_id: string
          sender_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          claim_id: string
          sender_id: string
          content: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          content?: string
          read_at?: string | null
        }
      }

      // Notifications
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          data: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          data?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          type?: string
          title?: string
          body?: string
          data?: Json | null
          read_at?: string | null
        }
      }

      // Activity logs
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      item_status: ItemStatus
      item_type: ItemType
      claim_status: ClaimStatus
      verification_status: VerificationStatus
      handover_method: HandoverMethod
      organization_type: OrganizationType
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type ItemMedia = Database['public']['Tables']['item_media']['Row']
export type Claim = Database['public']['Tables']['claims']['Row']
export type ClaimEvidence = Database['public']['Tables']['claim_evidence']['Row']
export type IdentityVerification = Database['public']['Tables']['identity_verifications']['Row']
export type Handover = Database['public']['Tables']['handovers']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Extended types with relations
export type ItemWithMedia = Item & {
  media: ItemMedia[]
  category: Category
  user: Profile
  organization?: Organization
}

export type ClaimWithDetails = Claim & {
  item: ItemWithMedia
  claimant: Profile
  evidence: ClaimEvidence[]
  messages: Message[]
  handover?: Handover
}
