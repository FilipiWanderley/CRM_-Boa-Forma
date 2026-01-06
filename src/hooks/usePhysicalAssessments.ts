import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PhysicalAssessment {
  id: string;
  unit_id: string;
  lead_id: string;
  assessed_by: string | null;
  assessment_date: string;
  weight: number | null;
  height: number | null;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  lean_mass: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  right_arm: number | null;
  left_arm: number | null;
  right_thigh: number | null;
  left_thigh: number | null;
  right_calf: number | null;
  left_calf: number | null;
  neck: number | null;
  forearm_right: number | null;
  forearm_left: number | null;
  bmi: number | null;
  notes: string | null;
  photos_url: string[] | null;
  protocol: string | null;
  triceps_skinfold: number | null;
  chest_skinfold: number | null;
  abdominal_skinfold: number | null;
  suprailiac_skinfold: number | null;
  thigh_skinfold: number | null;
  subscapular_skinfold: number | null;
  axillary_skinfold: number | null;
  created_at: string;
  updated_at: string;
}

export function usePhysicalAssessments(leadId: string | undefined) {
  return useQuery({
    queryKey: ['physical-assessments', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('physical_assessments')
        .select('*')
        .eq('lead_id', leadId)
        .order('assessment_date', { ascending: true });

      if (error) throw error;
      return data as PhysicalAssessment[];
    },
    enabled: !!leadId,
  });
}

export function useLatestAssessment(leadId: string | undefined) {
  return useQuery({
    queryKey: ['physical-assessment-latest', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      const { data, error } = await supabase
        .from('physical_assessments')
        .select('*')
        .eq('lead_id', leadId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PhysicalAssessment | null;
    },
    enabled: !!leadId,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assessment: Omit<PhysicalAssessment, 'id' | 'created_at' | 'updated_at'>) => {
      // Calculate BMI if weight and height provided
      let bmi = assessment.bmi;
      if (assessment.weight && assessment.height) {
        const heightInMeters = assessment.height / 100;
        bmi = Number((assessment.weight / (heightInMeters * heightInMeters)).toFixed(1));
      }

      const { data, error } = await supabase
        .from('physical_assessments')
        .insert({ ...assessment, bmi })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['physical-assessments', variables.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['physical-assessment-latest', variables.lead_id] });
      toast({
        title: 'Avaliação registrada!',
        description: 'A avaliação física foi salva com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error creating assessment:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível registrar a avaliação.',
        variant: 'destructive',
      });
    },
  });
}
