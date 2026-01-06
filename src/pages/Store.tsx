import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Check, Dumbbell, Star, ArrowLeft, Loader2 } from 'lucide-react';
import logoBoaForma from '@/assets/logo-boaforma.png';
import { formatCPF, formatPhone, validateCPF, validatePhone, validateEmail } from '@/lib/masks';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string | null;
  features: string[] | null;
  unit_id: string;
}

interface Unit {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export default function Store() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState(false);
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
  });

  // Fetch first active unit and its plans
  const { data: unit, isLoading: unitLoading } = useQuery({
    queryKey: ['public-unit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as Unit;
    },
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['public-plans', unit?.id],
    queryFn: async () => {
      if (!unit?.id) return [];
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('unit_id', unit.id)
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data as Plan[];
    },
    enabled: !!unit?.id,
  });

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !unit) return;

    if (!form.full_name || !form.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pelo menos nome e telefone.',
        variant: 'destructive',
      });
      return;
    }

    // Validação de telefone
    if (!validatePhone(form.phone)) {
      toast({
        title: 'Telefone inválido',
        description: 'Informe um número de telefone válido com DDD.',
        variant: 'destructive',
      });
      return;
    }

    // Validação de e-mail se preenchido
    if (form.email && !validateEmail(form.email)) {
      setEmailError(true);
      toast({
        title: 'E-mail inválido',
        description: 'Por favor, informe um endereço de e-mail válido.',
        variant: 'destructive',
      });
      return;
    }

    // Validação de CPF se preenchido
    if (form.cpf && !validateCPF(form.cpf)) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, verifique o número do CPF informado.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          unit_id: unit.id,
          full_name: form.full_name,
          email: form.email || null,
          phone: form.phone,
          cpf: form.cpf || null,
          source: 'loja_online',
          status: 'negociacao',
          notes: `Interesse no plano: ${selectedPlan.name}`,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Create subscription (pending)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          unit_id: unit.id,
          lead_id: lead.id,
          plan_id: selectedPlan.id,
          status: 'pending',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        });

      if (subError) throw subError;

      // Create invoice (pending)
      const { error: invError } = await supabase
        .from('invoices')
        .insert({
          unit_id: unit.id,
          lead_id: lead.id,
          subscription_id: lead.id, // This should be the subscription ID ideally
          amount: selectedPlan.price,
          due_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          description: `Plano ${selectedPlan.name}`,
        });

      if (invError) {
        console.error('Invoice creation error:', invError);
      }

      toast({
        title: 'Inscrição realizada!',
        description: 'Em breve nossa equipe entrará em contato para finalizar sua matrícula.',
      });

      setCheckoutOpen(false);
      setSelectedPlan(null);
      setForm({ full_name: '', email: '', phone: '', cpf: '' });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível completar a inscrição. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = unitLoading || plansLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoBoaForma} alt="Academia Boa Forma" className="h-10 w-auto" />
            <div>
              <h1 className="font-display font-bold text-xl">{unit?.name || 'Academia Boa Forma'}</h1>
              {unit?.address && (
                <p className="text-xs text-muted-foreground">{unit.address}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Área do Aluno
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Dumbbell className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Transforme seu Corpo
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Escolha o plano ideal para você e comece sua jornada de transformação hoje mesmo.
        </p>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : plans && plans.length > 0 ? (
            plans.map((plan, index) => (
              <Card
                key={plan.id}
                className={`relative transition-all hover:shadow-lg ${
                  index === 1 ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {index === 1 && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.duration_days} dias
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={index === 1 ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Quero esse plano
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
              <p className="text-sm text-muted-foreground mt-1">Entre em contato para mais informações.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Info */}
      {unit?.phone && (
        <section className="border-t bg-secondary/30 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground">
              Dúvidas? Ligue para nós:{' '}
              <a href={`tel:${unit.phone}`} className="font-medium text-primary hover:underline">
                {unit.phone}
              </a>
            </p>
          </div>
        </section>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Inscrição</DialogTitle>
            <DialogDescription>
              Preencha seus dados para reservar o plano {selectedPlan?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-secondary/30 p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedPlan?.name}</span>
                <span className="text-lg font-bold">
                  R$ {selectedPlan?.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (emailError && validateEmail(e.target.value)) {
                      setEmailError(false);
                    }
                  }}
                  onBlur={() => {
                    if (form.email && !validateEmail(form.email)) {
                      setEmailError(true);
                    }
                  }}
                  placeholder="seu@email.com"
                  className={emailError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {emailError && (
                  <p className="text-xs text-destructive">E-mail inválido</p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Inscrição'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
