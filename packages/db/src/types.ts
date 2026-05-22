/**
 * Canonical database types for the NEV workspace Supabase project.
 * Regenerate after migrations: pnpm supabase gen types typescript > packages/db/src/types.ts
 * (run from packages/db where the Supabase CLI is linked)
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: 'admin' | 'member' | 'lp' | 'intern'
          // Identity layer columns
          app_access: string[]
          status: 'active' | 'invited' | 'deactivated'
          invited_by: string | null
          invited_at: string | null
          last_seen_at: string | null
          // LP portal columns
          entity_id: string | null
          entity_role: 'member' | 'admin' | null
          commitment_amount: number | null
          committed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: 'admin' | 'member' | 'lp' | 'intern'
          app_access?: string[]
          status?: 'active' | 'invited' | 'deactivated'
          invited_by?: string | null
          invited_at?: string | null
          last_seen_at?: string | null
          entity_id?: string | null
          entity_role?: 'member' | 'admin' | null
          commitment_amount?: number | null
          committed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          role?: 'admin' | 'member' | 'lp' | 'intern'
          app_access?: string[]
          status?: 'active' | 'invited' | 'deactivated'
          invited_by?: string | null
          invited_at?: string | null
          last_seen_at?: string | null
          entity_id?: string | null
          entity_role?: 'member' | 'admin' | null
          commitment_amount?: number | null
          committed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'profiles_invited_by_fkey'; columns: ['invited_by']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      invitations: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'member' | 'lp' | 'intern'
          app_access: string[]
          invited_by: string
          invited_at: string
          accepted_at: string | null
          token: string
          expires_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'member' | 'lp' | 'intern'
          app_access?: string[]
          invited_by: string
          invited_at?: string
          accepted_at?: string | null
          token: string
          expires_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'member' | 'lp' | 'intern'
          app_access?: string[]
          invited_by?: string
          invited_at?: string
          accepted_at?: string | null
          token?: string
          expires_at?: string
        }
        Relationships: [
          { foreignKeyName: 'invitations_invited_by_fkey'; columns: ['invited_by']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      tools: {
        Row: {
          id: string
          name: string
          description: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      lp_entities: {
        Row: {
          id: string
          name: string
          commitment_amount: number | null
          committed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          commitment_amount?: number | null
          committed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          commitment_amount?: number | null
          committed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fund: {
        Row: {
          id: string
          name: string
          vintage: number | null
          fund_size: number | null
          total_committed: number | null
          total_called: number | null
          total_deployed: number | null
          total_current_value: number | null
          as_of_date: string | null
          last_updated: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          vintage?: number | null
          fund_size?: number | null
          total_committed?: number | null
          total_called?: number | null
          total_deployed?: number | null
          total_current_value?: number | null
          as_of_date?: string | null
          last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          vintage?: number | null
          fund_size?: number | null
          total_committed?: number | null
          total_called?: number | null
          total_deployed?: number | null
          total_current_value?: number | null
          as_of_date?: string | null
          last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_companies: {
        Row: {
          id: string
          slug: string
          name: string
          logo_url: string | null
          one_liner: string | null
          sector: string | null
          website: string | null
          stage: 'Pre-Seed' | 'First Check' | 'Seed' | 'Series A' | null
          status: 'active' | 'exited' | 'written_off'
          thesis: string | null
          memo_pdf_url: string | null
          invested_date: string | null
          check_size: number | null
          entry_valuation: number | null
          ownership_pct: number | null
          pro_rata_rights: boolean
          current_valuation: number | null
          current_multiple: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          logo_url?: string | null
          one_liner?: string | null
          sector?: string | null
          website?: string | null
          stage?: 'Pre-Seed' | 'First Check' | 'Seed' | 'Series A' | null
          status?: 'active' | 'exited' | 'written_off'
          thesis?: string | null
          memo_pdf_url?: string | null
          invested_date?: string | null
          check_size?: number | null
          entry_valuation?: number | null
          ownership_pct?: number | null
          pro_rata_rights?: boolean
          current_valuation?: number | null
          current_multiple?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          logo_url?: string | null
          one_liner?: string | null
          sector?: string | null
          website?: string | null
          stage?: 'Pre-Seed' | 'First Check' | 'Seed' | 'Series A' | null
          status?: 'active' | 'exited' | 'written_off'
          thesis?: string | null
          memo_pdf_url?: string | null
          invested_date?: string | null
          check_size?: number | null
          entry_valuation?: number | null
          ownership_pct?: number | null
          pro_rata_rights?: boolean
          current_valuation?: number | null
          current_multiple?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      valuation_events: {
        Row: {
          id: string
          company_id: string
          event_date: string
          event_type: 'markup' | 'markdown' | 'exit' | 'writedown' | 'initial' | null
          new_company_valuation: number | null
          new_position_value: number | null
          multiple: number | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          event_date: string
          event_type?: 'markup' | 'markdown' | 'exit' | 'writedown' | 'initial' | null
          new_company_valuation?: number | null
          new_position_value?: number | null
          multiple?: number | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          event_date?: string
          event_type?: 'markup' | 'markdown' | 'exit' | 'writedown' | 'initial' | null
          new_company_valuation?: number | null
          new_position_value?: number | null
          multiple?: number | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      co_investors: {
        Row: {
          id: string
          company_id: string
          name: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      updates: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          body_md: string | null
          excerpt: string | null
          author_id: string | null
          related_company_id: string | null
          pdf_url: string | null
          status: 'draft' | 'published'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle?: string | null
          body_md?: string | null
          excerpt?: string | null
          author_id?: string | null
          related_company_id?: string | null
          pdf_url?: string | null
          status?: 'draft' | 'published'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          subtitle?: string | null
          body_md?: string | null
          excerpt?: string | null
          author_id?: string | null
          related_company_id?: string | null
          pdf_url?: string | null
          status?: 'draft' | 'published'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
