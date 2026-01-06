import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useLeads, useDeleteLead, useBulkDeleteLeads, useBulkUpdateLeadStatus, getStatusLabel, type PipelineStatus, type Lead } from '@/hooks/useLeads';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard } from '@/components/shared';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { ImportLeadsDialog } from '@/components/leads/ImportLeadsDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, Download, Search, MoreVertical, Eye, Edit, Trash2, Phone, Mail, ClipboardList, Users, UserPlus, UserCheck, TrendingUp, Filter, CalendarIcon, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportLeads } from '@/lib/exportLeads';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

type SortColumn = 'full_name' | 'created_at' | 'status';
type SortDirection = 'asc' | 'desc';

const STATUS_ORDER: Record<PipelineStatus, number> = {
  lead: 1,
  visita_agendada: 2,
  negociacao: 3,
  ativo: 4,
  inativo: 5,
  cancelado: 6,
};

const statusStyles: Record<PipelineStatus, string> = {
  lead: 'bg-info/10 text-info border-info/30',
  visita_agendada: 'bg-warning/10 text-warning border-warning/30',
  negociacao: 'bg-primary/10 text-primary border-primary/30',
  ativo: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  inativo: 'bg-muted text-muted-foreground border-muted',
  cancelado: 'bg-destructive/10 text-destructive border-destructive/30',
};

const STATUS_OPTIONS: { value: PipelineStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'lead', label: 'Lead' },
  { value: 'visita_agendada', label: 'Visita Agendada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'cancelado', label: 'Cancelado' },
];

const BULK_STATUS_OPTIONS: { value: PipelineStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'visita_agendada', label: 'Visita Agendada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'cancelado', label: 'Cancelado' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Todas as origens' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'passante', label: 'Passante' },
];

