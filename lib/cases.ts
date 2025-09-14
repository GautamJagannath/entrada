import { supabase } from './supabase';
import type { Case } from './supabase';

export interface CreateCaseData {
  user_email: string;
  minor_name?: string;
  initial_data?: Record<string, any>;
}

// Create a new case
export async function createCase(data: CreateCaseData) {
  const { data: newCase, error } = await supabase
    .from('cases')
    .insert({
      user_email: data.user_email,
      form_data: data.initial_data || {},
      status: 'draft',
      completion_percentage: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating case:', error);
    throw new Error('Failed to create case');
  }

  return newCase as Case;
}

// Get all cases for a user
export async function getUserCases(userEmail: string): Promise<Case[]> {
  const { data: cases, error } = await supabase
    .from('cases')
    .select('*')
    .eq('user_email', userEmail)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    throw new Error('Failed to fetch cases');
  }

  return cases as Case[];
}

// Get a specific case
export async function getCase(caseId: string): Promise<Case | null> {
  const { data: case_, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Case not found
      return null;
    }
    console.error('Error fetching case:', error);
    throw new Error('Failed to fetch case');
  }

  return case_ as Case;
}

// Update case data
export async function updateCase(caseId: string, updates: Partial<Case>) {
  const { data: updatedCase, error } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', caseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating case:', error);
    throw new Error('Failed to update case');
  }

  return updatedCase as Case;
}

// Delete a case
export async function deleteCase(caseId: string) {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId);

  if (error) {
    console.error('Error deleting case:', error);
    throw new Error('Failed to delete case');
  }
}

// Calculate completion percentage based on form data
export function calculateCompletionPercentage(formData: Record<string, any>): number {
  if (!formData || Object.keys(formData).length === 0) {
    return 0;
  }

  // Define required fields for completion calculation
  const requiredFields = [
    'minor_name', 'minor_dob', 'minor_gender',
    'guardian_name', 'guardian_relationship', 'guardian_address',
    'is_citizen', 'has_siblings'
  ];

  const totalFields = 95; // Based on complete form inventory
  const completedFields = Object.entries(formData).filter(([key, value]) => {
    return value !== null && value !== undefined && value !== '' && value !== 'null';
  }).length;

  const percentage = Math.min(100, Math.round((completedFields / totalFields) * 100));
  return percentage;
}

// Format relative time for UI display
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

// Get status badge configuration
export function getStatusConfig(percentage: number, status: string) {
  if (status === 'generated') {
    return { color: 'bg-purple-500', text: 'Generated', variant: 'default' as const };
  }
  if (status === 'ready' || percentage === 100) {
    return { color: 'bg-green-500', text: 'Ready', variant: 'default' as const };
  }
  if (percentage > 70) {
    return { color: 'bg-blue-500', text: 'In Progress', variant: 'secondary' as const };
  }
  if (percentage > 30) {
    return { color: 'bg-yellow-500', text: 'Partial', variant: 'secondary' as const };
  }
  return { color: 'bg-red-500', text: 'Started', variant: 'secondary' as const };
}

// Search cases by minor name
export function searchCases(cases: Case[], searchTerm: string): Case[] {
  if (!searchTerm.trim()) {
    return cases;
  }

  const term = searchTerm.toLowerCase();
  return cases.filter(case_ => {
    const minorName = case_.minor_name?.toLowerCase() || '';
    const caseData = JSON.stringify(case_.form_data).toLowerCase();
    return minorName.includes(term) || caseData.includes(term);
  });
}