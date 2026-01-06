import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateSubscription, useCreateInvoice, usePlans } from '@/hooks/useFinancial';
import { useLeads } from '@/hooks/useLeads';
import { Loader2 } from 'lucide-react';
import { addDays, format } from 'date-fns';

interface CreateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  preSelectedLeadId?: string;
}

export function CreateSubscriptionDialog({ open, onOpenChange, unitId, preSelectedLeadId }: CreateSubscriptionDialogProps) {
  const [leadId, setLeadId] = useState(preSelectedLeadId || '');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [autoRenew, setAutoRenew] = useState(true);
  const [paymentDay, setPaymentDay] = useState('1');
  const [generateInvoice, setGenerateInvoice] = useState(true);

  const { data: leads } = useLeads('ativo');
  const { data: plans } = usePlans();
  const createSubscription = useCreateSubscription();
  const createInvoice = useCreateInvoice();

  const selectedPlan = plans?.find(p => p.id === planId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const start = new Date(startDate);
    const end = addDays(start, selectedPlan.duration_days);

    const subscription = await createSubscription.mutateAsync({
      unit_id: unitId,
      lead_id: leadId,
      plan_id: planId,
      status: 'active',
      start_date: startDate,
      end_date: format(end, 'yyyy-MM-dd'),
      auto_renew: autoRenew,
      payment_day: parseInt(paymentDay),
    });

    if (generateInvoice && subscription) {
      const dueDate = new Date(start);
      dueDate.setDate(parseInt(paymentDay));
      if (dueDate < start) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      await createInvoice.mutateAsync({
        unit_id: unitId,
        subscription_id: subscription.id,
        lead_id: leadId,
        amount: selectedPlan.price,
        due_date: format(dueDate, 'yyyy-MM-dd'),
        status: 'pending',
        description: `Mensalidade - ${selectedPlan.name}`,
        reference_month: format(start, 'yyyy-MM'),
        paid_at: null,
        pix_code: null,
        boleto_url: null,
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setLeadId('');
    setPlanId('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setAutoRenew(true);
    setPaymentDay('1');
    setGenerateInvoice(true);
  };

  const isPending = createSubscription.isPending || createInvoice.isPending;
  const activePlans = plans?.filter(p => p.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Assinatura</DialogTitle>
          <DialogDescription>
            Vincule um aluno a um plano de mensalidade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Aluno</Label>
            <Select value={leadId} onValueChange={setLeadId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {leads?.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plano</Label>
            <Select value={planId} onValueChange={setPlanId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - R$ {Number(plan.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDay">Dia de Vencimento</Label>
              <Select value={paymentDay} onValueChange={setPaymentDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoRenew">Renovação automática</Label>
            <Switch id="autoRenew" checked={autoRenew} onCheckedChange={setAutoRenew} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="generateInvoice">Gerar primeira fatura</Label>
            <Switch id="generateInvoice" checked={generateInvoice} onCheckedChange={setGenerateInvoice} />
          </div>

          {selectedPlan && (
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm font-medium">Resumo</p>
              <p className="text-sm text-muted-foreground">
                Plano: {selectedPlan.name} ({selectedPlan.duration_days} dias)
              </p>
              <p className="text-sm text-muted-foreground">
                Valor: R$ {Number(selectedPlan.price).toFixed(2)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !leadId || !planId}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Assinatura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
