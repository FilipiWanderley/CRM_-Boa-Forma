import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { LeadForm, LeadFormData } from './LeadForm';
import { useUpdateLead, Lead } from '@/hooks/useLeads';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditLeadDialog({ lead, open, onOpenChange, onSuccess }: EditLeadDialogProps) {
  const updateLead = useUpdateLead();

  const handleSubmit = (data: LeadFormData) => {
    updateLead.mutate(
      {
        id: lead.id,
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
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          <LeadForm
            leadId={lead.id}
            initialData={{
              full_name: lead.full_name,
              phone: lead.phone,
              email: lead.email || '',
              cpf: lead.cpf || '',
              gender: lead.gender || '',
              birth_date: lead.birth_date || '',
              address: lead.address || '',
              source: lead.source || '',
              notes: lead.notes || '',
            }}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateLead.isPending}
            submitLabel="Salvar Alterações"
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
