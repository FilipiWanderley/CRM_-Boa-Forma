import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePayment, useUpdateInvoice, type Invoice } from '@/hooks/useFinancial';
import { Loader2, CreditCard, QrCode, Barcode, Wallet, Banknote } from 'lucide-react';

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

const paymentMethods = [
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'debit_card', label: 'Cartão de Débito', icon: Wallet },
  { value: 'boleto', label: 'Boleto', icon: Barcode },
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
] as const;

export function RegisterPaymentDialog({ open, onOpenChange, invoice }: RegisterPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  const [amount, setAmount] = useState(invoice?.amount?.toString() || '');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  const createPayment = useCreatePayment();
  const updateInvoice = useUpdateInvoice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    await createPayment.mutateAsync({
      unit_id: invoice.unit_id,
      invoice_id: invoice.id,
      amount: parseFloat(amount),
      payment_method: paymentMethod as any,
      paid_at: new Date().toISOString(),
      transaction_id: transactionId || null,
      notes: notes || null,
    });

    await updateInvoice.mutateAsync({
      id: invoice.id,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setPaymentMethod('pix');
    setAmount('');
    setTransactionId('');
    setNotes('');
  };

  const isPending = createPayment.isPending || updateInvoice.isPending;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Fatura de {invoice.lead?.full_name} - {formatCurrency(Number(invoice.amount))}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <Button
                    key={method.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-3 gap-1"
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor Pago (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={invoice.amount?.toString()}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">ID da Transação (opcional)</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Ex: PIX123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
