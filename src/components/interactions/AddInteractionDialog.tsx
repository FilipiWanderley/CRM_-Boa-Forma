import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateInteraction, type InteractionType } from '@/hooks/useInteractions';
import { Plus, Phone, MessageCircle, Mail, User } from 'lucide-react';

interface AddInteractionDialogProps {
  leadId: string;
  trigger?: React.ReactNode;
}

const interactionTypes: { value: InteractionType; label: string; icon: React.ReactNode }[] = [
  { value: 'ligacao', label: 'Ligação', icon: <Phone className="h-4 w-4" /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" /> },
  { value: 'email', label: 'E-mail', icon: <Mail className="h-4 w-4" /> },
  { value: 'presencial', label: 'Presencial', icon: <User className="h-4 w-4" /> },
];

export function AddInteractionDialog({ leadId, trigger }: AddInteractionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InteractionType>('ligacao');
  const [description, setDescription] = useState('');
  
  const createInteraction = useCreateInteraction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createInteraction.mutateAsync({
      lead_id: leadId,
      type,
      description,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setType('ligacao');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Interação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
          <DialogDescription>
            Registre uma nova interação com este lead
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Interação</Label>
              <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interactionTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a interação realizada..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInteraction.isPending || !description.trim()}>
              {createInteraction.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
