import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, CalendarIcon, User, Phone, MessageSquare, MapPin } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { formatPhone, formatCPF, formatCEP, validateEmail, validateCPF, validatePhone, fetchAddressByCEP } from '@/lib/masks';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface LeadFormData {
  full_name: string;
  phone: string;
  email: string;
  cpf: string;
  gender: string;
  birth_date: string;
  cep: string;
  address: string;
  source: string;
  notes: string;
}

const leadSchema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

interface LeadFormProps {
  initialData?: Partial<LeadFormData>;
  leadId?: string; // For edit mode - exclude current lead from duplicate check
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

async function checkDuplicates(
  cpf: string | undefined,
  email: string | undefined,
  phone: string,
  excludeLeadId?: string
): Promise<{ field: string; message: string } | null> {
  // Check CPF
  if (cpf) {
    const { data: cpfData } = await supabase
      .from('leads')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();
    
    if (cpfData && cpfData.id !== excludeLeadId) {
      return { field: 'cpf', message: 'CPF já cadastrado' };
    }
  }

  // Check email
  if (email) {
    const { data: emailData } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (emailData && emailData.id !== excludeLeadId) {
      return { field: 'email', message: 'E-mail já cadastrado' };
    }
  }

  // Check phone
  if (phone) {
    const { data: phoneData } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    
    if (phoneData && phoneData.id !== excludeLeadId) {
      return { field: 'phone', message: 'Telefone já cadastrado' };
    }
  }

  return null;
}

export function LeadForm({ 
  initialData, 
  leadId,
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  submitLabel = 'Cadastrar Lead'
}: LeadFormProps) {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCep, setLoadingCep] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    cpf: initialData?.cpf || '',
    gender: initialData?.gender || '',
    birth_date: initialData?.birth_date || '',
    cep: initialData?.cep || '',
    address: initialData?.address || '',
    source: initialData?.source || '',
    notes: initialData?.notes || '',
  });
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    initialData?.birth_date ? new Date(initialData.birth_date) : undefined
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    // Validação adicional de CPF
    if (formData.cpf && !validateCPF(formData.cpf)) {
      setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
      return;
    }

    // Verificar duplicados
    setCheckingDuplicates(true);
    const duplicate = await checkDuplicates(
      formData.cpf || undefined,
      formData.email || undefined,
      formData.phone,
      leadId
    );
    setCheckingDuplicates(false);

    if (duplicate) {
      setErrors(prev => ({ ...prev, [duplicate.field]: duplicate.message }));
      toast({
        title: 'Dados duplicados',
        description: duplicate.message,
        variant: 'destructive',
      });
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção: Dados Pessoais */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Dados Pessoais</h3>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
          </div>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input 
              value={formData.cpf} 
              onChange={(e) => {
                setFormData({...formData, cpf: formatCPF(e.target.value)});
                if (errors.cpf && validateCPF(formatCPF(e.target.value))) {
                  setErrors(prev => ({ ...prev, cpf: '' }));
                }
              }}
              onBlur={() => {
                if (formData.cpf && !validateCPF(formData.cpf)) {
                  setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
                }
              }}
              placeholder="000.000.000-00"
              maxLength={14}
              className={errors.cpf ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
          </div>
          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={(date) => {
                    setBirthDate(date);
                    setFormData({...formData, birth_date: date ? format(date, 'yyyy-MM-dd') : ''});
                  }}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Gênero</Label>
            <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
                <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Seção: Contato */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Contato</h3>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input 
              value={formData.phone} 
              onChange={(e) => {
                setFormData({...formData, phone: formatPhone(e.target.value)});
                if (errors.phone && validatePhone(formatPhone(e.target.value))) {
                  setErrors(prev => ({ ...prev, phone: '' }));
                }
              }}
              onBlur={() => {
                if (formData.phone && !validatePhone(formData.phone)) {
                  setErrors(prev => ({ ...prev, phone: 'Telefone inválido' }));
                }
              }}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input 
              type="email" 
              value={formData.email} 
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                if (errors.email && validateEmail(e.target.value)) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              onBlur={() => {
                if (formData.email && !validateEmail(formData.email)) {
                  setErrors(prev => ({ ...prev, email: 'E-mail inválido' }));
                }
              }}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Seção: Endereço */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Endereço</h3>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>CEP</Label>
            <div className="relative">
              <Input 
                value={formData.cep} 
                onChange={async (e) => {
                  const formatted = formatCEP(e.target.value);
                  setFormData({...formData, cep: formatted});
                  
                  if (formatted.replace(/\D/g, '').length === 8) {
                    setLoadingCep(true);
                    const address = await fetchAddressByCEP(formatted);
                    setLoadingCep(false);
                    
                    if (address) {
                      const fullAddress = `${address.logradouro}, ${address.bairro}, ${address.localidade} - ${address.uf}`;
                      setFormData(prev => ({...prev, cep: formatted, address: fullAddress}));
                      toast({
                        title: 'Endereço encontrado',
                        description: 'O endereço foi preenchido automaticamente.',
                      });
                    }
                  }
                }}
                placeholder="00000-000"
                maxLength={9}
              />
              {loadingCep && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Endereço</Label>
            <Input 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>
        </div>
      </div>

      {/* Seção: Outros */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Informações Adicionais</h3>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Origem</Label>
            <Select value={formData.source} onValueChange={(v) => setFormData({...formData, source: v})}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="indicacao">Indicação</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="passante">Passante</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting || checkingDuplicates}>
          {(isSubmitting || checkingDuplicates) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {checkingDuplicates ? 'Verificando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
