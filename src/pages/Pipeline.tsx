import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLeads, useUpdateLeadStatus, getStatusLabel, type PipelineStatus } from '@/hooks/useLeads';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard } from '@/components/shared';
import { Phone, Mail, GripVertical, Plus, User, Users, UserPlus, TrendingUp, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const pipelineColumns: { status: PipelineStatus; color: string; bgColor: string }[] = [
  { status: 'lead', color: 'bg-info', bgColor: 'bg-info/5' },
  { status: 'visita_agendada', color: 'bg-warning', bgColor: 'bg-warning/5' },
  { status: 'negociacao', color: 'bg-primary', bgColor: 'bg-primary/5' },
  { status: 'ativo', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/5' },
];

export default function Pipeline() {
  const { data: leads, isLoading } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter(l => l.status === 'lead').length || 0;
  const inNegotiation = leads?.filter(l => l.status === 'negociacao').length || 0;
  const activeClients = leads?.filter(l => l.status === 'ativo').length || 0;

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: PipelineStatus) => {
    if (draggedLead) {
      updateStatus.mutate({ id: draggedLead, status });
      setDraggedLead(null);
    }
  };

  const getLeadsByStatus = (status: PipelineStatus) => {
    return leads?.filter((lead) => lead.status === status) || [];
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Pipeline de Vendas"
          subtitle="Arraste os cards para mover leads entre as etapas"
          actions={
            <Link to="/leads/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </Link>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Leads"
            value={totalLeads}
            change={12}
            icon={<Users className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Novos Leads"
            value={newLeads}
            change={8}
            icon={<UserPlus className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Em Negociação"
            value={inNegotiation}
            change={15}
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Clientes Ativos"
            value={activeClients}
            change={5}
            icon={<UserCheck className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
        </div>

        {/* Pipeline Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[500px]">
          {pipelineColumns.map((column) => (
            <div
              key={column.status}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={cn('w-3 h-3 rounded-full', column.color)} />
                <h3 className="font-semibold text-foreground">{getStatusLabel(column.status)}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {isLoading ? '...' : getLeadsByStatus(column.status).length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className={cn('flex-1 rounded-2xl p-3 space-y-2 min-h-[400px] border border-border/50', column.bgColor)}>
                {isLoading ? (
                  <>
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </>
                ) : (
                  getLeadsByStatus(column.status).map((lead) => {
                    const initials = lead.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'L';

                    return (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        className={cn(
                          'cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border-border/50',
                          draggedLead === lead.id && 'opacity-50 scale-95'
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <Link to={`/leads/${lead.id}`} className="flex-1 min-w-0">
                                  <p className="font-medium text-sm hover:text-primary transition-colors truncate">
                                    {lead.full_name}
                                  </p>
                                </Link>
                              </div>
                              
                              <div className="space-y-1.5">
                                {lead.phone && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span className="truncate">{lead.phone}</span>
                                  </div>
                                )}
                                {lead.email && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                              </div>
                              
                              {lead.source && (
                                <Badge variant="outline" className="text-xs">
                                  {lead.source}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {!isLoading && getLeadsByStatus(column.status).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <User className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum lead</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
