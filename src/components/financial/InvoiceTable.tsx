import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CreditCard, QrCode, FileText, CheckCircle2 } from 'lucide-react';
import type { Invoice } from '@/hooks/useFinancial';

interface InvoiceTableProps {
  invoices: Invoice[];
  onRegisterPayment: (invoice: Invoice) => void;
  onViewDetails: (invoice: Invoice) => void;
}

const statusConfig = {
  pending: { label: 'Pendente', variant: 'secondary' as const },
  paid: { label: 'Pago', variant: 'default' as const },
  overdue: { label: 'Vencido', variant: 'destructive' as const },
  cancelled: { label: 'Cancelado', variant: 'outline' as const },
  refunded: { label: 'Estornado', variant: 'outline' as const },
};

export function InvoiceTable({ invoices, onRegisterPayment, onViewDetails }: InvoiceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhuma fatura encontrada
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => {
              const status = statusConfig[invoice.status];
              const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending';
              
              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.lead?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{invoice.lead?.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.subscription?.plan?.name || '--'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(invoice.amount))}
                  </TableCell>
                  <TableCell>
                    <span className={isOverdue ? 'text-destructive' : ''}>
                      {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isOverdue ? 'destructive' : status.variant}>
                      {isOverdue ? 'Vencido' : status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {invoice.status !== 'paid' && (
                          <DropdownMenuItem onClick={() => onRegisterPayment(invoice)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Registrar Pagamento
                          </DropdownMenuItem>
                        )}
                        {invoice.pix_code && (
                          <DropdownMenuItem>
                            <QrCode className="h-4 w-4 mr-2" />
                            Ver QR Code PIX
                          </DropdownMenuItem>
                        )}
                        {invoice.boleto_url && (
                          <DropdownMenuItem>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Ver Boleto
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
