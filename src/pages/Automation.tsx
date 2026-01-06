import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Zap, History, Settings, AlertCircle, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { useAutomationRules, useAutomationLogs } from '@/hooks/useAutomation';
import { AutomationRuleCard } from '@/components/automation/AutomationRuleCard';
import { AutomationLogTable } from '@/components/automation/AutomationLogTable';
import { CreateRuleDialog } from '@/components/automation/CreateRuleDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function Automation() {
  const [activeTab, setActiveTab] = useState('rules');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; results?: Record<string, number> } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: rules, isLoading: rulesLoading } = useAutomationRules();
  const { data: logs, isLoading: logsLoading } = useAutomationLogs();

  const activeRulesCount = rules?.filter(r => r.is_active).length || 0;
  const sentCount = logs?.filter(l => l.status === 'sent').length || 0;

  const handleRunAutomations = async () => {
    setProcessing(true);
    setLastResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-automations', {
        body: {},
      });

      if (error) throw error;

      setLastResult(data);
      
      // Refresh logs
      queryClient.invalidateQueries({ queryKey: ['automation-logs'] });

      const totalProcessed = data.results 
        ? Object.values(data.results as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
        : 0;

      toast({
        title: 'Automações processadas!',
        description: `${totalProcessed} disparo(s) enfileirado(s) para envio.`,
      });
    } catch (error) {
      console.error('Error running automations:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível executar as automações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Automações
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure réguas de comunicação automáticas
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Automação
          </Button>
          <Button 
            onClick={handleRunAutomations} 
            variant="secondary" 
            className="gap-2"
            disabled={processing || activeRulesCount === 0}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Executar Agora
              </>
            )}
          </Button>
        </div>

        {/* Alert - Modo Simulação */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Modo Simulação</AlertTitle>
          <AlertDescription>
            Os disparos estão sendo simulados (sem envio real). Configure um provedor de email (Resend/SendGrid) para ativar o envio.
          </AlertDescription>
        </Alert>

        {/* Last Execution Result */}
        {lastResult && (
          <Alert className="border-success bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">Última Execução</AlertTitle>
            <AlertDescription>
              <div className="flex flex-wrap gap-3 mt-2">
                {lastResult.results && Object.entries(lastResult.results).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="gap-1">
                    {key}: {value as number}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Regras Ativas
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{activeRulesCount}</div>
              )}
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disparos Enviados
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <Zap className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{sentCount}</div>
              )}
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Regras
              </CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <History className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{rules?.length || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules" className="gap-2">
              <Settings className="h-4 w-4" />
              Regras
              {rules && rules.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {rules.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Regras */}
          <TabsContent value="rules" className="space-y-4">
            {rulesLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : rules && rules.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {rules.map((rule) => (
                  <AutomationRuleCard 
                    key={rule.id} 
                    rule={rule}
                    onEdit={() => {/* TODO: Implement edit */}}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">Nenhuma automação configurada</CardTitle>
                  <CardDescription className="mb-4">
                    Crie sua primeira régua de comunicação para automatizar o contato com seus alunos.
                  </CardDescription>
                  <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeira Automação
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Disparos</CardTitle>
                <CardDescription>
                  Últimos 50 disparos de automação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutomationLogTable 
                  logs={logs || []} 
                  loading={logsLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <CreateRuleDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </AppLayout>
  );
}
