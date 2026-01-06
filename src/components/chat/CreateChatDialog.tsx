import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChat } from '@/hooks/useChat';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateChatDialog = ({ open, onOpenChange }: CreateChatDialogProps) => {
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedProfessor, setSelectedProfessor] = useState<string>('');
  const { createRoom, isCreatingRoom } = useChat();
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch leads (alunos ativos)
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads-for-chat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name')
        .eq('status', 'ativo')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch professors
  const { data: professors = [], isLoading: isLoadingProfessors } = useQuery({
    queryKey: ['professors-for-chat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'professor')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = () => {
    if (!selectedLead || !selectedProfessor) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um aluno e um professor',
        variant: 'destructive',
      });
      return;
    }

    if (!profile?.unit_id) {
      toast({
        title: 'Erro',
        description: 'Unidade não encontrada',
        variant: 'destructive',
      });
      return;
    }

    createRoom(
      { unitId: profile.unit_id, leadId: selectedLead, professorId: selectedProfessor },
      {
        onSuccess: () => {
          toast({
            title: 'Conversa criada',
            description: 'A nova conversa foi criada com sucesso',
          });
          onOpenChange(false);
          setSelectedLead('');
          setSelectedProfessor('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Aluno</Label>
            <Select value={selectedLead} onValueChange={setSelectedLead}>
              <SelectTrigger id="lead">
                <SelectValue placeholder={isLoadingLeads ? 'Carregando...' : 'Selecione um aluno'} />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professor">Professor</Label>
            <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
              <SelectTrigger id="professor">
                <SelectValue placeholder={isLoadingProfessors ? 'Carregando...' : 'Selecione um professor'} />
              </SelectTrigger>
              <SelectContent>
                {professors.map((professor) => (
                  <SelectItem key={professor.id} value={professor.id}>
                    {professor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isCreatingRoom}>
              {isCreatingRoom ? 'Criando...' : 'Criar Conversa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
