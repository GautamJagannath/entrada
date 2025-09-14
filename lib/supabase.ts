import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Case {
  id: string
  created_at: string
  updated_at: string
  user_email: string
  status: 'draft' | 'ready' | 'generated'
  form_data: Record<string, any>
  last_section_completed: string | null
  completion_percentage: number
  generated_pdfs: Record<string, any> | null
  minor_name: string | null
  notes: string | null
  supporting_docs: Record<string, any>
  collaborators: string[]
}