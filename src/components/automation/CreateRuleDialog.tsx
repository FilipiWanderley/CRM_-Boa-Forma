import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAutomationRule, type AutomationType, automationTypeLabels } from '@/hooks/useAutomation';
import { useAuth } from '@/hooks/useAuth';

interface CreateRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultTemplates: Record<AutomationType, { subject: string; message: string; days: number | null }> = {
  welcome: {
    subject: 'Bem-vindo à Boa Forma Academia! 🏋️',
    message: 'Olá {{nome}}! Seja muito bem-vindo à nossa família! Estamos muito felizes em tê-lo conosco. Sua jornada de transformação começa agora!',
    days: null,
  },
  renewal_reminder: {
    subject: 'Sua mensalidade vence em breve',
    message: 'Olá {{nome}}, sua mensalidade vence em {{dias}} dias. Renove agora e continue sua evolução!',
    days: -7,
  },
  birthday: {
    subject: 'Feliz Aniversário! 🎂',
    message: 'Parabéns {{nome}}! Desejamos um dia incrível e cheio de energia. A Boa Forma Academia agradece por fazer parte da nossa família!',
    days: 0,
  },
  overdue: {
    subject: 'Regularize sua situação',
    message: 'Olá {{nome}}, identificamos uma pendência em sua mensalidade. Regularize sua situação para continuar aproveitando todos os benefícios.',
    days: 3,
  },
  inactivity: {
    subject: 'Sentimos sua falta! 😊',
    message: 'Olá {{nome}}, percebemos que você não aparece há alguns dias. Venha retomar seus treinos, estamos esperando você!',
    days: 5,
  },
};

export function CreateRuleDialog({ open, onOpenChange }: CreateRuleDialogProps) {
  const { profile } = useAuth();
  const createRule = useCreateAutomationRule();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'welcome' as AutomationType,
    trigger_days: null as number | null,
    subject: defaultTemplates.welcome.subject,
    message_template: defaultTemplates.welcome.message,
    channel: 'email',
  });

  const handleTypeChange = (type: AutomationType) => {
    const template = defaultTemplates[type];
    setFormData({
      ...formData,
      type,
      trigger_days: template.days,
      subject: template.subject,
      message_template: template.message,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.unit_id) return;

    await createRule.mutateAsync({
      unit_id: profile.unit_id,
      name: formData.name,
      type: formData.type,
      trigger_days: formData.trigger_days ?? undefined,
      subject: formData.subject,
      message_template: formData.message_template,
      channel: formData.channel,
    });

    onOpenChange(false);
    setFormData({
      name: '',
      type: 'welcome',
      trigger_days: null,
      subject: defaultTemplates.welcome.subject,
      message_template: defaultTemplates.welcome.message,
      channel: 'email',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Automação</DialogTitle>
          <DialogDescription>
            Configure uma nova régua de comunicação automática.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Regra</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Boas-vindas novos alunos"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Automação</Label>
              <Select value={formData.type} onValueChange={(v) => handleTypeChange(v as AutomationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(automationTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_days">Dias para Disparo</Label>
              <Input
                id="trigger_days"
                type="number"
                value={formData.trigger_days ?? ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  trigger_days: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="0 = no dia, -7 = 7 dias antes"
              />
              <p className="text-xs text-muted-foreground">
                Negativo = antes, Positivo = depois
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use {'{{nome}}'}, {'{{dias}}'}, {'{{email}}'} para variáveis
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createRule.isPending}>
              {createRule.isPending ? 'Criando...' : 'Criar Automação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
