import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Clock, Shield, Palette, Building2, Save, Upload, Type, Image, Moon } from 'lucide-react';
import { useUnits, useUpdateUnit } from '@/hooks/useUnits';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCNPJ, formatPhone, formatCEP, validateCNPJ, validatePhone, fetchAddressByCEP } from '@/lib/masks';

interface UnitSettings {
  id: string;
  name: string;
  cnpj: string | null;
  cep: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  primary_color: string | null;
  timezone: string | null;
  allow_entry_if_overdue: boolean;
  overdue_grace_days: number;
  inactivity_alert_days: number;
  font_family: string | null;
  favicon_url: string | null;
  // Dark theme
  dark_primary_color: string | null;
  dark_background_color: string | null;
  dark_accent_color: string | null;
}

interface OperatingHours {
  day: string;
  dayLabel: string;
  open: string;
  close: string;
  isOpen: boolean;
}

const defaultOperatingHours: OperatingHours[] = [
  { day: 'monday', dayLabel: 'Segunda-feira', open: '06:00', close: '22:00', isOpen: true },
  { day: 'tuesday', dayLabel: 'Terça-feira', open: '06:00', close: '22:00', isOpen: true },
  { day: 'wednesday', dayLabel: 'Quarta-feira', open: '06:00', close: '22:00', isOpen: true },
  { day: 'thursday', dayLabel: 'Quinta-feira', open: '06:00', close: '22:00', isOpen: true },
  { day: 'friday', dayLabel: 'Sexta-feira', open: '06:00', close: '22:00', isOpen: true },
  { day: 'saturday', dayLabel: 'Sábado', open: '08:00', close: '14:00', isOpen: true },
  { day: 'sunday', dayLabel: 'Domingo', open: '08:00', close: '12:00', isOpen: false },
];

const timezoneOptions = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
];

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#F97316', label: 'Laranja' },
];

const fontOptions = [
  { value: 'Inter', label: 'Inter (Padrão)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Raleway', label: 'Raleway' },
];

