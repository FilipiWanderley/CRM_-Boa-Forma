import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads } from '@/hooks/useLeads';
import { useCreateCheckIn, useTodayCheckIns } from '@/hooks/useCheckIns';
import { useSubscriptions } from '@/hooks/useFinancial';
import { 
  Search, 
  QrCode, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Users,
  ScanLine,
  Keyboard
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

const DEFAULT_UNIT_ID = 'a0000000-0000-0000-0000-000000000001';

interface LeadWithStatus {
  id: string;
  full_name: string;
  phone: string;
  cpf: string | null;
  status: string;
  subscriptionStatus?: 'active' | 'expired' | 'pending' | 'none';
  subscriptionEndDate?: string;
  canCheckIn: boolean;
  blockReason?: string;
}

export default function CheckIn() {
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadWithStatus | null>(null);
  const [checkInMode, setCheckInMode] = useState<'search' | 'qr'>('search');
  const qrInputRef = useRef<HTMLInputElement>(null);

  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: subscriptions } = useSubscriptions();
  const { data: todayCheckIns, isLoading: checkInsLoading } = useTodayCheckIns();
  const createCheckIn = useCreateCheckIn();

  // Filter only active leads
  const activeLeads = leads?.filter(l => l.status === 'ativo') || [];

  // Get subscription status for a lead
  const getLeadSubscriptionStatus = (leadId: string): { status: 'active' | 'expired' | 'pending' | 'none'; endDate?: string } => {
    const leadSubscriptions = subscriptions?.filter(s => s.lead_id === leadId) || [];
    const activeSubscription = leadSubscriptions.find(s => s.status === 'active');
    
    if (activeSubscription) {
      const endDate = parseISO(activeSubscription.end_date);
      if (isAfter(new Date(), endDate)) {
        return { status: 'expired', endDate: activeSubscription.end_date };
      }
      return { status: 'active', endDate: activeSubscription.end_date };
    }
    
    const pendingSubscription = leadSubscriptions.find(s => s.status === 'pending');
    if (pendingSubscription) {
      return { status: 'pending' };
    }
    
    return { status: 'none' };
  };

  // Search leads
  const searchResults: LeadWithStatus[] = searchTerm.length >= 2
    ? activeLeads
        .filter(lead => 
          lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.cpf && lead.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))) ||
          lead.phone.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
        )
        .slice(0, 10)
        .map(lead => {
          const subStatus = getLeadSubscriptionStatus(lead.id);
          let canCheckIn = true;
          let blockReason: string | undefined;

          if (subStatus.status === 'none') {
            canCheckIn = false;
            blockReason = 'Sem assinatura ativa';
          } else if (subStatus.status === 'expired') {
            canCheckIn = false;
            blockReason = 'Assinatura expirada';
          } else if (subStatus.status === 'pending') {
            canCheckIn = false;
            blockReason = 'Assinatura pendente';
          }

          return {
            ...lead,
            subscriptionStatus: subStatus.status,
            subscriptionEndDate: subStatus.endDate,
            canCheckIn,
            blockReason,
          };
        })
    : [];

  // Handle QR Code input
  useEffect(() => {
    if (checkInMode === 'qr' && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [checkInMode]);

  const handleQrSubmit = () => {
    if (!qrCode) return;
    
    // Try to find lead by ID or CPF from QR code
    const lead = activeLeads.find(l => 
      l.id === qrCode || 
      (l.cpf && l.cpf.replace(/\D/g, '') === qrCode.replace(/\D/g, ''))
    );

    if (lead) {
      const subStatus = getLeadSubscriptionStatus(lead.id);
      let canCheckIn = true;
      let blockReason: string | undefined;

      if (subStatus.status === 'none' || subStatus.status === 'expired' || subStatus.status === 'pending') {
        canCheckIn = false;
        blockReason = subStatus.status === 'none' ? 'Sem assinatura ativa' : 
                      subStatus.status === 'expired' ? 'Assinatura expirada' : 'Assinatura pendente';
      }

      setSelectedLead({
        ...lead,
        subscriptionStatus: subStatus.status,
        subscriptionEndDate: subStatus.endDate,
        canCheckIn,
        blockReason,
      });
    } else {
      toast({
        title: 'Aluno não encontrado',
        description: 'O QR Code não corresponde a nenhum aluno ativo.',
        variant: 'destructive',
      });
    }
    
    setQrCode('');
  };

  const handleCheckIn = (lead: LeadWithStatus, method: string) => {
    if (!lead.canCheckIn) {
      toast({
        title: 'Check-in bloqueado',
        description: lead.blockReason,
        variant: 'destructive',
      });
      return;
    }

    createCheckIn.mutate(
      { unit_id: DEFAULT_UNIT_ID, lead_id: lead.id, method },
      {
        onSuccess: () => {
          setSelectedLead(null);
          setSearchTerm('');
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Ativo</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Expirado</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">Pendente</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Sem Plano</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Check-in de Alunos</h1>
            <p className="text-sm text-muted-foreground">Registre a entrada dos alunos na academia</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Entradas Hoje</p>
                <p className="text-lg font-bold text-primary">{todayCheckIns?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Check-in Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Registrar Entrada</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={checkInMode} onValueChange={(v) => setCheckInMode(v as 'search' | 'qr')}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="search" className="gap-2">
                      <Keyboard className="h-4 w-4" />
                      Buscar Aluno
                    </TabsTrigger>
                    <TabsTrigger value="qr" className="gap-2">
                      <ScanLine className="h-4 w-4" />
                      QR Code
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="search" className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, CPF ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        autoFocus
                      />
                    </div>

                    {searchTerm.length >= 2 && (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {searchResults.length > 0 ? (
                            searchResults.map((lead) => (
                              <div
                                key={lead.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedLead(lead)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                    {lead.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{lead.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {lead.cpf ? `CPF: ${lead.cpf}` : lead.phone}
                                  </p>
                                </div>
                                {getStatusBadge(lead.subscriptionStatus || 'none')}
                                {lead.canCheckIn ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>Nenhum aluno encontrado</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}

                    {searchTerm.length < 2 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="qr" className="space-y-4">
                    <div className="text-center py-8">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Posicione o leitor de QR Code ou digite o código manualmente
                      </p>
                      <div className="flex gap-2 max-w-sm mx-auto">
                        <Input
                          ref={qrInputRef}
                          placeholder="Código do QR Code ou CPF..."
                          value={qrCode}
                          onChange={(e) => setQrCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleQrSubmit()}
                          className="text-center"
                        />
                        <Button onClick={handleQrSubmit} disabled={!qrCode}>
                          Verificar
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Selected Lead Confirmation */}
            {selectedLead && (
              <Card className={`border-2 ${selectedLead.canCheckIn ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className={`text-xl font-bold ${selectedLead.canCheckIn ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {selectedLead.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground">{selectedLead.full_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedLead.cpf ? `CPF: ${selectedLead.cpf}` : selectedLead.phone}
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        {getStatusBadge(selectedLead.subscriptionStatus || 'none')}
                        {selectedLead.subscriptionEndDate && (
                          <span className="text-xs text-muted-foreground">
                            Válido até {format(parseISO(selectedLead.subscriptionEndDate), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                      
                      {selectedLead.canCheckIn ? (
                        <div className="flex gap-2">
                          <Button 
                            size="lg" 
                            className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleCheckIn(selectedLead, 'manual')}
                            disabled={createCheckIn.isPending}
                          >
                            <UserCheck className="h-5 w-5" />
                            Confirmar Entrada
                          </Button>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => setSelectedLead(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium text-red-500">Entrada Bloqueada</p>
                            <p className="text-sm text-muted-foreground">{selectedLead.blockReason}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedLead(null)}
                            className="ml-auto"
                          >
                            Fechar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Today's Check-ins */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Entradas de Hoje</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {todayCheckIns?.length || 0} check-ins
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {checkInsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 mb-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : todayCheckIns && todayCheckIns.length > 0 ? (
                  <div className="space-y-2">
                    {todayCheckIns.map((checkIn: any) => (
                      <div
                        key={checkIn.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 rounded-full bg-emerald-500/10">
                          <UserCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {checkIn.lead?.full_name || 'Aluno'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(checkIn.checked_in_at), 'HH:mm')}
                            <span className="text-muted-foreground/50">•</span>
                            {formatDistanceToNow(parseISO(checkIn.checked_in_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {checkIn.method === 'qr_code' ? 'QR' : checkIn.method}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum check-in hoje</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}