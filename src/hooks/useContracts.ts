import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

export interface Contract {
  id: string;
  unit_id: string;
  lead_id: string;
  subscription_id: string | null;
  template_id: string | null;
  status: 'draft' | 'pending' | 'signed' | 'cancelled';
  content: string;
  signed_at: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
  signature_data: string | null;
  valid_from: string | null;
  valid_until: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    full_name: string;
    email: string | null;
  };
}

export interface ContractTemplate {
  id: string;
  unit_id: string;
  name: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateContractInput {
  lead_id: string;
  subscription_id?: string;
  template_id?: string;
  content: string;
  status?: 'draft' | 'pending';
  valid_from?: string;
  valid_until?: string;
}

interface CreateTemplateInput {
  name: string;
  content: string;
  is_default?: boolean;
}

const DEFAULT_UNIT_ID = 'a0000000-0000-0000-0000-000000000001';

export function useContracts(status?: string) {
  return useQuery({
    queryKey: ['contracts', status],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          lead:leads(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          lead:leads(full_name, email, phone, cpf)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Contract;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...input,
          unit_id: DEFAULT_UNIT_ID,
          created_by: user?.id,
          status: input.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      logActivity({
        entity_type: 'contract',
        entity_id: data.id,
        action: 'create',
        description: 'Novo contrato criado',
        metadata: { lead_id: data.lead_id, status: data.status },
      });
      toast({
        title: 'Contrato criado',
        description: 'O contrato foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSignContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, signature_data }: { id: string; signature_data: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_user_agent: navigator.userAgent,
          signature_data,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      logActivity({
        entity_type: 'contract',
        entity_id: data.id,
        action: 'status_change',
        description: 'Contrato assinado',
        metadata: { signed_at: data.signed_at },
      });
      toast({
        title: 'Contrato assinado',
        description: 'O contrato foi assinado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao assinar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useContractTemplates() {
  return useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ContractTemplate[];
    },
  });
}

export function useCreateContractTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          ...input,
          unit_id: DEFAULT_UNIT_ID,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({
        title: 'Template criado',
        description: 'O template de contrato foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTemplateInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({
        title: 'Template atualizado',
        description: 'O template foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({
        title: 'Template removido',
        description: 'O template foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Default contract template
export const DEFAULT_CONTRACT_TEMPLATE = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ACADEMIA

CONTRATANTE: {{lead_name}}
CPF: {{lead_cpf}}
Email: {{lead_email}}
Telefone: {{lead_phone}}

CONTRATADA: {{gym_name}}
CNPJ: {{gym_cnpj}}

PLANO: {{plan_name}}
VALOR: R$ {{plan_price}}
VIGÊNCIA: {{valid_from}} a {{valid_until}}

CLÁUSULAS E CONDIÇÕES:

1. O CONTRATANTE declara estar ciente das normas e regulamentos da academia.

2. O presente contrato tem vigência conforme indicado acima, podendo ser renovado.

3. O CONTRATANTE se compromete a efetuar os pagamentos nas datas acordadas.

4. A CONTRATADA se compromete a fornecer os serviços descritos no plano contratado.

5. O cancelamento deve ser solicitado com antecedência mínima de 30 dias.

Data: {{current_date}}
Local: {{gym_city}}

____________________________
Assinatura do Contratante
`;
