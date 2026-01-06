import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useLeads } from '@/hooks/useLeads';
import { useWorkouts, type Workout } from '@/hooks/useWorkouts';
import { useCheckIns, useCheckInStats } from '@/hooks/useCheckIns';
import { useWorkoutStats } from '@/hooks/useWorkoutLogs';
import { usePhysicalAssessments, useLatestAssessment } from '@/hooks/usePhysicalAssessments';
import { QRCodeAccess } from '@/components/aluno/QRCodeAccess';
import { WorkoutCard } from '@/components/aluno/WorkoutCard';
import { WorkoutSession } from '@/components/aluno/WorkoutSession';
import { CheckInHistory } from '@/components/aluno/CheckInHistory';
import { EvolutionCharts } from '@/components/assessments/EvolutionCharts';
import { WorkoutHistory } from '@/components/aluno/WorkoutHistory';
import { SplashScreen } from '@/components/aluno/SplashScreen';
import { FinanceiroSection } from '@/components/aluno/FinanceiroSection';
import { AulasColetivas } from '@/components/aluno/AulasColetivas';
import { ConfiguracoesSection } from '@/components/aluno/ConfiguracoesSection';
import { useUnits } from '@/hooks/useUnits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Dumbbell, 
  Wallet,
  Calendar,
  TrendingUp,
  User,
  LineChart,
  History,
  Flame,
  Target,
  ChevronRight,
  Zap,
  Bell,
  Camera,
  Loader2,
  X,
  ArrowLeft,
  Home,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
  CalendarDays
} from 'lucide-react';

import { NpsSurveyDialog } from '@/components/nps/NpsSurveyDialog';

