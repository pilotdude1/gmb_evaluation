export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action: string
          activity_type: string
          actor_id: string | null
          actor_name: string | null
          actor_type: string | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          importance: string | null
          is_public: boolean | null
          metadata: Json | null
          tenant_id: string
          title: string
        }
        Insert: {
          action: string
          activity_type: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          importance?: string | null
          is_public?: boolean | null
          metadata?: Json | null
          tenant_id: string
          title: string
        }
        Update: {
          action?: string
          activity_type?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          importance?: string | null
          is_public?: boolean | null
          metadata?: Json | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          api_endpoint: string | null
          changed_fields: string[] | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          search_vector: unknown | null
          table_name: string
          tenant_id: string
          timestamp: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          api_endpoint?: string | null
          changed_fields?: string[] | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          search_vector?: unknown | null
          table_name: string
          tenant_id: string
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          api_endpoint?: string | null
          changed_fields?: string[] | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          search_vector?: unknown | null
          table_name?: string
          tenant_id?: string
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_accounts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          annual_revenue_range: string | null
          assigned_to: string | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          email: string | null
          employee_count_range: string | null
          gmb_claimed: boolean | null
          gmb_data: Json | null
          gmb_last_updated: string | null
          gmb_place_id: string | null
          gmb_rating: number | null
          gmb_review_count: number | null
          id: string
          industry: string | null
          lead_score: number | null
          legal_name: string | null
          name: string
          phone: string | null
          postal_code: string | null
          qualification_status: string | null
          search_vector: unknown | null
          state: string | null
          tenant_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue_range?: string | null
          assigned_to?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          employee_count_range?: string | null
          gmb_claimed?: boolean | null
          gmb_data?: Json | null
          gmb_last_updated?: string | null
          gmb_place_id?: string | null
          gmb_rating?: number | null
          gmb_review_count?: number | null
          id?: string
          industry?: string | null
          lead_score?: number | null
          legal_name?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          qualification_status?: string | null
          search_vector?: unknown | null
          state?: string | null
          tenant_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue_range?: string | null
          assigned_to?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          employee_count_range?: string | null
          gmb_claimed?: boolean | null
          gmb_data?: Json | null
          gmb_last_updated?: string | null
          gmb_place_id?: string | null
          gmb_rating?: number | null
          gmb_review_count?: number | null
          id?: string
          industry?: string | null
          lead_score?: number | null
          legal_name?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          qualification_status?: string | null
          search_vector?: unknown | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          account_id: string | null
          activity_subtype: string | null
          activity_type: string
          channel: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          direction: string | null
          due_date: string | null
          external_id: string | null
          id: string
          integration_data: Json | null
          integration_source: string | null
          is_completed: boolean | null
          subject: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          activity_subtype?: string | null
          activity_type: string
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          direction?: string | null
          due_date?: string | null
          external_id?: string | null
          id?: string
          integration_data?: Json | null
          integration_source?: string | null
          is_completed?: boolean | null
          subject?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          activity_subtype?: string | null
          activity_type?: string
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          direction?: string | null
          due_date?: string | null
          external_id?: string | null
          id?: string
          integration_data?: Json | null
          integration_source?: string | null
          is_completed?: boolean | null
          subject?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_memberships: {
        Row: {
          campaign_id: string
          contact_id: string
          emails_clicked: number | null
          emails_opened: number | null
          emails_sent: number | null
          id: string
          joined_at: string | null
          last_interaction_at: string | null
          sms_sent: number | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          campaign_id: string
          contact_id: string
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          id?: string
          joined_at?: string | null
          last_interaction_at?: string | null
          sms_sent?: number | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          id?: string
          joined_at?: string | null
          last_interaction_at?: string | null
          sms_sent?: number | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_memberships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          campaign_type: string
          content_template: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_opened: number | null
          emails_sent: number | null
          external_campaign_ids: Json | null
          id: string
          name: string
          scheduled_end: string | null
          scheduled_start: string | null
          sms_delivered: number | null
          sms_sent: number | null
          status: string | null
          target_audience: Json | null
          tenant_id: string
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          campaign_type: string
          content_template?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          external_campaign_ids?: Json | null
          id?: string
          name: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          sms_delivered?: number | null
          sms_sent?: number | null
          status?: string | null
          target_audience?: Json | null
          tenant_id: string
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          campaign_type?: string
          content_template?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          external_campaign_ids?: Json | null
          id?: string
          name?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          sms_delivered?: number | null
          sms_sent?: number | null
          status?: string | null
          target_audience?: Json | null
          tenant_id?: string
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          department: string | null
          do_not_call: boolean | null
          do_not_email: boolean | null
          do_not_sms: boolean | null
          email: string | null
          email_clicks: number | null
          email_opens: number | null
          first_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_contact_method: string | null
          last_contacted_at: string | null
          last_name: string | null
          lead_score: number | null
          lead_source: string | null
          lead_status: string | null
          mobile_phone: string | null
          phone: string | null
          preferred_contact_method: string | null
          search_vector: unknown | null
          tenant_id: string
          timezone: string | null
          total_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          department?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          do_not_sms?: boolean | null
          email?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_contact_method?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          mobile_phone?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          search_vector?: unknown | null
          tenant_id: string
          timezone?: string | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          department?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          do_not_sms?: boolean | null
          email?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_contact_method?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          mobile_phone?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          search_vector?: unknown | null
          tenant_id?: string
          timezone?: string | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          account_id: string | null
          actual_close_date: string | null
          assigned_to: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          custom_fields: Json | null
          deal_type: string | null
          deal_value: number | null
          description: string | null
          expected_close_date: string | null
          id: string
          lead_source: string | null
          name: string
          probability: number | null
          search_vector: unknown | null
          stage: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          actual_close_date?: string | null
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          deal_type?: string | null
          deal_value?: number | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_source?: string | null
          name: string
          probability?: number | null
          search_vector?: unknown | null
          stage?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          actual_close_date?: string | null
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          deal_type?: string | null
          deal_value?: number | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_source?: string | null
          name?: string
          probability?: number | null
          search_vector?: unknown | null
          stage?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_field_definitions: {
        Row: {
          created_at: string | null
          display_order: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          help_text: string | null
          id: string
          industry: string | null
          is_required: boolean | null
          is_visible: boolean | null
          tenant_id: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type: string
          help_text?: string | null
          id?: string
          industry?: string | null
          is_required?: boolean | null
          is_visible?: boolean | null
          tenant_id: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          entity_type?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          help_text?: string | null
          id?: string
          industry?: string | null
          is_required?: boolean | null
          is_visible?: boolean | null
          tenant_id?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_field_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_sources: {
        Row: {
          cost_per_lead: number | null
          created_at: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          source_name: string
          source_type: string
          tenant_id: string
        }
        Insert: {
          cost_per_lead?: number | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          source_name: string
          source_type: string
          tenant_id: string
        }
        Update: {
          cost_per_lead?: number | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          source_name?: string
          source_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          created_at: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_closed_lost: boolean | null
          is_closed_won: boolean | null
          probability: number | null
          stage_name: string
          stage_order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          probability?: number | null
          stage_name: string
          stage_order: number
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          probability?: number | null
          stage_name?: string
          stage_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_text: string | null
          action_url: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_method: string[] | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          read_at: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_method?: string[] | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type: string
          read_at?: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_method?: string[] | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          read_at?: string | null
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          created_at: string | null
          data: Json | null
          event_name: string
          event_type: string
          execution_time_ms: number | null
          id: string
          ip_address: unknown | null
          memory_usage_mb: number | null
          message: string | null
          severity: string | null
          source: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_name: string
          event_type: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown | null
          memory_usage_mb?: number | null
          message?: string | null
          severity?: string | null
          source?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_name?: string
          event_type?: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown | null
          memory_usage_mb?: number | null
          message?: string | null
          severity?: string | null
          source?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          industry: string | null
          max_accounts: number | null
          max_contacts: number | null
          max_deals: number | null
          max_users: number | null
          name: string
          plan: string | null
          settings: Json | null
          slug: string
          status: string | null
          subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          max_accounts?: number | null
          max_contacts?: number | null
          max_deals?: number | null
          max_users?: number | null
          name: string
          plan?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          max_accounts?: number | null
          max_contacts?: number | null
          max_deals?: number | null
          max_users?: number | null
          name?: string
          plan?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_tenant_id: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferences: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_tenant_id?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_tenant_id?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_current_tenant_id_fkey"
            columns: ["current_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_activity: {
        Args: {
          p_action: string
          p_activity_type: string
          p_actor_id?: string
          p_actor_name?: string
          p_description?: string
          p_entity_id?: string
          p_entity_type?: string
          p_importance?: string
          p_is_public?: boolean
          p_metadata?: Json
          p_tenant_id: string
          p_title?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_text?: string
          p_action_url?: string
          p_delivery_method?: string[]
          p_entity_id?: string
          p_entity_type?: string
          p_message?: string
          p_notification_type?: string
          p_tenant_id: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      setup_default_crm_config: {
        Args: { p_industry?: string; p_tenant_id: string }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      user_has_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

