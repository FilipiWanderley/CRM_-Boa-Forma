import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NpsStats {
  score: number;
  promoters: number;
  detractors: number;
  passives: number;
  total: number;
}

export function useNps() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Verificar se deve mostrar o NPS (última resposta > 90 dias)
  const { data: shouldShowNps, isLoading: checkLoading } = useQuery({
    queryKey: ['nps-eligibility', user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Buscar última pesquisa desse usuário
      const { data, error } = await supabase
        .from('nps_surveys')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        // Se a tabela não existir ainda, apenas ignora e retorna falso para não quebrar
        console.warn('Error checking NPS eligibility (table might not exist yet):', error);
        return false;
      }

      if (!data || data.length === 0) return true; // Nunca respondeu

      const lastResponseDate = new Date(data[0].created_at);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      return lastResponseDate < ninetyDaysAgo;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60 * 24, // Cache check por 24h para não ficar consultando toda hora
  });

  // Enviar pesquisa
  const submitSurvey = useMutation({
    mutationFn: async ({ score, comment }: { score: number; comment?: string }) => {
      if (!user || !profile?.unit_id) throw new Error('User not authenticated or no unit');

      const { error } = await supabase.from('nps_surveys').insert({
        unit_id: profile.unit_id,
        user_id: user.id,
        score,
        comment,
        source: 'app_aluno'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nps-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['nps-stats'] });
    },
  });

  // Buscar estatísticas (para o gestor)
  const { data: npsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['nps-stats', profile?.unit_id],
    queryFn: async () => {
      if (!profile?.unit_id) return null;

      const { data, error } = await supabase
        .from('nps_surveys')
        .select('score')
        .eq('unit_id', profile.unit_id);

      if (error) {
        console.warn('Error fetching NPS stats:', error);
        return null;
      }

      if (!data || data.length === 0) return { score: 0, promoters: 0, detractors: 0, passives: 0, total: 0 };

      const total = data.length;
      const promoters = data.filter(d => d.score >= 9).length;
      const detractors = data.filter(d => d.score <= 6).length;
      const passives = total - promoters - detractors;

      // NPS Score = % Promoters - % Detractors
      // (Promoters - Detractors) / Total * 100
      const npsScore = Math.round(((promoters - detractors) / total) * 100);

      return {
        score: npsScore,
        promoters,
        detractors,
        passives,
        total
      } as NpsStats;
    },
    enabled: !!profile?.unit_id,
  });

  return {
    shouldShowNps,
    checkLoading,
    submitSurvey,
    npsStats,
    statsLoading
  };
}
