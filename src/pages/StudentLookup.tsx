import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  User, 
  CreditCard, 
  Receipt, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  Activity,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  status: string;
  address: string | null;
  birth_date: string | null;
}

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  plan: {
    name: string;
    price: number;
    duration_days: number;
  } | null;
}

interface Invoice {
  id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  description: string | null;
}

interface CheckIn {
  id: string;
  checked_in_at: string;
  method: string | null;
}

function useSearchLeads(searchTerm: string) {
  return useQuery({
    queryKey: ['search-leads', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const cleanedTerm = searchTerm.replace(/\D/g, '');
      const isNumeric = cleanedTerm.length > 0;
      
      let query = supabase
        .from('leads')
        .select('id, full_name, phone, email, cpf, status, address, birth_date')
        .eq('status', 'ativo');
      
      if (isNumeric && cleanedTerm.length >= 3) {
        // Search by CPF or phone
        query = query.or(`cpf.ilike.%${cleanedTerm}%,phone.ilike.%${cleanedTerm}%`);
      } else {
        // Search by name
        query = query.ilike('full_name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data as Lead[];
    },
    enabled: searchTerm.length >= 2,
  });
}

function useLeadDetails(leadId: string | null) {
  const subscriptionQuery = useQuery({
    queryKey: ['lead-subscription', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(name, price, duration_days)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!leadId,
  });

  const invoicesQuery = useQuery({
    queryKey: ['lead-invoices', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('id, amount, due_date, paid_at, status, description')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!leadId,
  });

  const checkInsQuery = useQuery({
    queryKey: ['lead-checkins', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('check_ins')
        .select('id, checked_in_at, method')
        .eq('lead_id', leadId)
        .order('checked_in_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!leadId,
  });

  return {
    subscription: subscriptionQuery.data,
    invoices: invoicesQuery.data || [],
    checkIns: checkInsQuery.data || [],
    isLoading: subscriptionQuery.isLoading || invoicesQuery.isLoading || checkInsQuery.isLoading,
  };
}

export default function StudentLookup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const { data: searchResults, isLoading: isSearching } = useSearchLeads(searchTerm);
  const { subscription, invoices, checkIns, isLoading: isLoadingDetails } = useLeadDetails(selectedLead?.id || null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date());
    return days;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-0">Ativo</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-0">Pendente</Badge>;
      case 'expired':
        return <Badge className="bg-destructive/20 text-destructive border-0">Expirado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive/20 text-destructive border-0">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-success/20 text-success border-0 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Pago
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-0 gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-destructive/20 text-destructive border-0 gap-1">
            <AlertCircle className="h-3 w-3" />
            Vencida
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const totalPending = pendingInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Busca Rápida de Alunos</h1>
          <p className="text-muted-foreground">Consulte situação financeira e histórico de frequência</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.length < 2) setSelectedLead(null);
                }}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Search Results */}
            {searchTerm.length >= 2 && !selectedLead && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                {isSearching ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-4"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{lead.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {lead.phone} {lead.cpf && `• CPF: ${lead.cpf}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhum aluno encontrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Lead Details */}
        {selectedLead && (
          <div className="space-y-4">
            {/* Lead Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedLead.full_name}</CardTitle>
                    <p className="text-muted-foreground">{selectedLead.cpf || 'CPF não informado'}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSelectedLead(null);
                    setSearchTerm('');
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedLead.phone}</span>
                  </div>
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedLead.email}</span>
                    </div>
                  )}
                  {selectedLead.birth_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(selectedLead.birth_date), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {selectedLead.address && (
                    <div className="flex items-center gap-2 text-sm md:col-span-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{selectedLead.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {isLoadingDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subscription Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Plano Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscription ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-lg">{subscription.plan?.name}</span>
                          {getStatusBadge(subscription.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Valor</p>
                            <p className="font-semibold">
                              {subscription.plan?.price ? formatCurrency(subscription.plan.price) : '--'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Vencimento</p>
                            <p className="font-semibold">
                              {format(parseISO(subscription.end_date), 'dd/MM/yyyy')}
                            </p>
                            <p className={`text-xs ${getDaysRemaining(subscription.end_date) < 0 ? 'text-destructive' : getDaysRemaining(subscription.end_date) <= 7 ? 'text-amber-600' : 'text-success'}`}>
                              {getDaysRemaining(subscription.end_date) < 0 
                                ? `Vencido há ${Math.abs(getDaysRemaining(subscription.end_date))} dias`
                                : `${getDaysRemaining(subscription.end_date)} dias restantes`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Sem plano ativo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      Situação Financeira
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingInvoices.length > 0 ? (
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${pendingInvoices.some(i => i.status === 'overdue') ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                          <p className="text-sm text-muted-foreground">Total Pendente</p>
                          <p className={`text-2xl font-bold ${pendingInvoices.some(i => i.status === 'overdue') ? 'text-destructive' : 'text-amber-600'}`}>
                            {formatCurrency(totalPending)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pendingInvoices.length} fatura(s) em aberto
                          </p>
                        </div>
                        {pendingInvoices.some(i => i.status === 'overdue') && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Possui faturas vencidas!</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-success">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <p className="font-semibold text-success mt-1">Em dia!</p>
                        <p className="text-sm text-muted-foreground">Nenhuma pendência financeira</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Invoice History */}
            {invoices.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Histórico de Faturas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{format(parseISO(invoice.due_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {invoice.description || 'Mensalidade'}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            {invoice.paid_at 
                              ? format(parseISO(invoice.paid_at), 'dd/MM/yyyy')
                              : '--'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Check-in History */}
            {checkIns.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Últimos Check-ins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {checkIns.map((checkIn) => (
                      <div 
                        key={checkIn.id}
                        className="p-3 bg-muted/50 rounded-lg text-center"
                      >
                        <p className="text-sm font-medium">
                          {format(parseISO(checkIn.checked_in_at), 'dd/MM', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(checkIn.checked_in_at), 'HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
