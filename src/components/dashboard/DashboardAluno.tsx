import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Dumbbell, Calendar, Activity, User, Target, QrCode, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatCard } from './shared/StatCard';
import { QuickStatCard } from './shared/QuickStatCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardAluno() {
  const { profile } = useAuth();

  // Fetch lead data for the student
  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['student-lead', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name, status')
        .eq('profile_id', profile?.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch workouts for the student
  const { data: workouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ['student-workouts', leadData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, is_active')
        .eq('lead_id', leadData?.id)
        .eq('is_active', true);
      
      if (error) return [];
      return data || [];
    },
    enabled: !!leadData?.id,
  });

  // Fetch check-ins for this month
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['student-checkins', leadData?.id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('check_ins')
        .select('id')
        .eq('lead_id', leadData?.id)
        .gte('checked_in_at', startOfMonth.toISOString());
      
      if (error) return [];
      return data || [];
    },
    enabled: !!leadData?.id,
  });

  const isLoading = leadLoading || workoutsLoading || checkInsLoading;
  const activeWorkoutsCount = workouts?.length || 0;
  const checkInsCount = checkIns?.length || 0;

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Olá, {profile?.full_name?.split(' ')[0] || 'Aluno'}!
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus treinos e evolução</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Treinos Ativos"
          value={activeWorkoutsCount.toString()}
          subtitle={activeWorkoutsCount > 0 ? 'disponíveis para você' : 'aguardando seu professor'}
          icon={<Dumbbell className="h-5 w-5" />}
          loading={isLoading}
          href="/meu-app"
          variant="default"
        />
        <StatCard
          title="Check-ins no Mês"
          value={checkInsCount.toString()}
          subtitle="visitas à academia"
          icon={<Activity className="h-5 w-5" />}
          loading={isLoading}
          href="/meu-app"
          variant="success"
        />
        <StatCard
          title="Próxima Avaliação"
          value="--"
          subtitle="nenhuma agendada"
          icon={<Calendar className="h-5 w-5" />}
          loading={isLoading}
          variant="warning"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg">{profile?.full_name || 'Aluno'}</p>
                <p className="text-sm text-muted-foreground">{profile?.phone || 'Sem telefone'}</p>
                {leadData?.status && (
                  <div className={`inline-flex items-center mt-2 px-2 py-1 rounded text-xs font-medium ${
                    leadData.status === 'ativo' 
                      ? 'bg-emerald-500/20 text-emerald-500' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {leadData.status === 'ativo' ? 'Matrícula Ativa' : leadData.status}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Link to="/profile">
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Acesso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/meu-app" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="p-3 rounded-lg bg-primary">
                  <QrCode className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Meu QR Code de Acesso</p>
                  <p className="text-sm text-muted-foreground">Use para entrar na academia</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/meu-app" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <Dumbbell className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Meus Treinos</p>
                  <p className="text-sm text-muted-foreground">{activeWorkoutsCount} treino{activeWorkoutsCount !== 1 ? 's' : ''} disponíve{activeWorkoutsCount !== 1 ? 'is' : 'l'}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/chat" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Falar com Professor</p>
                  <p className="text-sm text-muted-foreground">Tire suas dúvidas</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Goals Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Meus Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              Seus objetivos serão definidos na sua anamnese
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Fale com seu professor para agendar uma avaliação
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Footer */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickStatCard
          title="Treinos Ativos"
          value={activeWorkoutsCount}
          icon={<Dumbbell className="h-5 w-5" />}
          variant="primary"
          loading={isLoading}
        />
        <QuickStatCard
          title="Check-ins Mês"
          value={checkInsCount}
          icon={<Activity className="h-5 w-5" />}
          variant="success"
          loading={isLoading}
        />
        <QuickStatCard
          title="Status"
          value={leadData?.status === 'ativo' ? 'Ativo' : 'Pendente'}
          icon={<Target className="h-5 w-5" />}
          variant={leadData?.status === 'ativo' ? 'success' : 'warning'}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
