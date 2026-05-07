export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      brands: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          is_active: boolean
          logo_url: string | null
          font_url: string | null
          primary_color: string | null
          voice: string | null
          tone: string | null
          target_audience: string | null
          value_proposition: string | null
          content_pillars: string[] | null
          restrictions: string[] | null
          monthly_pieces_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          is_active?: boolean
          logo_url?: string | null
          font_url?: string | null
          primary_color?: string | null
          voice?: string | null
          tone?: string | null
          target_audience?: string | null
          value_proposition?: string | null
          content_pillars?: string[] | null
          restrictions?: string[] | null
          monthly_pieces_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          is_active?: boolean
          logo_url?: string | null
          font_url?: string | null
          primary_color?: string | null
          voice?: string | null
          tone?: string | null
          target_audience?: string | null
          value_proposition?: string | null
          content_pillars?: string[] | null
          restrictions?: string[] | null
          monthly_pieces_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'brands_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      content_plans: {
        Row: {
          id: string
          brand_id: string
          month: number
          year: number
          status: string
          products: Json
          context: string | null
          strategic_brief: string | null
          channel_mix: string[]
          funnel_focus: string
          pieces_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          month: number
          year: number
          status?: string
          products?: Json
          context?: string | null
          strategic_brief?: string | null
          channel_mix?: string[]
          funnel_focus?: string
          pieces_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          month?: number
          year?: number
          status?: string
          products?: Json
          context?: string | null
          strategic_brief?: string | null
          channel_mix?: string[]
          funnel_focus?: string
          pieces_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_plans_brand_id_fkey'
            columns: ['brand_id']
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
        ]
      }
      content_items: {
        Row: {
          id: string
          brand_id: string
          plan_id: string | null
          created_by: string
          type: string
          platform: string
          status: string
          body: string
          notes: string | null
          image_url: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          plan_id?: string | null
          created_by: string
          type: string
          platform: string
          status?: string
          body: string
          notes?: string | null
          image_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          plan_id?: string | null
          created_by?: string
          type?: string
          platform?: string
          status?: string
          body?: string
          notes?: string | null
          image_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_items_brand_id_fkey'
            columns: ['brand_id']
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
        ]
      }
      content_plan_items: {
        Row: {
          id: string
          plan_id: string
          temporality: string | null
          scheduled_date: string | null
          funnel_stage: string
          objective: string | null
          idea: string | null
          format: string | null
          channel: string | null
          kpi: string | null
          benchmark_reference: string | null
          main_message: string | null
          cta: string | null
          observations: string | null
          status: string
          content_item_id: string | null
          sort_order: number
          raw_ideas: unknown | null
          selected_idea_type: string | null
          generated_assets: unknown
          production_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          temporality?: string | null
          scheduled_date?: string | null
          funnel_stage?: string
          objective?: string | null
          idea?: string | null
          format?: string | null
          channel?: string | null
          kpi?: string | null
          benchmark_reference?: string | null
          main_message?: string | null
          cta?: string | null
          observations?: string | null
          status?: string
          content_item_id?: string | null
          sort_order?: number
          raw_ideas?: unknown | null
          selected_idea_type?: string | null
          generated_assets?: unknown
          production_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          temporality?: string | null
          scheduled_date?: string | null
          funnel_stage?: string
          objective?: string | null
          idea?: string | null
          format?: string | null
          channel?: string | null
          kpi?: string | null
          benchmark_reference?: string | null
          main_message?: string | null
          cta?: string | null
          observations?: string | null
          status?: string
          content_item_id?: string | null
          sort_order?: number
          raw_ideas?: unknown | null
          selected_idea_type?: string | null
          generated_assets?: unknown
          production_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_plan_items_plan_id_fkey'
            columns: ['plan_id']
            referencedRelation: 'content_plans'
            referencedColumns: ['id']
          },
        ]
      }
      brand_rules: {
        Row: {
          id: string
          brand_id: string
          category: string
          description: string
          instruction: string
          source: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          category: string
          description: string
          instruction: string
          source?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          category?: string
          description?: string
          instruction?: string
          source?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'brand_rules_brand_id_fkey'
            columns: ['brand_id']
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
        ]
      }
      approvals: {
        Row: {
          id: string
          content_id: string
          status: string
          comment: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          status?: string
          comment?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          status?: string
          comment?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'approvals_content_id_fkey'
            columns: ['content_id']
            referencedRelation: 'content_items'
            referencedColumns: ['id']
          },
        ]
      }
      feedback: {
        Row: {
          id: string
          content_id: string
          brand_id: string
          comment: string
          type: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          brand_id: string
          comment: string
          type: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          brand_id?: string
          comment?: string
          type?: string
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_content_id_fkey'
            columns: ['content_id']
            referencedRelation: 'content_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_brand_id_fkey'
            columns: ['brand_id']
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
        ]
      }
      brand_members: {
        Row: {
          id: string
          brand_id: string
          user_id: string
          email: string
          role: string
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          user_id: string
          email: string
          role: string
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          user_id?: string
          email?: string
          role?: string
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'brand_members_brand_id_fkey'
            columns: ['brand_id']
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
        ]
      }
      content_expansion_requests: {
        Row: {
          id: string
          plan_id: string
          brand_id: string
          included_pieces: number
          required_pieces: number
          additional_pieces: number
          reason: string
          status: string
          requested_at: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          brand_id: string
          included_pieces: number
          required_pieces: number
          additional_pieces: number
          reason: string
          status?: string
          requested_at?: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          brand_id?: string
          included_pieces?: number
          required_pieces?: number
          additional_pieces?: number
          reason?: string
          status?: string
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_expansion_requests_plan_id_fkey'
            columns: ['plan_id']
            referencedRelation: 'content_plans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'content_expansion_requests_brand_id_fkey'
            columns: ['brand_id']
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
