import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared';
import { useContracts, useContractTemplates, useCreateContractTemplate, type Contract, type ContractTemplate } from '@/hooks/useContracts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Plus, Search, Eye, Download, Edit, Check, Clock, X, FileSignature, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground', icon: Edit },
  pending: { label: 'Aguardando Assinatura', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  signed: { label: 'Assinado', color: 'bg-emerald-500/10 text-emerald-600', icon: Check },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-600', icon: X },
};

function CreateTemplateDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const createTemplate = useCreateContractTemplate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) return;
    
    await createTemplate.mutateAsync({ name, content });
    setName('');
    setContent('');
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Template de Contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Template</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Contrato Mensal"
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Conteúdo do Contrato</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Use variáveis como: {"{{lead_name}}"}, {"{{lead_cpf}}"}, {"{{plan_name}}"}, {"{{valid_from}}"}, etc.
            </p>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o conteúdo do contrato..."
              rows={15}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTemplate.isPending}>
              Criar Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContractCard({ contract }: { contract: Contract }) {
  const { toast } = useToast();
  const status = statusConfig[contract.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(contract.content, 170);
    
    doc.setFontSize(12);
    doc.text(lines, 20, 20);
    
    if (contract.signed_at && contract.signature_data) {
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Assinado em: ${format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm")}`, 20, pageHeight - 30);
      // Add signature image if available
      if (contract.signature_data.startsWith('data:image')) {
        try {
          doc.addImage(contract.signature_data, 'PNG', 20, pageHeight - 25, 60, 20);
        } catch (e) {
          console.error('Error adding signature:', e);
        }
      }
    }
    
    doc.save(`contrato-${contract.id.slice(0, 8)}.pdf`);
    toast({ title: 'Contrato exportado!' });
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn('flex items-center gap-1', status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="font-medium">{(contract.lead as any)?.full_name || 'Lead não encontrado'}</p>
            <p className="text-sm text-muted-foreground">
              Criado em {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {contract.signed_at && (
              <p className="text-sm text-emerald-600">
                Assinado em {format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleDownloadPDF} title="Baixar PDF">
              <Download className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Visualizar">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Contrato</DialogTitle>
                </DialogHeader>
                <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
                  {contract.content}
                </div>
                {contract.signature_data && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Assinatura:</p>
                    <img src={contract.signature_data} alt="Assinatura" className="max-h-20 border rounded" />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Contracts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: contracts, isLoading: contractsLoading } = useContracts();
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useContractTemplates();

  const filteredContracts = contracts?.filter(c => {
    const matchesSearch = !search || 
      (c.lead as any)?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: contracts?.length || 0,
    pending: contracts?.filter(c => c.status === 'pending').length || 0,
    signed: contracts?.filter(c => c.status === 'signed').length || 0,
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Contratos"
          subtitle="Gerencie contratos e assinaturas digitais"
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Contratos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aguardando Assinatura</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <FileSignature className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assinados</p>
                <p className="text-2xl font-bold">{stats.signed}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contracts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'draft', 'pending', 'signed', 'cancelled'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'Todos' : statusConfig[status]?.label || status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Contracts List */}
            <div className="space-y-3">
              {contractsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))
              ) : filteredContracts && filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <ContractCard key={contract.id} contract={contract} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum contrato encontrado</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-end">
              <CreateTemplateDialog onSuccess={() => refetchTemplates()} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templatesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))
              ) : templates && templates.length > 0 ? (
                templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {template.name}
                        {template.is_default && (
                          <Badge variant="secondary">Padrão</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {template.content.substring(0, 150)}...
                      </p>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{template.name}</DialogTitle>
                            </DialogHeader>
                            <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
                              {template.content}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum template encontrado</p>
                    <p className="text-sm">Crie um template para começar a gerar contratos</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
