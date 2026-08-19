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
      tenant: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          legal_name: string
          slug: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          legal_name: string
          slug: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          legal_name?: string
          slug?: string
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
          created_at: string
          id: string
          role_id: string
          scope: string
          tenant_id: string
        }
        Insert: {
          app_user_id: string
          branch_id?: string | null
          created_at?: string
          id?: string
          role_id: string
          scope: string
          tenant_id: string
        }
        Update: {
          app_user_id?: string
          branch_id?: string | null
          created_at?: string
          id?: string
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
            foreignKeyName: "user_role_role_id_tenant_id_fkey"
            columns: ["role_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "role"
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