export default function GymSettings() {
  const { profile } = useAuth();
  const { data: units, isLoading } = useUnits();
  const updateUnit = useUpdateUnit();
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [settings, setSettings] = useState<UnitSettings | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>(defaultOperatingHours);

  const currentUnit = units?.find(u => u.id === profile?.unit_id);

  useEffect(() => {
    if (currentUnit) {
      setSettings({
        id: currentUnit.id,
        name: currentUnit.name,
        cnpj: currentUnit.cnpj,
        cep: '',
        address: currentUnit.address,
        phone: currentUnit.phone,
        email: currentUnit.email,
        logo_url: currentUnit.logo_url,
        primary_color: currentUnit.primary_color || '#3B82F6',
        timezone: currentUnit.timezone || 'America/Sao_Paulo',
        allow_entry_if_overdue: currentUnit.allow_entry_if_overdue || false,
        overdue_grace_days: currentUnit.overdue_grace_days || 0,
        inactivity_alert_days: currentUnit.inactivity_alert_days || 7,
        font_family: (currentUnit as any).font_family || 'Inter',
        favicon_url: (currentUnit as any).favicon_url || null,
        dark_primary_color: (currentUnit as any).dark_primary_color || null,
        dark_background_color: (currentUnit as any).dark_background_color || '#0a0a0a',
        dark_accent_color: (currentUnit as any).dark_accent_color || null,
      });
    }
  }, [currentUnit]);

  const handleSaveGeneral = async () => {
    if (!settings) return;
    
    // Validar CNPJ se preenchido
    if (settings.cnpj && settings.cnpj.replace(/\D/g, '').length > 0) {
      if (!validateCNPJ(settings.cnpj)) {
        toast.error('CNPJ inválido. Verifique o número informado.');
        return;
      }
    }
    
    // Validar telefone se preenchido
    if (settings.phone && settings.phone.replace(/\D/g, '').length > 0) {
      if (!validatePhone(settings.phone)) {
        toast.error('Telefone inválido. Informe um número com DDD.');
        return;
      }
    }
    
    setSaving(true);
    try {
      await updateUnit.mutateAsync({
        id: settings.id,
        name: settings.name,
        cnpj: settings.cnpj,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
      });
      toast.success('Informações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar informações');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccessRules = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateUnit.mutateAsync({
        id: settings.id,
        allow_entry_if_overdue: settings.allow_entry_if_overdue,
        overdue_grace_days: settings.overdue_grace_days,
        inactivity_alert_days: settings.inactivity_alert_days,
      });
      toast.success('Regras de acesso salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar regras de acesso');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomization = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateUnit.mutateAsync({
        id: settings.id,
        primary_color: settings.primary_color,
        timezone: settings.timezone,
        font_family: settings.font_family,
        favicon_url: settings.favicon_url,
        dark_primary_color: settings.dark_primary_color,
        dark_background_color: settings.dark_background_color,
        dark_accent_color: settings.dark_accent_color,
      } as any);
      toast.success('Personalização salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar personalização');
    } finally {
      setSaving(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${settings.id}-favicon.${fileExt}`;
      const filePath = `favicons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateUnit.mutateAsync({
        id: settings.id,
        favicon_url: publicUrl,
      } as any);

      setSettings({ ...settings, favicon_url: publicUrl });
      toast.success('Favicon atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload do favicon');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${settings.id}-logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateUnit.mutateAsync({
        id: settings.id,
        logo_url: publicUrl,
      });

      setSettings({ ...settings, logo_url: publicUrl });
      toast.success('Logo atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setSaving(false);
    }
  };

  const updateOperatingHour = (index: number, field: keyof OperatingHours, value: string | boolean) => {
    const updated = [...operatingHours];
    updated[index] = { ...updated[index], [field]: value };
    setOperatingHours(updated);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Configurações" subtitle="Gerencie as configurações da sua academia" />
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!settings) {
    return (
      <AppLayout>
        <PageHeader title="Configurações" subtitle="Gerencie as configurações da sua academia" />
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma unidade encontrada</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie as configurações da sua academia"
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Acesso</span>
          </TabsTrigger>
          <TabsTrigger value="customization" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Personalização</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Academia</CardTitle>
              <CardDescription>Dados básicos da sua unidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Academia</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={settings.cnpj || ''}
                    onChange={(e) => setSettings({ ...settings, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={settings.cep}
                      onChange={async (e) => {
                        const formatted = formatCEP(e.target.value);
                        setSettings({ ...settings, cep: formatted });
                        
                        if (formatted.replace(/\D/g, '').length === 8) {
                          setLoadingCep(true);
                          const address = await fetchAddressByCEP(formatted);
                          setLoadingCep(false);
                          
                          if (address) {
                            const fullAddress = `${address.logradouro}, ${address.bairro}, ${address.localidade} - ${address.uf}`;
                            setSettings(prev => prev ? { ...prev, address: fullAddress } : prev);
                            toast.success('Endereço encontrado e preenchido automaticamente!');
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
                  <Input
                    id="address"
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="contato@academia.com"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>Configure os horários de abertura e fechamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {operatingHours.map((day, index) => (
                <div key={day.day} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-32">
                    <span className="font-medium text-sm">{day.dayLabel}</span>
                  </div>
                  <Switch
                    checked={day.isOpen}
                    onCheckedChange={(checked) => updateOperatingHour(index, 'isOpen', checked)}
                  />
                  <span className="text-sm text-muted-foreground w-16">
                    {day.isOpen ? 'Aberto' : 'Fechado'}
                  </span>
                  {day.isOpen && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={day.open}
                          onChange={(e) => updateOperatingHour(index, 'open', e.target.value)}
                          className="w-28"
                        />
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={day.close}
                          onChange={(e) => updateOperatingHour(index, 'close', e.target.value)}
                          className="w-28"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Horários
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Rules */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Acesso</CardTitle>
              <CardDescription>Configure as regras de entrada e alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <h4 className="font-medium">Permitir entrada com pagamento em atraso</h4>
                  <p className="text-sm text-muted-foreground">
                    Alunos com mensalidade atrasada poderão entrar na academia
                  </p>
                </div>
                <Switch
                  checked={settings.allow_entry_if_overdue}
                  onCheckedChange={(checked) => setSettings({ ...settings, allow_entry_if_overdue: checked })}
                />
              </div>

              {settings.allow_entry_if_overdue && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                  <Label htmlFor="graceDays">Dias de tolerância após vencimento</Label>
                  <Input
                    id="graceDays"
                    type="number"
                    min="0"
                    max="30"
                    value={settings.overdue_grace_days}
                    onChange={(e) => setSettings({ ...settings, overdue_grace_days: Number(e.target.value) })}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de dias após o vencimento que o aluno ainda poderá entrar
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inactivityDays">Alerta de inatividade (dias)</Label>
                <Input
                  id="inactivityDays"
                  type="number"
                  min="1"
                  max="90"
                  value={settings.inactivity_alert_days}
                  onChange={(e) => setSettings({ ...settings, inactivity_alert_days: Number(e.target.value) })}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Gerar alerta quando o aluno não frequentar a academia por este número de dias
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAccessRules} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Regras'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customization */}
        <TabsContent value="customization">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Logo da Academia</CardTitle>
                <CardDescription>Faça upload do logo da sua academia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Escolher arquivo
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG até 2MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favicon</CardTitle>
                <CardDescription>Ícone que aparece na aba do navegador</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                    {settings.favicon_url ? (
                      <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain" />
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="favicon-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Escolher arquivo
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="favicon-upload"
                      type="file"
                      accept="image/png,image/x-icon,image/svg+xml"
                      className="hidden"
                      onChange={handleFaviconUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-2">PNG, ICO ou SVG (32x32 recomendado)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalize as cores e configurações visuais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Cor Principal</Label>
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSettings({ ...settings, primary_color: color.value })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          settings.primary_color === color.value 
                            ? 'border-foreground scale-110' 
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={settings.timezone || 'America/Sao_Paulo'}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezoneOptions.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Tipografia
                </CardTitle>
                <CardDescription>Escolha a fonte da sua academia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Fonte Principal</Label>
                  <Select
                    value={settings.font_family || 'Inter'}
                    onValueChange={(value) => setSettings({ ...settings, font_family: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Prévia: <span style={{ fontFamily: settings.font_family || 'Inter' }}>Academia Boa Forma</span>
                  </p>
                </div>

              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Tema Escuro Personalizado
                </CardTitle>
                <CardDescription>Configure cores específicas para o modo escuro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label>Cor Principal (Escuro)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Se não definido, usa a cor principal do tema claro
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setSettings({ ...settings, dark_primary_color: null })}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                          !settings.dark_primary_color 
                            ? 'border-foreground scale-110' 
                            : 'border-border hover:scale-105'
                        }`}
                        title="Automático"
                      >
                        <span className="text-xs">Auto</span>
                      </button>
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSettings({ ...settings, dark_primary_color: color.value })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            settings.dark_primary_color === color.value 
                              ? 'border-foreground scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Cor de Fundo (Escuro)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Cor de fundo principal do tema escuro
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: '#0a0a0a', label: 'Preto Puro' },
                        { value: '#171717', label: 'Cinza Escuro' },
                        { value: '#1a1a2e', label: 'Azul Escuro' },
                        { value: '#1a1625', label: 'Roxo Escuro' },
                        { value: '#0f1419', label: 'Azul Marinho' },
                        { value: '#1c1917', label: 'Marrom Escuro' },
                      ].map((bg) => (
                        <button
                          key={bg.value}
                          onClick={() => setSettings({ ...settings, dark_background_color: bg.value })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            settings.dark_background_color === bg.value 
                              ? 'border-foreground scale-110' 
                              : 'border-border hover:scale-105'
                          }`}
                          style={{ backgroundColor: bg.value }}
                          title={bg.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Cor de Destaque (Escuro)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Cor secundária para elementos de destaque
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setSettings({ ...settings, dark_accent_color: null })}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                          !settings.dark_accent_color 
                            ? 'border-foreground scale-110' 
                            : 'border-border hover:scale-105'
                        }`}
                        title="Automático"
                      >
                        <span className="text-xs">Auto</span>
                      </button>
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSettings({ ...settings, dark_accent_color: color.value })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            settings.dark_accent_color === color.value 
                              ? 'border-foreground scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div 
                    className="p-6 space-y-4"
                    style={{ 
                      backgroundColor: settings.dark_background_color || '#0a0a0a',
                      color: '#ffffff'
                    }}
                  >
                    <p className="text-sm text-white/60">Prévia do tema escuro</p>
                    <div className="flex items-center gap-4">
                      <div 
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{ 
                          backgroundColor: settings.dark_primary_color || settings.primary_color || '#3B82F6'
                        }}
                      >
                        Botão Principal
                      </div>
                      <div 
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ 
                          backgroundColor: settings.dark_accent_color || (settings.dark_primary_color || settings.primary_color || '#3B82F6') + '20',
                          color: settings.dark_accent_color || settings.dark_primary_color || settings.primary_color || '#3B82F6'
                        }}
                      >
                        Destaque
                      </div>
                    </div>
                    <p style={{ fontFamily: settings.font_family || 'Inter' }}>
                      Academia Boa Forma - Texto de exemplo
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveCustomization} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Personalização'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
