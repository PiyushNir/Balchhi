export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_org_domains: {
        Row: {
          added_by: string | null
          created_at: string | null
          domain: string
          id: string
          notes: string | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          trust_level: number | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          domain: string
          id?: string
          notes?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          trust_level?: number | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          domain?: string
          id?: string
          notes?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          trust_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_org_domains_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_email_domains: {
        Row: {
          added_by: string | null
          created_at: string | null
          domain: string
          id: string
          reason: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          domain: string
          id?: string
          reason?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          domain?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_email_domains_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          name_ne: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ne: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ne?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_evidence: {
        Row: {
          claim_id: string
          created_at: string | null
          description: string | null
          id: string
          type: string
          url: string
        }
        Insert: {
          claim_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          type: string
          url: string
        }
        Update: {
          claim_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claimant_id: string
          created_at: string | null
          id: string
          item_id: string
          proof_description: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          secret_info: string
          status: Database["public"]["Enums"]["claim_status"] | null
          updated_at: string | null
        }
        Insert: {
          claimant_id: string
          created_at?: string | null
          id?: string
          item_id: string
          proof_description?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          secret_info: string
          status?: Database["public"]["Enums"]["claim_status"] | null
          updated_at?: string | null
        }
        Update: {
          claimant_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          proof_description?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          secret_info?: string
          status?: Database["public"]["Enums"]["claim_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_claimant_id_fkey"
            columns: ["claimant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      handovers: {
        Row: {
          claim_id: string
          completed_at: string | null
          created_at: string | null
          delivery_address: string | null
          delivery_cost: number | null
          delivery_courier: string | null
          delivery_tracking: string | null
          finder_confirmed: boolean | null
          handover_code: string | null
          id: string
          meetup_location: Json | null
          meetup_time: string | null
          method: Database["public"]["Enums"]["handover_method"]
          owner_confirmed: boolean | null
          payer: string | null
          updated_at: string | null
        }
        Insert: {
          claim_id: string
          completed_at?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_cost?: number | null
          delivery_courier?: string | null
          delivery_tracking?: string | null
          finder_confirmed?: boolean | null
          handover_code?: string | null
          id?: string
          meetup_location?: Json | null
          meetup_time?: string | null
          method: Database["public"]["Enums"]["handover_method"]
          owner_confirmed?: boolean | null
          payer?: string | null
          updated_at?: string | null
        }
        Update: {
          claim_id?: string
          completed_at?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_cost?: number | null
          delivery_courier?: string | null
          delivery_tracking?: string | null
          finder_confirmed?: boolean | null
          handover_code?: string | null
          id?: string
          meetup_location?: Json | null
          meetup_time?: string | null
          method?: Database["public"]["Enums"]["handover_method"]
          owner_confirmed?: boolean | null
          payer?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handovers_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          created_at: string | null
          date_of_birth: string
          full_name: string
          id: string
          id_number_hash: string
          id_type: string
          payment_amount: number | null
          payment_id: string | null
          payment_method: string | null
          phone: string
          phone_verified: boolean | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          full_name: string
          id?: string
          id_number_hash: string
          id_type: string
          payment_amount?: number | null
          payment_id?: string | null
          payment_method?: string | null
          phone: string
          phone_verified?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          full_name?: string
          id?: string
          id_number_hash?: string
          id_type?: string
          payment_amount?: number | null
          payment_id?: string | null
          payment_method?: string | null
          phone?: string
          phone_verified?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_media: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          item_id: string
          order: number | null
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          item_id: string
          order?: number | null
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          item_id?: string
          order?: number | null
          thumbnail_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_media_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          date_lost_found: string
          description: string
          id: string
          is_verified_listing: boolean | null
          location: Json
          organization_id: string | null
          retention_date: string | null
          reward_amount: number | null
          show_contact: boolean | null
          status: Database["public"]["Enums"]["item_status"] | null
          storage_location: string | null
          time_lost_found: string | null
          title: string
          type: Database["public"]["Enums"]["item_type"]
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          category_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_lost_found: string
          description: string
          id?: string
          is_verified_listing?: boolean | null
          location: Json
          organization_id?: string | null
          retention_date?: string | null
          reward_amount?: number | null
          show_contact?: boolean | null
          status?: Database["public"]["Enums"]["item_status"] | null
          storage_location?: string | null
          time_lost_found?: string | null
          title: string
          type: Database["public"]["Enums"]["item_type"]
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          category_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_lost_found?: string
          description?: string
          id?: string
          is_verified_listing?: boolean | null
          location?: Json
          organization_id?: string | null
          retention_date?: string | null
          reward_amount?: number | null
          show_contact?: boolean | null
          status?: Database["public"]["Enums"]["item_status"] | null
          storage_location?: string | null
          time_lost_found?: string | null
          title?: string
          type?: Database["public"]["Enums"]["item_type"]
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          claim_id: string
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          claim_id: string
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          claim_id?: string
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_call_logs: {
        Row: {
          answered_by: string | null
          answered_by_position: string | null
          call_duration_seconds: number | null
          call_status: Database["public"]["Enums"]["phone_verification_status"]
          call_summary: string | null
          called_at: string
          caller_id: string
          created_at: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          organization_id: string
          phone_called: string
          phone_source: string
          phone_source_url: string | null
          scheduled_at: string | null
          verification_questions: Json | null
          verification_result: boolean | null
        }
        Insert: {
          answered_by?: string | null
          answered_by_position?: string | null
          call_duration_seconds?: number | null
          call_status: Database["public"]["Enums"]["phone_verification_status"]
          call_summary?: string | null
          called_at: string
          caller_id: string
          created_at?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          organization_id: string
          phone_called: string
          phone_source: string
          phone_source_url?: string | null
          scheduled_at?: string | null
          verification_questions?: Json | null
          verification_result?: boolean | null
        }
        Update: {
          answered_by?: string | null
          answered_by_position?: string | null
          call_duration_seconds?: number | null
          call_status?: Database["public"]["Enums"]["phone_verification_status"]
          call_summary?: string | null
          called_at?: string
          caller_id?: string
          created_at?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          organization_id?: string
          phone_called?: string
          phone_source?: string
          phone_source_url?: string | null
          scheduled_at?: string | null
          verification_questions?: Json | null
          verification_result?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_call_logs_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_contacts: {
        Row: {
          can_manage_claims: boolean | null
          can_manage_items: boolean | null
          can_manage_members: boolean | null
          can_view_analytics: boolean | null
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          id_document_url: string | null
          id_number_hash: string | null
          id_type: string | null
          is_active: boolean | null
          is_primary_contact: boolean | null
          is_verified: boolean | null
          organization_id: string
          phone: string
          phone_alt: string | null
          position_title: string
          role: Database["public"]["Enums"]["org_contact_role"]
          updated_at: string | null
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          can_manage_claims?: boolean | null
          can_manage_items?: boolean | null
          can_manage_members?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          id_document_url?: string | null
          id_number_hash?: string | null
          id_type?: string | null
          is_active?: boolean | null
          is_primary_contact?: boolean | null
          is_verified?: boolean | null
          organization_id: string
          phone: string
          phone_alt?: string | null
          position_title: string
          role: Database["public"]["Enums"]["org_contact_role"]
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          can_manage_claims?: boolean | null
          can_manage_items?: boolean | null
          can_manage_members?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          id_document_url?: string | null
          id_number_hash?: string | null
          id_type?: string | null
          is_active?: boolean | null
          is_primary_contact?: boolean | null
          is_verified?: boolean | null
          organization_id?: string
          phone?: string
          phone_alt?: string | null
          position_title?: string
          role?: Database["public"]["Enums"]["org_contact_role"]
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_contacts_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_contracts: {
        Row: {
          account_holder_name: string | null
          account_number_encrypted: string | null
          amendments: Json | null
          api_rate_limit: number | null
          auto_renew: boolean | null
          bank_branch: string | null
          bank_name: string | null
          bank_verified: boolean | null
          bank_verified_at: string | null
          bank_verified_by: string | null
          contract_document_url: string | null
          contract_status: Database["public"]["Enums"]["contract_status"] | null
          contract_type: string
          created_at: string | null
          end_date: string | null
          id: string
          internal_notes: string | null
          monthly_claim_limit: number | null
          monthly_item_limit: number | null
          org_signatory_name: string | null
          org_signatory_position: string | null
          org_signed_at: string | null
          organization_id: string
          platform_signatory_id: string | null
          platform_signed_at: string | null
          signed_document_url: string | null
          special_terms: string | null
          start_date: string | null
          storage_limit_mb: number | null
          updated_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number_encrypted?: string | null
          amendments?: Json | null
          api_rate_limit?: number | null
          auto_renew?: boolean | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_verified?: boolean | null
          bank_verified_at?: string | null
          bank_verified_by?: string | null
          contract_document_url?: string | null
          contract_status?:
            | Database["public"]["Enums"]["contract_status"]
            | null
          contract_type: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          monthly_claim_limit?: number | null
          monthly_item_limit?: number | null
          org_signatory_name?: string | null
          org_signatory_position?: string | null
          org_signed_at?: string | null
          organization_id: string
          platform_signatory_id?: string | null
          platform_signed_at?: string | null
          signed_document_url?: string | null
          special_terms?: string | null
          start_date?: string | null
          storage_limit_mb?: number | null
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number_encrypted?: string | null
          amendments?: Json | null
          api_rate_limit?: number | null
          auto_renew?: boolean | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_verified?: boolean | null
          bank_verified_at?: string | null
          bank_verified_by?: string | null
          contract_document_url?: string | null
          contract_status?:
            | Database["public"]["Enums"]["contract_status"]
            | null
          contract_type?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          monthly_claim_limit?: number | null
          monthly_item_limit?: number | null
          org_signatory_name?: string | null
          org_signatory_position?: string | null
          org_signed_at?: string | null
          organization_id?: string
          platform_signatory_id?: string | null
          platform_signed_at?: string | null
          signed_document_url?: string | null
          special_terms?: string | null
          start_date?: string | null
          storage_limit_mb?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_contracts_bank_verified_by_fkey"
            columns: ["bank_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contracts_platform_signatory_id_fkey"
            columns: ["platform_signatory_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          member_role: Database["public"]["Enums"]["org_member_role"] | null
          organization_id: string
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          member_role?: Database["public"]["Enums"]["org_member_role"] | null
          organization_id: string
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          member_role?: Database["public"]["Enums"]["org_member_role"] | null
          organization_id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_verification: {
        Row: {
          created_at: string | null
          district: string
          email_domain: string | null
          email_verification_status:
            | Database["public"]["Enums"]["email_verification_status"]
            | null
          email_verification_token: string | null
          email_verification_token_expires: string | null
          email_verified_at: string | null
          generic_email_override_by: string | null
          generic_email_override_reason: string | null
          id: string
          is_generic_email: boolean | null
          letterhead_url: string | null
          municipality: string
          official_email: string
          official_phone: string
          official_phone_alt: string | null
          official_website: string | null
          organization_id: string
          other_documents: Json | null
          pan_certificate_url: string | null
          postal_code: string | null
          province: string
          registered_name: string
          registration_authority: string | null
          registration_certificate_url: string | null
          registration_date: string | null
          registration_number: string
          registration_type: Database["public"]["Enums"]["nepal_registration_type"]
          street_address: string | null
          submitted_at: string | null
          updated_at: string | null
          vat_certificate_url: string | null
          verification_status:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          ward_number: number | null
        }
        Insert: {
          created_at?: string | null
          district: string
          email_domain?: string | null
          email_verification_status?:
            | Database["public"]["Enums"]["email_verification_status"]
            | null
          email_verification_token?: string | null
          email_verification_token_expires?: string | null
          email_verified_at?: string | null
          generic_email_override_by?: string | null
          generic_email_override_reason?: string | null
          id?: string
          is_generic_email?: boolean | null
          letterhead_url?: string | null
          municipality: string
          official_email: string
          official_phone: string
          official_phone_alt?: string | null
          official_website?: string | null
          organization_id: string
          other_documents?: Json | null
          pan_certificate_url?: string | null
          postal_code?: string | null
          province: string
          registered_name: string
          registration_authority?: string | null
          registration_certificate_url?: string | null
          registration_date?: string | null
          registration_number: string
          registration_type: Database["public"]["Enums"]["nepal_registration_type"]
          street_address?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          vat_certificate_url?: string | null
          verification_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          ward_number?: number | null
        }
        Update: {
          created_at?: string | null
          district?: string
          email_domain?: string | null
          email_verification_status?:
            | Database["public"]["Enums"]["email_verification_status"]
            | null
          email_verification_token?: string | null
          email_verification_token_expires?: string | null
          email_verified_at?: string | null
          generic_email_override_by?: string | null
          generic_email_override_reason?: string | null
          id?: string
          is_generic_email?: boolean | null
          letterhead_url?: string | null
          municipality?: string
          official_email?: string
          official_phone?: string
          official_phone_alt?: string | null
          official_website?: string | null
          organization_id?: string
          other_documents?: Json | null
          pan_certificate_url?: string | null
          postal_code?: string | null
          province?: string
          registered_name?: string
          registration_authority?: string | null
          registration_certificate_url?: string | null
          registration_date?: string | null
          registration_number?: string
          registration_type?: Database["public"]["Enums"]["nepal_registration_type"]
          street_address?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          vat_certificate_url?: string | null
          verification_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_verification_generic_email_override_by_fkey"
            columns: ["generic_email_override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verification_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_verification_audit: {
        Row: {
          action: string
          comments: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          new_status:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          organization_id: string
          performed_by: string
          previous_status:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          rejection_category: string | null
          rejection_reason: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          comments?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          new_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          organization_id: string
          performed_by: string
          previous_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          rejection_category?: string | null
          rejection_reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          comments?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          new_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          organization_id?: string
          performed_by?: string
          previous_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          rejection_category?: string | null
          rejection_reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_verification_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verification_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          admin_id: string
          can_manage_claims: boolean | null
          can_post_items: boolean | null
          contact_email: string
          contact_phone: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_verification_check: string | null
          location: Json
          logo_url: string | null
          name: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          trust_score: number | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string | null
          verification_approved_at: string | null
          verification_approved_by: string | null
          verification_status:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          verification_submitted_at: string | null
        }
        Insert: {
          address: string
          admin_id: string
          can_manage_claims?: boolean | null
          can_post_items?: boolean | null
          contact_email: string
          contact_phone: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_verification_check?: string | null
          location: Json
          logo_url?: string | null
          name: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          trust_score?: number | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          verification_approved_at?: string | null
          verification_approved_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          verification_submitted_at?: string | null
        }
        Update: {
          address?: string
          admin_id?: string
          can_manage_claims?: boolean | null
          can_post_items?: boolean | null
          contact_email?: string
          contact_phone?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_verification_check?: string | null
          location?: Json
          logo_url?: string | null
          name?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          trust_score?: number | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          verification_approved_at?: string | null
          verification_approved_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["org_verification_status"]
            | null
          verification_submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_verification_approved_by_fkey"
            columns: ["verification_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_verified: boolean | null
          name: string
          phone: string | null
          preferred_language: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_verified?: boolean | null
          name: string
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_perform_org_action: {
        Args: { p_action: string; p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      extract_email_domain: { Args: { email: string }; Returns: string }
      generate_email_verification_token: { Args: never; Returns: string }
      get_user_org_role: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["org_member_role"]
      }
      increment_item_views: { Args: { item_uuid: string }; Returns: undefined }
      is_approved_email_domain: {
        Args: { email: string }
        Returns: {
          is_approved: boolean
          trust_level: number
        }[]
      }
      is_blocked_email_domain: { Args: { email: string }; Returns: boolean }
      log_org_verification_audit: {
        Args: {
          p_action: string
          p_comments?: string
          p_details?: Json
          p_new_status?: Database["public"]["Enums"]["org_verification_status"]
          p_organization_id: string
          p_performed_by: string
          p_previous_status?: Database["public"]["Enums"]["org_verification_status"]
        }
        Returns: string
      }
    }
    Enums: {
      claim_status: "pending" | "approved" | "rejected" | "withdrawn"
      contract_status:
        | "none"
        | "draft"
        | "pending_signature"
        | "signed"
        | "active"
        | "expired"
        | "terminated"
      email_verification_status:
        | "pending"
        | "code_sent"
        | "verified"
        | "failed"
        | "manual_override"
      handover_method: "meetup" | "delivery"
      item_status: "active" | "claimed" | "resolved" | "expired" | "deleted"
      item_type: "lost" | "found"
      nepal_registration_type:
        | "company_registrar"
        | "pan"
        | "vat"
        | "education_board"
        | "hospital_license"
        | "hotel_license"
        | "transport_license"
        | "police_unit"
        | "government_office"
        | "bank_license"
        | "ngo_registration"
        | "other"
      org_contact_role:
        | "owner"
        | "director"
        | "manager"
        | "it_admin"
        | "operations"
        | "hr"
        | "other"
      org_member_role: "org_owner" | "org_admin" | "org_staff" | "org_viewer"
      org_verification_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "pending_call"
        | "pending_documents"
        | "rejected"
        | "approved"
        | "suspended"
      organization_type:
        | "police"
        | "traffic_police"
        | "airport"
        | "bus_park"
        | "hotel"
        | "mall"
        | "university"
        | "college"
        | "school"
        | "hospital"
        | "bank"
        | "other"
      phone_verification_status:
        | "not_started"
        | "scheduled"
        | "in_progress"
        | "completed_verified"
        | "completed_failed"
        | "unreachable"
      user_role:
        | "individual"
        | "user"
        | "verified_user"
        | "organization"
        | "admin"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      claim_status: ["pending", "approved", "rejected", "withdrawn"],
      contract_status: [
        "none",
        "draft",
        "pending_signature",
        "signed",
        "active",
        "expired",
        "terminated",
      ],
      email_verification_status: [
        "pending",
        "code_sent",
        "verified",
        "failed",
        "manual_override",
      ],
      handover_method: ["meetup", "delivery"],
      item_status: ["active", "claimed", "resolved", "expired", "deleted"],
      item_type: ["lost", "found"],
      nepal_registration_type: [
        "company_registrar",
        "pan",
        "vat",
        "education_board",
        "hospital_license",
        "hotel_license",
        "transport_license",
        "police_unit",
        "government_office",
        "bank_license",
        "ngo_registration",
        "other",
      ],
      org_contact_role: [
        "owner",
        "director",
        "manager",
        "it_admin",
        "operations",
        "hr",
        "other",
      ],
      org_member_role: ["org_owner", "org_admin", "org_staff", "org_viewer"],
      org_verification_status: [
        "draft",
        "submitted",
        "under_review",
        "pending_call",
        "pending_documents",
        "rejected",
        "approved",
        "suspended",
      ],
      organization_type: [
        "police",
        "traffic_police",
        "airport",
        "bus_park",
        "hotel",
        "mall",
        "university",
        "college",
        "school",
        "hospital",
        "bank",
        "other",
      ],
      phone_verification_status: [
        "not_started",
        "scheduled",
        "in_progress",
        "completed_verified",
        "completed_failed",
        "unreachable",
      ],
      user_role: [
        "individual",
        "user",
        "verified_user",
        "organization",
        "admin",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
