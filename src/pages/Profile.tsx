import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, MapPin, Calendar, Save, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { formatCPF, formatPhone, formatCEP, fetchAddressByCEP, validateCPF, validatePhone, validateEmail } from '@/lib/masks';

export default function Profile() {
  const { user, profile, roles } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cpf: '',
    birth_date: '',
    gender: '',
    cep: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
  });

  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url);
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        cpf: '',
        birth_date: '',
        gender: '',
        cep: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
      });
      
      // Fetch full profile data
      fetchFullProfile();
    }
  }, [profile]);

  const fetchFullProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setAvatarUrl(data.avatar_url);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        cpf: data.cpf || '',
        birth_date: data.birth_date || '',
        gender: data.gender || '',
        cep: '',
        address: data.address || '',
        emergency_contact: data.emergency_contact || '',
        emergency_phone: data.emergency_phone || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validação de telefone se preenchido
    if (formData.phone && !validatePhone(formData.phone)) {
      toast({
        title: 'Telefone inválido',
        description: 'Informe um número de telefone válido com DDD.',
        variant: 'destructive',
      });
      return;
    }

    // Validação de CPF se preenchido
    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, verifique o número do CPF informado.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          cpf: formData.cpf || null,
          birth_date: formData.birth_date || null,
          gender: formData.gender || null,
          address: formData.address || null,
          emergency_contact: formData.emergency_contact || null,
          emergency_phone: formData.emergency_phone || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      gestor: 'Gestor',
      recepcao: 'Recepção',
      professor: 'Professor',
      aluno: 'Aluno',
    };
    return labels[role] || role;
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            {user && (
              <AvatarUpload
                userId={user.id}
                currentAvatarUrl={avatarUrl}
                fullName={formData.full_name}
                onUploadComplete={(url) => setAvatarUrl(url)}
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-xl">{formData.full_name || 'Usuário'}</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                {roles.map((r, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {getRoleLabel(r.role)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="birth_date"
                      type="date"
                      className="pl-10"
                      value={formData.birth_date}
                      onChange={(e) => handleChange('birth_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={async (e) => {
                        const formatted = formatCEP(e.target.value);
                        handleChange('cep', formatted);
                        
                        // Busca automática quando CEP completo
                        if (formatted.replace(/\D/g, '').length === 8) {
                          setLoadingCep(true);
                          const address = await fetchAddressByCEP(formatted);
                          setLoadingCep(false);
                          
                          if (address) {
                            const fullAddress = `${address.logradouro}${address.complemento ? ', ' + address.complemento : ''}, ${address.bairro}, ${address.localidade} - ${address.uf}`;
                            handleChange('address', fullAddress);
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

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      className="pl-10 min-h-[80px]"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Rua, número, bairro, cidade..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contato de Emergência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Nome do Contato</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => handleChange('emergency_contact', e.target.value)}
                    placeholder="Nome do familiar ou responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                  <Input
                    id="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={(e) => handleChange('emergency_phone', formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={loading} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
