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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aut_courses: {
        Row: {
          category: string
          course_code: string
          course_name_ar: string
          course_name_en: string | null
          created_at: string
          credits: number
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean
          prerequisites: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          course_code: string
          course_name_ar: string
          course_name_en?: string | null
          created_at?: string
          credits?: number
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          prerequisites?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          course_code?: string
          course_name_ar?: string
          course_name_en?: string | null
          created_at?: string
          credits?: number
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          prerequisites?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      equivalency_matches: {
        Row: {
          aut_course_id: string | null
          aut_credits: number
          created_at: string
          id: string
          is_manual: boolean
          notes: string | null
          request_id: string
          similarity: number | null
          source_item_ids: string[]
          total_source_credits: number
          updated_at: string
          verdict: string
        }
        Insert: {
          aut_course_id?: string | null
          aut_credits?: number
          created_at?: string
          id?: string
          is_manual?: boolean
          notes?: string | null
          request_id: string
          similarity?: number | null
          source_item_ids?: string[]
          total_source_credits?: number
          updated_at?: string
          verdict?: string
        }
        Update: {
          aut_course_id?: string | null
          aut_credits?: number
          created_at?: string
          id?: string
          is_manual?: boolean
          notes?: string | null
          request_id?: string
          similarity?: number | null
          source_item_ids?: string[]
          total_source_credits?: number
          updated_at?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "equivalency_matches_aut_course_id_fkey"
            columns: ["aut_course_id"]
            isOneToOne: false
            referencedRelation: "aut_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equivalency_matches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "equivalency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      equivalency_request_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          request_id: string
          source_course_code: string | null
          source_course_name: string
          source_credits: number
          source_grade: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          request_id: string
          source_course_code?: string | null
          source_course_name: string
          source_credits?: number
          source_grade?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          request_id?: string
          source_course_code?: string | null
          source_course_name?: string
          source_credits?: number
          source_grade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equivalency_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "equivalency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      equivalency_requests: {
        Row: {
          academic_year: string | null
          admin_notes: string | null
          ai_result: Json
          created_at: string
          credits_cap: number
          cumulative_gpa: number | null
          diploma_gpa: number | null
          id: string
          input_mode: string
          matched_aut_code: string | null
          matched_aut_name: string | null
          previous_diploma_source: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_name: string | null
          saudi_course_description: string | null
          saudi_course_name: string | null
          semester: string | null
          similarity: number | null
          status: string
          student_college: string | null
          student_full_name: string | null
          student_id: string | null
          student_major: string | null
          student_type: string
          updated_at: string
          uploaded_file_url: string | null
          user_id: string
          verdict: string | null
        }
        Insert: {
          academic_year?: string | null
          admin_notes?: string | null
          ai_result: Json
          created_at?: string
          credits_cap?: number
          cumulative_gpa?: number | null
          diploma_gpa?: number | null
          id?: string
          input_mode?: string
          matched_aut_code?: string | null
          matched_aut_name?: string | null
          previous_diploma_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_name?: string | null
          saudi_course_description?: string | null
          saudi_course_name?: string | null
          semester?: string | null
          similarity?: number | null
          status?: string
          student_college?: string | null
          student_full_name?: string | null
          student_id?: string | null
          student_major?: string | null
          student_type?: string
          updated_at?: string
          uploaded_file_url?: string | null
          user_id: string
          verdict?: string | null
        }
        Update: {
          academic_year?: string | null
          admin_notes?: string | null
          ai_result?: Json
          created_at?: string
          credits_cap?: number
          cumulative_gpa?: number | null
          diploma_gpa?: number | null
          id?: string
          input_mode?: string
          matched_aut_code?: string | null
          matched_aut_name?: string | null
          previous_diploma_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_name?: string | null
          saudi_course_description?: string | null
          saudi_course_name?: string | null
          semester?: string | null
          similarity?: number | null
          status?: string
          student_college?: string | null
          student_full_name?: string | null
          student_id?: string | null
          student_major?: string | null
          student_type?: string
          updated_at?: string
          uploaded_file_url?: string | null
          user_id?: string
          verdict?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          saudi_university: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          saudi_university?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          saudi_university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
