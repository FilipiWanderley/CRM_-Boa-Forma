import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLead, getStatusLabel, type PipelineStatus } from '@/hooks/useLeads';
import { useAnamnesis } from '@/hooks/useAnamnesis';
import { useUnits } from '@/hooks/useUnits';
import { InteractionTimeline } from '@/components/interactions/InteractionTimeline';
import { AddInteractionDialog } from '@/components/interactions/AddInteractionDialog';
import { QuickContactActions } from '@/components/leads/QuickContactActions';
import { ContractGenerator } from '@/components/contracts/ContractGenerator';
import { EvolutionCharts } from '@/components/assessments/EvolutionCharts';
import { CreateAssessmentDialog } from '@/components/assessments/CreateAssessmentDialog';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  MessageCircle,
  ClipboardList,
  Edit,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusStyles: Record<PipelineStatus, string> = {
  lead: 'bg-info/10 text-info border-info/30',
  visita_agendada: 'bg-warning/10 text-warning border-warning/30',
  negociacao: 'bg-primary/10 text-primary border-primary/30',
  ativo: 'bg-success/10 text-success border-success/30',
  inativo: 'bg-muted text-muted-foreground border-muted',
  cancelado: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: lead, isLoading: leadLoading } = useLead(id || '');
  const { data: anamnesis } = useAnamnesis(id || '');
  const { data: units } = useUnits();
  
  const unit = units?.[0]; // Get first unit for contract

  if (!id) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Lead não encontrado</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            {leadLoading ? (
              <>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32 mt-1" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  {lead?.full_name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className={cn('border', statusStyles[lead?.status || 'lead'])}>
                    {getStatusLabel(lead?.status || 'lead')}
                  </Badge>
                  {lead?.source && (
                    <span className="text-sm text-muted-foreground">
                      Origem: {lead.source}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lead Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Lead
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/leads/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leadLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {lead?.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}
                
                {lead?.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">E-mail</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>
                )}

                {lead?.address && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="font-medium">{lead.address}</p>
                    </div>
                  </div>
                )}

                {lead?.created_at && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cadastrado em</p>
                      <p className="font-medium">
                        {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {lead?.notes && (
              <div className="mt-4 p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {!leadLoading && lead && (
            <>
              <QuickContactActions
                phone={lead.phone}
                email={lead.email}
                leadName={lead.full_name}
              />
              <div className="h-6 w-px bg-border hidden sm:block" />
              <ContractGenerator 
                lead={{
                  id: lead.id,
                  full_name: lead.full_name,
                  email: lead.email,
                  phone: lead.phone,
                  cpf: lead.cpf,
                  address: lead.address,
                  birth_date: lead.birth_date,
                }}
                unit={unit ? {
                  id: unit.id,
                  name: unit.name,
                  cnpj: unit.cnpj,
                  address: unit.address,
                  phone: unit.phone,
                  email: unit.email,
                } : null}
              />
            </>
          )}
          <div className="h-6 w-px bg-border hidden sm:block" />
          <Button onClick={() => navigate(`/anamnesis/${id}`)}>
            <ClipboardList className="h-4 w-4 mr-2" />
            {anamnesis ? 'Ver Anamnese' : 'Criar Anamnese'}
            {anamnesis?.signed_at && (
              <CheckCircle2 className="h-4 w-4 ml-2 text-success" />
            )}
          </Button>
          <AddInteractionDialog leadId={id} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="interactions" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="interactions" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Interações
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="anamnesis" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Anamnese
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactions" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Histórico de Interações</CardTitle>
                  <AddInteractionDialog leadId={id} />
                </div>
                <CardDescription>
                  Timeline de todas as interações com este lead
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InteractionTimeline leadId={id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Avaliações Físicas */}
          <TabsContent value="assessments" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Evolução Física</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe a evolução do aluno ao longo do tempo
                  </p>
                </div>
                {unit && (
                  <CreateAssessmentDialog leadId={id} unitId={unit.id} />
                )}
              </div>
              <EvolutionCharts leadId={id} />
            </div>
          </TabsContent>

          <TabsContent value="anamnesis" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ficha de Anamnese</CardTitle>
                  <Button variant="outline" onClick={() => navigate(`/anamnesis/${id}`)}>
                    {anamnesis ? 'Visualizar' : 'Criar Ficha'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {anamnesis ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {anamnesis.signed_at ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Assinada em {format(new Date(anamnesis.signed_at), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-warning/10 text-warning">
                          Pendente de assinatura
                        </Badge>
                      )}
                    </div>

                    {anamnesis.objectives && anamnesis.objectives.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Objetivos</p>
                        <div className="flex flex-wrap gap-2">
                          {anamnesis.objectives.map((obj, i) => (
                            <Badge key={i} variant="outline">{obj}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {anamnesis.medical_conditions && anamnesis.medical_conditions.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Condições Médicas</p>
                        <div className="flex flex-wrap gap-2">
                          {anamnesis.medical_conditions.map((cond, i) => (
                            <Badge key={i} variant="outline" className="border-destructive/30 text-destructive">
                              {cond}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma ficha de anamnese</p>
                    <p className="text-xs">Clique em "Criar Ficha" para começar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