export default function Leads() {
  const { data: leads, isLoading } = useLeads();
  const deleteLead = useDeleteLead();
  const bulkDeleteLeads = useBulkDeleteLeads();
  const bulkUpdateStatus = useBulkUpdateLeadStatus();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Search and filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast({
        title: 'Nenhum lead para exportar',
        description: 'Não há leads para exportar com os filtros atuais.',
        variant: 'destructive',
      });
      return;
    }

    exportLeads(filteredLeads, { format });
    toast({
      title: 'Exportação concluída',
      description: `${filteredLeads.length} leads exportados com sucesso.`,
    });
  };

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    let result = leads.filter((lead) => {
      // Text search
      const matchesSearch = 
        lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      // Source filter
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const leadDate = new Date(lead.created_at);
        if (dateFrom && isBefore(leadDate, startOfDay(dateFrom))) {
          matchesDate = false;
        }
        if (dateTo && isAfter(leadDate, endOfDay(dateTo))) {
          matchesDate = false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesSource && matchesDate;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'full_name':
          comparison = a.full_name.localeCompare(b.full_name, 'pt-BR');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, search, statusFilter, sourceFilter, dateFrom, dateTo, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Pagination calculations
  const totalFilteredLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalFilteredLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || sourceFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  // Selection helpers
  const isAllPageSelected = paginatedLeads.length > 0 && paginatedLeads.every(lead => selectedIds.has(lead.id));
  const isSomeSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      const newSelected = new Set(selectedIds);
      paginatedLeads.forEach(lead => newSelected.delete(lead.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      paginatedLeads.forEach(lead => newSelected.add(lead.id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} leads?`)) return;
    
    await bulkDeleteLeads.mutateAsync(Array.from(selectedIds));
    clearSelection();
  };

  const handleBulkStatusChange = async (status: PipelineStatus) => {
    if (selectedIds.size === 0) return;
    
    await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status });
    clearSelection();
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter(l => l.status === 'lead').length || 0;
  const activeClients = leads?.filter(l => l.status === 'ativo').length || 0;
  const inNegotiation = leads?.filter(l => l.status === 'negociacao').length || 0;

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      deleteLead.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Leads"
          subtitle="Gerencie todos os seus leads e clientes"
          actions={
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    Exportar como Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Exportar como CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ImportLeadsDialog
                trigger={
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                }
              />
              <CreateLeadDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lead
                  </Button>
                }
              />
            </div>
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
            href="/leads"
            linkText="Ver Todos"
          />
          <StatCard
            title="Novos Leads"
            value={newLeads}
            change={8}
            icon={<UserPlus className="h-6 w-6 text-primary" />}
            loading={isLoading}
            href="/pipeline"
            linkText="Ver Pipeline"
          />
          <StatCard
            title="Em Negociação"
            value={inNegotiation}
            change={15}
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
            loading={isLoading}
            href="/pipeline"
            linkText="Ver Pipeline"
          />
          <StatCard
            title="Clientes Ativos"
            value={activeClients}
            change={5}
            icon={<UserCheck className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as PipelineStatus | 'all'); handleFilterChange(); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); handleFilterChange(); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : "Data de"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => { setDateFrom(date); handleFilterChange(); }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "Data até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => { setDateTo(date); handleFilterChange(); }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Mostrando {filteredLeads.length} de {totalLeads} leads</span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {isSomeSelected && (
          <div className="sticky top-0 z-10 bg-primary text-primary-foreground rounded-lg p-3 flex items-center justify-between gap-4 animate-fade-in shadow-lg">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5" />
              <span className="font-medium">{selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}</span>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="text-primary-foreground hover:bg-primary-foreground/20">
                Limpar seleção
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    Alterar Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {BULK_STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuItem key={opt.value} onClick={() => handleBulkStatusChange(opt.value)}>
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBulkDelete}
                disabled={bulkDeleteLeads.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        )}

        {/* Leads List */}
        <div className="space-y-2">
          {/* Column Headers */}
          {!isLoading && paginatedLeads.length > 0 && (
            <div className="hidden md:flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
              <Checkbox
                checked={isAllPageSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Selecionar todos"
              />
              <div className="w-10" /> {/* Avatar space */}
              <button 
                onClick={() => handleSort('full_name')}
                className="flex-1 flex items-center hover:text-foreground transition-colors cursor-pointer text-left"
              >
                Nome {getSortIcon('full_name')}
              </button>
              <div className="hidden md:flex items-center gap-6 w-[280px]">
                <span className="flex-1">Contato</span>
              </div>
              <div className="hidden lg:block w-[80px]">Origem</div>
              <button 
                onClick={() => handleSort('status')}
                className="flex items-center justify-center min-w-[100px] hover:text-foreground transition-colors cursor-pointer"
              >
                Status {getSortIcon('status')}
              </button>
              <button 
                onClick={() => handleSort('created_at')}
                className="flex items-center min-w-[90px] hover:text-foreground transition-colors cursor-pointer"
              >
                Cadastro {getSortIcon('created_at')}
              </button>
              <div className="w-8" /> {/* Actions space */}
            </div>
          )}
          
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </>
          ) : paginatedLeads && paginatedLeads.length > 0 ? (
            paginatedLeads.map((lead) => {
              const initials = lead.full_name
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'L';
              const isSelected = selectedIds.has(lead.id);

              return (
                <Card
                  key={lead.id}
                  className={cn(
                    "border border-border/50 hover:shadow-md transition-all cursor-pointer",
                    isSelected && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${lead.full_name}`}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{lead.full_name}</p>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        {lead.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1.5 max-w-[200px] truncate">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="hidden lg:block text-sm text-muted-foreground min-w-[80px]">
                        {lead.source || '-'}
                      </div>

                      <Badge
                        variant="outline"
                        className={cn('min-w-[100px] justify-center', statusStyles[lead.status])}
                      >
                        {getStatusLabel(lead.status)}
                      </Badge>

                      <div className="hidden md:block text-xs text-muted-foreground min-w-[90px]">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/leads/${lead.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setEditingLead(lead);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/anamnesis/${lead.id}`);
                          }}>
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Ficha de Anamnese
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(lead.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{search || hasActiveFilters ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(endIndex, totalFilteredLeads)} de {totalFilteredLeads} leads
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50", "cursor-pointer")}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, idx) => (
                  <PaginationItem key={idx}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={cn(currentPage === totalPages && "pointer-events-none opacity-50", "cursor-pointer")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        {editingLead && (
          <EditLeadDialog
            lead={editingLead}
            open={!!editingLead}
            onOpenChange={(open) => !open && setEditingLead(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
