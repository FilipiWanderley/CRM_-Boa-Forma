import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUnits, useCreateUnit, useUpdateUnit, useToggleUnitStatus, type Unit } from '@/hooks/useUnits';
import { Building2, Plus, Phone, Mail, MapPin, Edit, CheckCircle2, XCircle } from 'lucide-react';

function UnitDialog({ unit, trigger }: { unit?: Unit; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    cnpj: unit?.cnpj || '',
    address: unit?.address || '',
    phone: unit?.phone || '',
    email: unit?.email || '',
  });

  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (unit) {
      await updateUnit.mutateAsync({ id: unit.id, ...formData });
    } else {
      await createUnit.mutateAsync(formData);
    }

    setOpen(false);
    if (!unit) {
      setFormData({ name: '', cnpj: '', address: '', phone: '', email: '' });
    }
  };

  const isLoading = createUnit.isPending || updateUnit.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{unit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
          <DialogDescription>
            {unit ? 'Atualize as informações da unidade' : 'Cadastre uma nova unidade/academia'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Unidade *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Boa Forma - Centro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@academia.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Salvando...' : unit ? 'Salvar' : 'Criar Unidade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Units() {
  const { data: units, isLoading } = useUnits();
  const toggleStatus = useToggleUnitStatus();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Unidades
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as academias/unidades do sistema
            </p>
          </div>
          <UnitDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Unidade
              </Button>
            }
          />
        </div>

        {/* Units Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : units && units.length > 0 ? (
            units.map((unit) => (
              <Card key={unit.id} className={unit.is_active ? '' : 'opacity-60'}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{unit.name}</CardTitle>
                        {unit.cnpj && (
                          <CardDescription>{unit.cnpj}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant={unit.is_active ? 'default' : 'secondary'} className="shrink-0">
                      {unit.is_active ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativa</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Inativa</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unit.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{unit.address}</span>
                    </div>
                  )}
                  {unit.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{unit.phone}</span>
                    </div>
                  )}
                  {unit.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{unit.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={unit.is_active ?? true}
                        onCheckedChange={(checked) => toggleStatus.mutate({ id: unit.id, is_active: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {unit.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <UnitDialog
                      unit={unit}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhuma unidade cadastrada</p>
                <p className="text-sm text-muted-foreground">Crie a primeira unidade para começar</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
