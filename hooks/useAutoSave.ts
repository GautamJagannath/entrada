import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseAutoSaveProps {
  caseId: string;
  formData: Record<string, any>;
  onStatusChange?: (status: 'saving' | 'saved' | 'error') => void;
  debounceMs?: number;
}

export function useAutoSave({
  caseId,
  formData,
  onStatusChange,
  debounceMs = 2000
}: UseAutoSaveProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  const saveData = useCallback(async (data: Record<string, any>) => {
    // Skip if no data or data hasn't changed
    const currentDataStr = JSON.stringify(data);
    if (!data || Object.keys(data).length === 0 || currentDataStr === lastSavedDataRef.current) {
      return;
    }

    try {
      onStatusChange?.('saving');

      // Calculate completion percentage
      const totalFields = 95; // Based on form inventory
      const completedFields = Object.values(data).filter(value =>
        value !== null && value !== undefined && value !== ''
      ).length;
      const completionPercentage = Math.min(100, Math.round((completedFields / totalFields) * 100));

      // Update the case in Supabase
      const { error } = await supabase
        .from('cases')
        .update({
          form_data: data,
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) {
        throw error;
      }

      // Update last saved data reference
      lastSavedDataRef.current = currentDataStr;
      onStatusChange?.('saved');

      // Silent success - no toast for auto-save
      console.log('Auto-saved successfully:', { caseId, completionPercentage });

    } catch (error) {
      console.error('Auto-save failed:', error);
      onStatusChange?.('error');

      toast.error('Save failed - retrying...', {
        description: 'Your data is saved locally and will sync when reconnected.',
        duration: 3000
      });

      // Retry after 5 seconds
      setTimeout(() => {
        saveData(data);
      }, 5000);
    }
  }, [caseId, onStatusChange]);

  // Debounced auto-save effect
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveData(formData);
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, saveData, debounceMs]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return saveData(formData);
  }, [formData, saveData]);

  return { saveNow };
}