export default function AlunoApp() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'treinos' | 'aulas' | 'historico' | 'evolucao' | 'qrcode' | 'financeiro' | 'configuracoes'>('home');
  const [previousTab, setPreviousTab] = useState<string>('home');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync avatar URL from profile
  useEffect(() => {
    if (profile?.avatar_url) {
      setCurrentAvatarUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  // Handle tab change with animation
  const handleTabChange = (newTab: 'home' | 'treinos' | 'aulas' | 'historico' | 'evolucao' | 'qrcode' | 'financeiro' | 'configuracoes') => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setPreviousTab(activeTab);
    setTimeout(() => {
      setActiveTab(newTab);
      setActiveWorkout(null);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };
  
  // Buscar o lead associado ao aluno
  const { data: leads, isLoading: leadsLoading } = useLeads();
  
  // Encontrar o lead do aluno logado
  const myLead = leads?.find(l => 
    l.profile_id === profile?.id || 
    l.email?.toLowerCase() === user?.email?.toLowerCase()
  );
  
  const { data: workouts, isLoading: workoutsLoading } = useWorkouts(myLead?.id);
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns(myLead?.id);
  const { data: checkInStats } = useCheckInStats(myLead?.id || '');
  const { data: workoutStats } = useWorkoutStats(myLead?.id);
  const { data: assessments } = usePhysicalAssessments(myLead?.id);
  const { data: latestAssessment } = useLatestAssessment(myLead?.id);
  const { data: units } = useUnits();
  
  const currentUnit = units?.find(u => u.id === myLead?.unit_id);

  const isLoading = leadsLoading;

  // Calculate evolution stats
  const getEvolutionSummary = () => {
    if (!assessments || assessments.length < 2) return null;
    const first = assessments[0];
    const last = assessments[assessments.length - 1];
    
    const weightChange = first.weight && last.weight 
      ? Number((last.weight - first.weight).toFixed(1)) 
      : null;
    const fatChange = first.body_fat_percentage && last.body_fat_percentage 
      ? Number((last.body_fat_percentage - first.body_fat_percentage).toFixed(1)) 
      : null;
      
    return { weightChange, fatChange };
  };
  
  const evolutionSummary = getEvolutionSummary();
  const firstName = profile?.full_name?.split(' ')[0] || 'Aluno';

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    setActiveTab('treinos');
  };

  const handleBackFromWorkout = () => {
    setActiveWorkout(null);
  };

  // Handle avatar file selection
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatars
      await supabase.storage.from('avatars').remove([
        `${user.id}/avatar.jpg`, 
        `${user.id}/avatar.png`, 
        `${user.id}/avatar.webp`
      ]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setCurrentAvatarUrl(urlWithCacheBuster);
      setShowAvatarDialog(false);
      setAvatarPreview(null);
      
      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setAvatarPreview(null);
      toast({
        title: 'Erro ao enviar foto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Render the home screen
  const renderHome = () => (
    <div className="space-y-6 pb-24">
      {/* Header with Avatar and Notification */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          {/* Clickable Avatar for Upload */}
          <button 
            onClick={() => setShowAvatarDialog(true)}
            className="relative group"
          >
            <Avatar className="h-12 w-12 border-2 border-primary/30 transition-all group-hover:border-primary">
              <AvatarImage src={currentAvatarUrl || profile?.avatar_url || undefined} alt={profile?.full_name} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {firstName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </button>
          <div>
            <p className="text-primary text-sm font-medium">Olá,</p>
            <h1 className="text-xl font-display font-bold text-foreground">
              {firstName}!
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-11 w-11 rounded-full bg-secondary hover:bg-secondary/80"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          </Button>

          {/* Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-11 w-11 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border">
              <DropdownMenuItem 
                onClick={() => navigate('/dashboard')}
                className="cursor-pointer gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="cursor-pointer gap-2"
              >
                <User className="h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleTabChange('configuracoes')}
                className="cursor-pointer gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  await signOut();
                  navigate('/auth');
                }}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Badge */}
      {myLead && (
        <div className="flex items-center gap-3">
          <Badge 
            className={`rounded-full px-4 py-1.5 border-0 ${
              myLead.status === 'ativo' 
                ? 'bg-primary text-white shadow-neon' 
                : 'bg-destructive/20 text-destructive'
            }`}
          >
            {myLead.status === 'ativo' ? '✓ Matrícula Ativa' : '✗ Matrícula Inativa'}
          </Badge>
        </div>
      )}

      {/* Quick Stats Grid - Neon Style */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="card-neon border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-primary/80 text-xs font-medium">Este Mês</p>
                <p className="text-2xl font-bold text-foreground">
                  {workoutStats?.workoutsThisMonth || checkInStats?.thisMonth || 0}
                </p>
                <p className="text-muted-foreground text-xs">treinos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-fitness bg-gradient-to-br from-amber/20 to-amber/5 border-amber/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber/20">
                <Zap className="h-5 w-5 text-amber" />
              </div>
              <div>
                <p className="text-amber/80 text-xs font-medium">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {checkInStats?.thisMonth || 0}
                </p>
                <p className="text-muted-foreground text-xs">acessos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-fitness bg-gradient-to-br from-violet/20 to-violet/5 border-violet/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet/20">
                <Dumbbell className="h-5 w-5 text-violet" />
              </div>
              <div>
                <p className="text-violet/80 text-xs font-medium">Fichas</p>
                <p className="text-2xl font-bold text-foreground">
                  {workouts?.length || 0}
                </p>
                <p className="text-muted-foreground text-xs">ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="card-fitness bg-gradient-to-br from-success/20 to-success/5 border-success/30 cursor-pointer"
          onClick={() => setActiveTab('evolucao')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/20">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-success/80 text-xs font-medium">Peso</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestAssessment?.weight ? `${latestAssessment.weight}` : '--'}
                </p>
                <p className="text-muted-foreground text-xs">kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Workout - Featured */}
      {workouts && workouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Seus Treinos</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => setActiveTab('treinos')}
            >
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {/* Featured Workout Card */}
          <Card 
            className="card-fitness overflow-hidden cursor-pointer group"
            onClick={() => handleStartWorkout(workouts[0])}
          >
            <div className="relative h-40">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60')`,
                }}
              />
              <div className="workout-card-overlay" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <Badge className="self-start mb-2 bg-primary/90">
                  <Target className="h-3 w-3 mr-1" />
                  {workouts[0].workout_exercises?.length || 0} exercícios
                </Badge>
                <h3 className="text-white font-display text-xl font-bold">
                  {workouts[0].name}
                </h3>
                {workouts[0].description && (
                  <p className="text-white/70 text-sm mt-1 line-clamp-1">
                    {workouts[0].description}
                  </p>
                )}
              </div>
              <div className="absolute top-4 right-4">
                <Button 
                  size="icon" 
                  className="rounded-full bg-primary hover:bg-primary/90 shadow-lg group-hover:scale-110 transition-transform"
                >
                  <Dumbbell className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="card-fitness cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setActiveTab('qrcode')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">QR Code</p>
                <p className="text-xs text-muted-foreground">Acessar academia</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-fitness cursor-pointer hover:border-cyan-500/30 transition-colors"
            onClick={() => handleTabChange('aulas')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10">
                <CalendarDays className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Aulas</p>
                <p className="text-xs text-muted-foreground">Yoga, Natação...</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-fitness cursor-pointer hover:border-amber/30 transition-colors"
            onClick={() => setActiveTab('historico')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber/10">
                <History className="h-6 w-6 text-amber" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Histórico</p>
                <p className="text-xs text-muted-foreground">Ver progresso</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-fitness cursor-pointer hover:border-violet/30 transition-colors"
            onClick={() => setActiveTab('evolucao')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet/10">
                <LineChart className="h-6 w-6 text-violet" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Evolução</p>
                <p className="text-xs text-muted-foreground">Medidas e peso</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="card-fitness cursor-pointer hover:border-success/30 transition-colors"
            onClick={() => handleTabChange('financeiro')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-success/10">
                <Wallet className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Financeiro</p>
                <p className="text-xs text-muted-foreground">Plano e faturas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Last Check-in */}
      {checkIns && checkIns.length > 0 && (
        <Card className="card-neon">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Último acesso</p>
                <p className="font-semibold text-foreground">
                  {new Date(checkIns[0].checked_in_at).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
                <p className="text-sm text-primary">
                  às {new Date(checkIns[0].checked_in_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render treinos tab
  const renderTreinos = () => (
    <div className="space-y-4 pb-24">
      {/* Back Button Header */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleTabChange('home')}
          className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-display font-bold text-foreground">Treinos</h1>
      </div>

      {activeWorkout && myLead ? (
        <WorkoutSession
          workout={activeWorkout}
          leadId={myLead.id}
          unitId={myLead.unit_id}
          onBack={handleBackFromWorkout}
        />
      ) : workoutsLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))}
        </div>
      ) : workouts && workouts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-muted-foreground">Suas Fichas de Treino</h2>
          {workouts.map((workout) => (
            <WorkoutCard 
              key={workout.id} 
              workout={workout}
              leadId={myLead?.id}
              unitId={myLead?.unit_id}
              onStartSession={handleStartWorkout}
            />
          ))}
        </div>
      ) : (
        <Card className="card-fitness">
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Sem treinos</h3>
            <p className="text-muted-foreground text-sm">
              Seu professor ainda não criou fichas de treino para você.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'treinos':
        return renderTreinos();
      case 'aulas':
        return (
          <div className="space-y-4 pb-24">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTabChange('home')}
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-display font-bold text-foreground">Aulas Coletivas</h1>
            </div>
            <AulasColetivas leadId={myLead?.id} unitId={myLead?.unit_id} />
          </div>
        );
      case 'historico':
        return (
          <div className="space-y-4 pb-24">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTabChange('home')}
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-display font-bold text-foreground">Histórico</h1>
            </div>
            <WorkoutHistory leadId={myLead?.id} unitId={myLead?.unit_id} />
          </div>
        );
      case 'evolucao':
        return (
          <div className="space-y-4 pb-24">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTabChange('home')}
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-display font-bold text-foreground">Evolução</h1>
            </div>
            {myLead ? (
              <EvolutionCharts leadId={myLead.id} />
            ) : (
              <Card className="card-fitness">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Cadastro não encontrado para exibir evolução.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 'qrcode':
        return (
          <div className="space-y-4 pb-24">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTabChange('home')}
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-display font-bold text-foreground">Acesso à Academia</h1>
            </div>
            {myLead ? (
              <QRCodeAccess 
                leadId={myLead.id} 
                leadName={myLead.full_name}
                status={myLead.status}
                unitId={myLead.unit_id}
              />
            ) : (
              <Card className="card-fitness">
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Cadastro não encontrado. Entre em contato com a recepção.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 'financeiro':
        return (
          <div className="space-y-4 pb-24">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTabChange('home')}
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-display font-bold text-foreground">Financeiro</h1>
            </div>
            <FinanceiroSection leadId={myLead?.id} />
          </div>
        );
      case 'configuracoes':
        return (
          <div className="space-y-4 pb-24">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTabChange('home')}
                className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-display font-bold text-foreground">Configurações</h1>
            </div>
            <ConfiguracoesSection />
          </div>
        );
      default:
        return renderHome();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {showSplash && (
        <SplashScreen 
          onComplete={() => setShowSplash(false)}
          unitName={currentUnit?.name}
          logoUrl={currentUnit?.logo_url || undefined}
        />
      )}
      <div className={`min-h-screen bg-background transition-opacity duration-300 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
      {/* Main Content */}
      <main className="p-4 max-w-lg mx-auto">
        <div 
          className={`transition-all duration-300 ease-out ${
            isTransitioning 
              ? 'opacity-0 translate-y-4' 
              : 'opacity-100 translate-y-0'
          }`}
        >
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-nav">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'home' 
                ? 'text-primary scale-105' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className={`h-6 w-6 transition-transform duration-200 ${activeTab === 'home' ? 'scale-110' : ''}`} strokeWidth={1.75} />
            <span className="text-xs font-medium">Início</span>
          </button>
          
          <button
            onClick={() => handleTabChange('treinos')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'treinos' 
                ? 'text-primary scale-105' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dumbbell className={`h-6 w-6 transition-transform duration-200 ${activeTab === 'treinos' ? 'scale-110' : ''}`} />
            <span className="text-xs font-medium">Treinos</span>
          </button>

          {/* QR Code Button - Center - Neon Glow */}
          <button
            onClick={() => handleTabChange('qrcode')}
            className={`relative -top-4 flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-neon-lg transition-all duration-200 ${
              activeTab === 'qrcode' ? 'scale-110 animate-neon-pulse' : 'hover:scale-105'
            }`}
          >
            <QrCode className="h-7 w-7" />
          </button>
          
          <button
            onClick={() => handleTabChange('aulas')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'aulas' 
                ? 'text-primary scale-105' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className={`h-6 w-6 transition-transform duration-200 ${activeTab === 'aulas' ? 'scale-110' : ''}`} />
            <span className="text-xs font-medium">Aulas</span>
          </button>
          
          <button
            onClick={() => handleTabChange('evolucao')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
              activeTab === 'evolucao' 
                ? 'text-primary scale-105' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LineChart className={`h-6 w-6 transition-transform duration-200 ${activeTab === 'evolucao' ? 'scale-110' : ''}`} />
            <span className="text-xs font-medium">Evolução</span>
          </button>
        </div>
      </nav>
      </div>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Foto de Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Current/Preview Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary/30">
                <AvatarImage 
                  src={avatarPreview || currentAvatarUrl || profile?.avatar_url || undefined} 
                  alt={profile?.full_name} 
                />
                <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                  {firstName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex flex-col gap-3 w-full">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full gap-2"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Escolher Foto
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <NpsSurveyDialog />
    </>
  );
}