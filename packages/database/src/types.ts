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
    PostgrestVersion: "14.15"
  }
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
      app_user: {
        Row: {
          auth_user_id: string
          created_at: string
          data_classification: string
          email: string
          full_name: string
          id: string
          tenant_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          data_classification?: string
          email: string
          full_name: string
          id?: string
          tenant_id: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          data_classification?: string
          email?: string
          full_name?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          data_classification: string
          id: string
          metadata: Json
          occurred_at: string
          resource_id: string | null
          resource_table: string
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          data_classification: string
          id?: string
          metadata?: Json
          occurred_at?: string
          resource_id?: string | null
          resource_table: string
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          data_classification?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          resource_id?: string | null
          resource_table?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_tenant_id_fkey"
            columns: ["actor_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      branch: {
        Row: {
          created_at: string
          id: string
          municipality_id: string | null
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipality_id?: string | null
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          municipality_id?: string | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      charge: {
        Row: {
          amount: number
          barcode: string | null
          billing_type: string | null
          boleto_url: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by_platform_admin_id: string | null
          created_at: string
          data_classification: string
          due_date: string
          id: string
          nosso_numero: string | null
          obligation_id: string
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          pix_copy_paste: string | null
          provider: string | null
          provider_charge_id: string | null
          provider_payload: Json
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          barcode?: string | null
          billing_type?: string | null
          boleto_url?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_platform_admin_id?: string | null
          created_at?: string
          data_classification?: string
          due_date: string
          id?: string
          nosso_numero?: string | null
          obligation_id: string
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          pix_copy_paste?: string | null
          provider?: string | null
          provider_charge_id?: string | null
          provider_payload?: Json
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          barcode?: string | null
          billing_type?: string | null
          boleto_url?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_platform_admin_id?: string | null
          created_at?: string
          data_classification?: string
          due_date?: string
          id?: string
          nosso_numero?: string | null
          obligation_id?: string
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          pix_copy_paste?: string | null
          provider?: string | null
          provider_charge_id?: string | null
          provider_payload?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charge_cancelled_by_platform_admin_id_fkey"
            columns: ["cancelled_by_platform_admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charge_obligation_id_tenant_id_fkey"
            columns: ["obligation_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "obligation"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "charge_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      cnae: {
        Row: {
          code: string
          data_classification: string
          description: string
          id: string
          section: string
        }
        Insert: {
          code: string
          data_classification?: string
          description: string
          id?: string
          section: string
        }
        Update: {
          code?: string
          data_classification?: string
          description?: string
          id?: string
          section?: string
        }
        Relationships: []
      }
      collective_agreement: {
        Row: {
          base_date: string
          created_at: string
          data_classification: string
          economic_category_id: string
          id: string
          kind: string
          mediador_number: string | null
          professional_category_id: string
          tenant_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          base_date: string
          created_at?: string
          data_classification?: string
          economic_category_id: string
          id?: string
          kind: string
          mediador_number?: string | null
          professional_category_id: string
          tenant_id: string
          valid_from: string
          valid_until: string
        }
        Update: {
          base_date?: string
          created_at?: string
          data_classification?: string
          economic_category_id?: string
          id?: string
          kind?: string
          mediador_number?: string | null
          professional_category_id?: string
          tenant_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "collective_agreement_economic_category_id_tenant_id_fkey"
            columns: ["economic_category_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "economic_category"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "collective_agreement_professional_category_id_tenant_id_fkey"
            columns: ["professional_category_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "professional_category"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      collective_agreement_territory: {
        Row: {
          collective_agreement_id: string
          id: string
          municipality_id: string
          tenant_id: string
        }
        Insert: {
          collective_agreement_id: string
          id?: string
          municipality_id: string
          tenant_id: string
        }
        Update: {
          collective_agreement_id?: string
          id?: string
          municipality_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collective_agreement_territor_collective_agreement_id_tena_fkey"
            columns: ["collective_agreement_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "collective_agreement"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "collective_agreement_territory_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
        ]
      }
      company: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          asaas_customer_id: string | null
          branch_id: string | null
          cnpj: string
          created_at: string
          data_classification: string
          id: string
          legal_name: string
          municipality_id: string | null
          primary_cnae_id: string | null
          status: string
          tenant_id: string
          trade_name: string | null
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          asaas_customer_id?: string | null
          branch_id?: string | null
          cnpj: string
          created_at?: string
          data_classification?: string
          id?: string
          legal_name: string
          municipality_id?: string | null
          primary_cnae_id?: string | null
          status?: string
          tenant_id: string
          trade_name?: string | null
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          asaas_customer_id?: string | null
          branch_id?: string | null
          cnpj?: string
          created_at?: string
          data_classification?: string
          id?: string
          legal_name?: string
          municipality_id?: string | null
          primary_cnae_id?: string | null
          status?: string
          tenant_id?: string
          trade_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_branch_id_tenant_id_fkey"
            columns: ["branch_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "company_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_primary_cnae_id_fkey"
            columns: ["primary_cnae_id"]
            isOneToOne: false
            referencedRelation: "cnae"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_rule: {
        Row: {
          calculation_base: string
          collective_agreement_id: string
          created_at: string
          data_classification: string
          id: string
          tenant_id: string
          type: string
          valid_from: string
          valid_until: string | null
          value: number
          value_type: string
        }
        Insert: {
          calculation_base: string
          collective_agreement_id: string
          created_at?: string
          data_classification?: string
          id?: string
          tenant_id: string
          type: string
          valid_from: string
          valid_until?: string | null
          value: number
          value_type: string
        }
        Update: {
          calculation_base?: string
          collective_agreement_id?: string
          created_at?: string
          data_classification?: string
          id?: string
          tenant_id?: string
          type?: string
          valid_from?: string
          valid_until?: string | null
          value?: number
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_rule_collective_agreement_id_tenant_id_fkey"
            columns: ["collective_agreement_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "collective_agreement"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      delegation: {
        Row: {
          created_at: string
          data_classification: string
          granted_by: string | null
          id: string
          office_id: string | null
          principal_app_user_id: string
          reason: string
          revoked_at: string | null
          subject_id: string
          subject_kind: string
          tenant_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          data_classification?: string
          granted_by?: string | null
          id?: string
          office_id?: string | null
          principal_app_user_id: string
          reason: string
          revoked_at?: string | null
          subject_id: string
          subject_kind: string
          tenant_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          data_classification?: string
          granted_by?: string | null
          id?: string
          office_id?: string | null
          principal_app_user_id?: string
          reason?: string
          revoked_at?: string | null
          subject_id?: string
          subject_kind?: string
          tenant_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegation_granted_by_tenant_id_fkey"
            columns: ["granted_by", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "delegation_office_id_tenant_id_fkey"
            columns: ["office_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "office"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "delegation_principal_app_user_id_tenant_id_fkey"
            columns: ["principal_app_user_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "delegation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      department: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_branch_id_tenant_id_fkey"
            columns: ["branch_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "department_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_category: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "economic_category_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_relationship: {
        Row: {
          company_id: string
          created_at: string
          data_classification: string
          establishment_id: string | null
          id: string
          job_title: string | null
          source: string
          status: string
          tenant_id: string
          valid_from: string
          valid_until: string | null
          worker_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_classification?: string
          establishment_id?: string | null
          id?: string
          job_title?: string | null
          source?: string
          status?: string
          tenant_id: string
          valid_from: string
          valid_until?: string | null
          worker_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_classification?: string
          establishment_id?: string | null
          id?: string
          job_title?: string | null
          source?: string
          status?: string
          tenant_id?: string
          valid_from?: string
          valid_until?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_relationship_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "employment_relationship_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company_current_representation"
            referencedColumns: ["company_id", "tenant_id"]
          },
          {
            foreignKeyName: "employment_relationship_establishment_id_tenant_id_fkey"
            columns: ["establishment_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "establishment"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "employment_relationship_worker_id_tenant_id_fkey"
            columns: ["worker_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "worker"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      establishment: {
        Row: {
          cnae_id: string | null
          cnpj: string
          company_id: string
          created_at: string
          data_classification: string
          id: string
          kind: string
          municipality_id: string | null
          tenant_id: string
        }
        Insert: {
          cnae_id?: string | null
          cnpj: string
          company_id: string
          created_at?: string
          data_classification?: string
          id?: string
          kind: string
          municipality_id?: string | null
          tenant_id: string
        }
        Update: {
          cnae_id?: string | null
          cnpj?: string
          company_id?: string
          created_at?: string
          data_classification?: string
          id?: string
          kind?: string
          municipality_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_cnae_id_fkey"
            columns: ["cnae_id"]
            isOneToOne: false
            referencedRelation: "cnae"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "establishment_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company_current_representation"
            referencedColumns: ["company_id", "tenant_id"]
          },
          {
            foreignKeyName: "establishment_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry: {
        Row: {
          charge_id: string
          created_at: string
          data_classification: string
          description: string
          id: string
          occurred_at: string
          tenant_id: string
        }
        Insert: {
          charge_id: string
          created_at?: string
          data_classification?: string
          description: string
          id?: string
          occurred_at?: string
          tenant_id: string
        }
        Update: {
          charge_id?: string
          created_at?: string
          data_classification?: string
          description?: string
          id?: string
          occurred_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_charge_id_tenant_id_fkey"
            columns: ["charge_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "charge"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "journal_entry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_line: {
        Row: {
          account: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
          tenant_id: string
        }
        Insert: {
          account: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
          tenant_id: string
        }
        Update: {
          account?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_line_journal_entry_id_tenant_id_fkey"
            columns: ["journal_entry_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "journal_entry"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      membership: {
        Row: {
          category: string | null
          contribution_form: string | null
          created_at: string
          data_classification: string
          id: string
          person_id: string
          status: string
          tenant_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          category?: string | null
          contribution_form?: string | null
          created_at?: string
          data_classification?: string
          id?: string
          person_id: string
          status: string
          tenant_id: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          category?: string | null
          contribution_form?: string | null
          created_at?: string
          data_classification?: string
          id?: string
          person_id?: string
          status?: string
          tenant_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_person_id_tenant_id_fkey"
            columns: ["person_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      municipality: {
        Row: {
          data_classification: string
          ibge_code: string
          id: string
          name: string
          state_code: string
        }
        Insert: {
          data_classification?: string
          ibge_code: string
          id?: string
          name: string
          state_code: string
        }
        Update: {
          data_classification?: string
          ibge_code?: string
          id?: string
          name?: string
          state_code?: string
        }
        Relationships: []
      }
      obligation: {
        Row: {
          amount: number
          company_id: string
          competence: string
          contribution_rule_id: string
          created_at: string
          currency: string
          data_classification: string
          id: string
          rule_snapshot: Json
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          company_id: string
          competence: string
          contribution_rule_id: string
          created_at?: string
          currency?: string
          data_classification?: string
          id?: string
          rule_snapshot: Json
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          competence?: string
          contribution_rule_id?: string
          created_at?: string
          currency?: string
          data_classification?: string
          id?: string
          rule_snapshot?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligation_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "obligation_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company_current_representation"
            referencedColumns: ["company_id", "tenant_id"]
          },
          {
            foreignKeyName: "obligation_contribution_rule_id_tenant_id_fkey"
            columns: ["contribution_rule_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "contribution_rule"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "obligation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      office: {
        Row: {
          created_at: string
          data_classification: string
          document: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          data_classification?: string
          document?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          data_classification?: string
          document?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      office_company_link: {
        Row: {
          company_id: string
          created_at: string
          data_classification: string
          id: string
          linked_by: string | null
          office_id: string
          reason: string
          tenant_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          data_classification?: string
          id?: string
          linked_by?: string | null
          office_id: string
          reason: string
          tenant_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          data_classification?: string
          id?: string
          linked_by?: string | null
          office_id?: string
          reason?: string
          tenant_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_company_link_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "office_company_link_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company_current_representation"
            referencedColumns: ["company_id", "tenant_id"]
          },
          {
            foreignKeyName: "office_company_link_linked_by_tenant_id_fkey"
            columns: ["linked_by", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "office_company_link_office_id_tenant_id_fkey"
            columns: ["office_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "office"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      outbox_event: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          published_at: string | null
          tenant_id: string
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          event_type: string
          id?: string
          occurred_at?: string
          payload: Json
          published_at?: string | null
          tenant_id: string
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          published_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbox_event_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_event: {
        Row: {
          charge_id: string | null
          created_at: string
          external_event_id: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          tenant_id: string
        }
        Insert: {
          charge_id?: string | null
          created_at?: string
          external_event_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          tenant_id: string
        }
        Update: {
          charge_id?: string | null
          created_at?: string
          external_event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_event_charge_id_tenant_id_fkey"
            columns: ["charge_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "charge"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "payment_webhook_event_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      permission: {
        Row: {
          description: string
          id: string
          key: string
        }
        Insert: {
          description: string
          id?: string
          key: string
        }
        Update: {
          description?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      person: {
        Row: {
          app_user_id: string | null
          birth_date: string | null
          cpf: string
          created_at: string
          data_classification: string
          email: string | null
          full_name: string
          id: string
          municipality_id: string | null
          phone: string | null
          social_name: string | null
          tenant_id: string
        }
        Insert: {
          app_user_id?: string | null
          birth_date?: string | null
          cpf: string
          created_at?: string
          data_classification?: string
          email?: string | null
          full_name: string
          id?: string
          municipality_id?: string | null
          phone?: string | null
          social_name?: string | null
          tenant_id: string
        }
        Update: {
          app_user_id?: string | null
          birth_date?: string | null
          cpf?: string
          created_at?: string
          data_classification?: string
          email?: string | null
          full_name?: string
          id?: string
          municipality_id?: string | null
          phone?: string | null
          social_name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_app_user_id_tenant_id_fkey"
            columns: ["app_user_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "person_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admin: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      platform_notification: {
        Row: {
          body: string
          charge_id: string | null
          created_at: string
          created_by_platform_admin_id: string | null
          data_classification: string
          id: string
          read_at: string | null
          severity: string
          tenant_id: string | null
          title: string
        }
        Insert: {
          body: string
          charge_id?: string | null
          created_at?: string
          created_by_platform_admin_id?: string | null
          data_classification?: string
          id?: string
          read_at?: string | null
          severity?: string
          tenant_id?: string | null
          title: string
        }
        Update: {
          body?: string
          charge_id?: string | null
          created_at?: string
          created_by_platform_admin_id?: string | null
          data_classification?: string
          id?: string
          read_at?: string | null
          severity?: string
          tenant_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_notification_created_by_platform_admin_id_fkey"
            columns: ["created_by_platform_admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_notification_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_category: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_category_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      role: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permission: {
        Row: {
          id: string
          permission_id: string
          role_id: string
          tenant_id: string
        }
        Insert: {
          id?: string
          permission_id: string
          role_id: string
          tenant_id: string
        }
        Update: {
          id?: string
          permission_id?: string
          role_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permission_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permission_role_id_tenant_id_fkey"
            columns: ["role_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      staff_invite: {
        Row: {
          accepted_at: string | null
          branch_id: string | null
          company_id: string | null
          created_at: string
          data_classification: string
          department_id: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          office_id: string | null
          person_id: string | null
          revoked_at: string | null
          role_name: string
          scope: string
          tenant_id: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          data_classification?: string
          department_id?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          office_id?: string | null
          person_id?: string | null
          revoked_at?: string | null
          role_name: string
          scope: string
          tenant_id: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          data_classification?: string
          department_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          office_id?: string | null
          person_id?: string | null
          revoked_at?: string | null
          role_name?: string
          scope?: string
          tenant_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invite_branch_id_tenant_id_fkey"
            columns: ["branch_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "staff_invite_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "staff_invite_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company_current_representation"
            referencedColumns: ["company_id", "tenant_id"]
          },
          {
            foreignKeyName: "staff_invite_department_id_tenant_id_fkey"
            columns: ["department_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "staff_invite_invited_by_tenant_id_fkey"
            columns: ["invited_by", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "staff_invite_office_id_tenant_id_fkey"
            columns: ["office_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "office"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "staff_invite_person_id_tenant_id_fkey"
            columns: ["person_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "staff_invite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant: {
        Row: {
          cnpj: string
          created_at: string
          default_charge_provider: string
          email: string | null
          id: string
          itau_beneficiario_id: string | null
          itau_carteira_code: string | null
          itau_pix_key: string | null
          legal_name: string
          phone: string | null
          sector: string | null
          slug: string
          trade_name: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string
          default_charge_provider?: string
          email?: string | null
          id?: string
          itau_beneficiario_id?: string | null
          itau_carteira_code?: string | null
          itau_pix_key?: string | null
          legal_name: string
          phone?: string | null
          sector?: string | null
          slug: string
          trade_name?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string
          default_charge_provider?: string
          email?: string | null
          id?: string
          itau_beneficiario_id?: string | null
          itau_carteira_code?: string | null
          itau_pix_key?: string | null
          legal_name?: string
          phone?: string | null
          sector?: string | null
          slug?: string
          trade_name?: string | null
        }
        Relationships: []
      }
      union_registration: {
        Row: {
          created_at: string
          document_reference: string | null
          economic_category_id: string | null
          id: string
          professional_category_id: string | null
          registered_at: string
          registry_number: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          document_reference?: string | null
          economic_category_id?: string | null
          id?: string
          professional_category_id?: string | null
          registered_at: string
          registry_number: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          document_reference?: string | null
          economic_category_id?: string | null
          id?: string
          professional_category_id?: string | null
          registered_at?: string
          registry_number?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "union_registration_economic_category_id_tenant_id_fkey"
            columns: ["economic_category_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "economic_category"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "union_registration_professional_category_id_tenant_id_fkey"
            columns: ["professional_category_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "professional_category"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "union_registration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      union_representation: {
        Row: {
          basis: string
          created_at: string
          data_classification: string
          decided_at: string | null
          decided_by: string | null
          establishment_id: string
          evidence: string
          id: string
          status: string
          tenant_id: string
          union_registration_id: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          basis: string
          created_at?: string
          data_classification?: string
          decided_at?: string | null
          decided_by?: string | null
          establishment_id: string
          evidence: string
          id?: string
          status: string
          tenant_id: string
          union_registration_id?: string | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          basis?: string
          created_at?: string
          data_classification?: string
          decided_at?: string | null
          decided_by?: string | null
          establishment_id?: string
          evidence?: string
          id?: string
          status?: string
          tenant_id?: string
          union_registration_id?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "union_representation_decided_by_tenant_id_fkey"
            columns: ["decided_by", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "union_representation_establishment_id_tenant_id_fkey"
            columns: ["establishment_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "establishment"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "union_representation_union_registration_id_tenant_id_fkey"
            columns: ["union_registration_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "union_registration"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      union_territory: {
        Row: {
          id: string
          municipality_id: string
          tenant_id: string
          union_registration_id: string
        }
        Insert: {
          id?: string
          municipality_id: string
          tenant_id: string
          union_registration_id: string
        }
        Update: {
          id?: string
          municipality_id?: string
          tenant_id?: string
          union_registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "union_territory_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "union_territory_union_registration_id_tenant_id_fkey"
            columns: ["union_registration_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "union_registration"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      user_role: {
        Row: {
          app_user_id: string
          branch_id: string | null
          company_id: string | null
          created_at: string
          department_id: string | null
          id: string
          office_id: string | null
          role_id: string
          scope: string
          tenant_id: string
        }
        Insert: {
          app_user_id: string
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          office_id?: string | null
          role_id: string
          scope: string
          tenant_id: string
        }
        Update: {
          app_user_id?: string
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          office_id?: string | null
          role_id?: string
          scope?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_app_user_id_tenant_id_fkey"
            columns: ["app_user_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "user_role_branch_id_tenant_id_fkey"
            columns: ["branch_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "user_role_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "user_role_company_id_tenant_id_fkey"
            columns: ["company_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "company_current_representation"
            referencedColumns: ["company_id", "tenant_id"]
          },
          {
            foreignKeyName: "user_role_department_id_tenant_id_fkey"
            columns: ["department_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "user_role_office_id_tenant_id_fkey"
            columns: ["office_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "office"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "user_role_role_id_tenant_id_fkey"
            columns: ["role_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      worker: {
        Row: {
          branch_id: string | null
          created_at: string
          data_classification: string
          id: string
          person_id: string
          registration_number: string | null
          tenant_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          data_classification?: string
          id?: string
          person_id: string
          registration_number?: string | null
          tenant_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          data_classification?: string
          id?: string
          person_id?: string
          registration_number?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_branch_id_tenant_id_fkey"
            columns: ["branch_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "worker_person_id_tenant_id_fkey"
            columns: ["person_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
    }
    Views: {
      company_current_representation: {
        Row: {
          company_id: string | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      app_current_tenant_ids: { Args: never; Returns: string[] }
      cancel_charge: {
        Args: {
          p_charge_id: string
          p_platform_admin_id?: string
          p_reason: string
          p_tenant_id: string
        }
        Returns: {
          amount: number
          barcode: string | null
          billing_type: string | null
          boleto_url: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by_platform_admin_id: string | null
          created_at: string
          data_classification: string
          due_date: string
          id: string
          nosso_numero: string | null
          obligation_id: string
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          pix_copy_paste: string | null
          provider: string | null
          provider_charge_id: string | null
          provider_payload: Json
          status: string
          tenant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "charge"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      settle_charge: {
        Args: {
          p_charge_id: string
          p_payment_method?: string
          p_tenant_id: string
        }
        Returns: {
          amount: number
          barcode: string | null
          billing_type: string | null
          boleto_url: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by_platform_admin_id: string | null
          created_at: string
          data_classification: string
          due_date: string
          id: string
          nosso_numero: string | null
          obligation_id: string
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          pix_copy_paste: string | null
          provider: string | null
          provider_charge_id: string | null
          provider_payload: Json
          status: string
          tenant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "charge"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      settle_charge_manual: {
        Args: { p_charge_id: string; p_tenant_id: string }
        Returns: {
          amount: number
          barcode: string | null
          billing_type: string | null
          boleto_url: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by_platform_admin_id: string | null
          created_at: string
          data_classification: string
          due_date: string
          id: string
          nosso_numero: string | null
          obligation_id: string
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          pix_copy_paste: string | null
          provider: string | null
          provider_charge_id: string | null
          provider_payload: Json
          status: string
          tenant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "charge"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      test_rollback_company_insert: {
        Args: { p_cnpj: string; p_tenant_id: string }
        Returns: undefined
      }
      test_tables_missing_rls: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      test_tenant_fks_not_composite: {
        Args: never
        Returns: {
          constraint_name: string
          table_name: string
        }[]
      }
      test_tenant_tables_missing_unique: {
        Args: never
        Returns: {
          table_name: string
        }[]
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
