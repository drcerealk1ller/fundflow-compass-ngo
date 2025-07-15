export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      allocations: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          funding_id: string
          id: string
          notes: string | null
          project_id: string | null
          sub_project_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          funding_id: string
          id?: string
          notes?: string | null
          project_id?: string | null
          sub_project_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          funding_id?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          sub_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allocations_funding_id_fkey"
            columns: ["funding_id"]
            isOneToOne: false
            referencedRelation: "funding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_sub_project_id_fkey"
            columns: ["sub_project_id"]
            isOneToOne: false
            referencedRelation: "sub_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          parent_account_id: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_account_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_account_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          fund_source_id: string | null
          id: string
          invoice_number: string | null
          paid_from_account_id: string | null
          payment_mode: string | null
          project_allocation_id: string | null
          sub_project_id: string
          tax_category: Database["public"]["Enums"]["tax_category"] | null
          tax_deductible: boolean | null
          transaction_type: string | null
          updated_at: string
          vendor_name: string | null
          voucher_reference: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_url?: string | null
          category: string
          created_at?: string
          created_by: string
          description: string
          expense_date: string
          fund_source_id?: string | null
          id?: string
          invoice_number?: string | null
          paid_from_account_id?: string | null
          payment_mode?: string | null
          project_allocation_id?: string | null
          sub_project_id: string
          tax_category?: Database["public"]["Enums"]["tax_category"] | null
          tax_deductible?: boolean | null
          transaction_type?: string | null
          updated_at?: string
          vendor_name?: string | null
          voucher_reference?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          fund_source_id?: string | null
          id?: string
          invoice_number?: string | null
          paid_from_account_id?: string | null
          payment_mode?: string | null
          project_allocation_id?: string | null
          sub_project_id?: string
          tax_category?: Database["public"]["Enums"]["tax_category"] | null
          tax_deductible?: boolean | null
          transaction_type?: string | null
          updated_at?: string
          vendor_name?: string | null
          voucher_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_fund_source_id_fkey"
            columns: ["fund_source_id"]
            isOneToOne: false
            referencedRelation: "funding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_from_account_id_fkey"
            columns: ["paid_from_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_allocation_id_fkey"
            columns: ["project_allocation_id"]
            isOneToOne: false
            referencedRelation: "allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_sub_project_id_fkey"
            columns: ["sub_project_id"]
            isOneToOne: false
            referencedRelation: "sub_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      funding: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          created_by: string
          date_received: string
          donor_name: string
          donor_type: string | null
          id: string
          notes: string | null
          tax_deductible: boolean | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          created_by: string
          date_received: string
          donor_name: string
          donor_type?: string | null
          id?: string
          notes?: string | null
          tax_deductible?: boolean | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string
          date_received?: string
          donor_name?: string
          donor_type?: string | null
          id?: string
          notes?: string | null
          tax_deductible?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reporting_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_entries: {
        Row: {
          account_id: string
          amount: number
          entry_type: Database["public"]["Enums"]["entry_type"]
          id: string
          notes: string | null
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          entry_type: Database["public"]["Enums"]["entry_type"]
          id?: string
          notes?: string | null
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          notes?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          reference_id: string | null
          reference_type: Database["public"]["Enums"]["reference_type"] | null
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_allocations_with_budget: {
        Args: Record<PropertyKey, never>
        Returns: {
          allocation_id: string
          project_id: string
          project_name: string
          allocated_amount: number
          spent_amount: number
          available_amount: number
          funding_donor: string
        }[]
      }
      get_project_available_budget: {
        Args: { project_id_param: string }
        Returns: number
      }
    }
    Enums: {
      account_type: "Asset" | "Liability" | "Equity" | "Income" | "Expense"
      entry_type: "debit" | "credit"
      reference_type: "expense" | "funding" | "allocation"
      tax_category: "VAT" | "Service" | "None"
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
      account_type: ["Asset", "Liability", "Equity", "Income", "Expense"],
      entry_type: ["debit", "credit"],
      reference_type: ["expense", "funding", "allocation"],
      tax_category: ["VAT", "Service", "None"],
    },
  },
} as const
