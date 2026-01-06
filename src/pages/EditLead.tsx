import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadForm, LeadFormData } from '@/components/leads/LeadForm';
import { useLead, useUpdateLead } from '@/hooks/useLeads';
import { AppLayout } from '@/components/layout/AppLayout';

export default function EditLead() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useLead(id || '');
  const updateLead = useUpdateLead();

  const handleSubmit = (data: LeadFormData) => {
    if (!id) return;
    
    updateLead.mutate(
      {
        id,
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
          navigate(`/leads/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!lead) {
    return (
      <AppLayout>
        <div className="container max-w-2xl py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Lead não encontrado</p>
              <Button variant="link" onClick={() => navigate('/leads')}>
                Voltar para leads
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl py-8">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(`/leads/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Editar Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm
              leadId={id}
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
              onCancel={() => navigate(`/leads/${id}`)}
              isSubmitting={updateLead.isPending}
              submitLabel="Salvar Alterações"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
