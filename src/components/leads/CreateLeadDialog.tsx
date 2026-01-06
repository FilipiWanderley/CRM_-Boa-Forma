import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LeadForm, LeadFormData } from './LeadForm';
import { useCreateLead } from '@/hooks/useLeads';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateLeadDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateLeadDialog({ trigger, onSuccess }: CreateLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const createLead = useCreateLead();

  const handleSubmit = (data: LeadFormData) => {
    createLead.mutate(
      {
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || undefined,
        cpf: data.cpf || undefined,
        gender: data.gender || undefined,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
        source: data.source || undefined,
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          <LeadForm
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            isSubmitting={createLead.isPending}
            submitLabel="Cadastrar Lead"
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
