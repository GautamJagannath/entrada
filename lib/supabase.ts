import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug logging with partial key for security
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Missing');
console.log('Supabase URL value:', supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create client with enhanced options for production
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    debug: true
  },
  global: {
    headers: {
      'X-Client-Info': 'entrada-guardianship-forms'
    }
  }
})

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