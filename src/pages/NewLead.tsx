import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCreateLead } from '@/hooks/useLeads';
import { LeadForm, LeadFormData } from '@/components/leads/LeadForm';

export default function NewLead() {
  const navigate = useNavigate();
  const createLead = useCreateLead();

  const handleSubmit = (data: LeadFormData) => {
    createLead.mutate(data, { onSuccess: () => navigate('/leads') });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Novo Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
              isSubmitting={createLead.isPending}
              submitLabel="Cadastrar Lead"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
