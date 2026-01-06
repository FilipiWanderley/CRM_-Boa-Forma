import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  address: string | null;
  birth_date: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string | null;
  features: string[] | null;
}

interface Unit {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface ContractGeneratorProps {
  lead: Lead;
  plan?: Plan | null;
  unit?: Unit | null;
}

export function ContractGenerator({ lead, plan, unit }: ContractGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateContract = async () => {
    setGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(unit?.name || 'Academia Boa Forma', pageWidth / 2, y, { align: 'center' });
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (unit?.cnpj) {
        doc.text(`CNPJ: ${unit.cnpj}`, pageWidth / 2, y, { align: 'center' });
        y += 5;
      }
      if (unit?.address) {
        doc.text(unit.address, pageWidth / 2, y, { align: 'center' });
        y += 5;
      }
      
      y += 10;
      
      // Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Contract Number
      const contractNumber = `CTR-${Date.now().toString(36).toUpperCase()}`;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contrato Nº: ${contractNumber}`, margin, y);
      doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth - margin, y, { align: 'right' });
      y += 15;

      // Parties
      doc.setFont('helvetica', 'bold');
      doc.text('1. DAS PARTES', margin, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      doc.text('CONTRATANTE:', margin, y);
      y += 5;
      doc.text(`Nome: ${lead.full_name}`, margin + 5, y);
      y += 5;
      if (lead.cpf) {
        doc.text(`CPF: ${lead.cpf}`, margin + 5, y);
        y += 5;
      }
      if (lead.address) {
        doc.text(`Endereço: ${lead.address}`, margin + 5, y);
        y += 5;
      }
      doc.text(`Telefone: ${lead.phone}`, margin + 5, y);
      y += 5;
      if (lead.email) {
        doc.text(`E-mail: ${lead.email}`, margin + 5, y);
        y += 5;
      }
      y += 5;

      doc.text('CONTRATADA:', margin, y);
      y += 5;
      doc.text(`Razão Social: ${unit?.name || 'Academia Boa Forma'}`, margin + 5, y);
      y += 5;
      if (unit?.cnpj) {
        doc.text(`CNPJ: ${unit.cnpj}`, margin + 5, y);
        y += 5;
      }
      if (unit?.address) {
        doc.text(`Endereço: ${unit.address}`, margin + 5, y);
        y += 5;
      }
      y += 10;

      // Plan Details (if available)
      if (plan) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('2. DO PLANO CONTRATADO', margin, y);
        y += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Plano: ${plan.name}`, margin + 5, y);
        y += 5;
        doc.text(`Valor: R$ ${plan.price.toFixed(2)}`, margin + 5, y);
        y += 5;
        doc.text(`Duração: ${plan.duration_days} dias`, margin + 5, y);
        y += 5;
        
        if (plan.features && plan.features.length > 0) {
          doc.text('Benefícios inclusos:', margin + 5, y);
          y += 5;
          plan.features.forEach((feature) => {
            doc.text(`• ${feature}`, margin + 10, y);
            y += 5;
          });
        }
        y += 5;
      }

      // Terms
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(plan ? '3. DAS CONDIÇÕES GERAIS' : '2. DAS CONDIÇÕES GERAIS', margin, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const terms = [
        'a) O CONTRATANTE declara estar em boas condições de saúde para a prática de atividades físicas;',
        'b) O CONTRATANTE compromete-se a respeitar as normas internas do estabelecimento;',
        'c) A CONTRATADA reserva-se o direito de alterar horários e atividades mediante aviso prévio;',
        'd) O pagamento deve ser efetuado até a data de vencimento, sob pena de suspensão do acesso;',
        'e) O cancelamento deve ser solicitado com antecedência mínima de 30 dias;',
        'f) A CONTRATADA não se responsabiliza por objetos pessoais deixados nas dependências.',
      ];
      
      terms.forEach((term) => {
        const lines = doc.splitTextToSize(term, contentWidth - 10);
        lines.forEach((line: string) => {
          doc.text(line, margin + 5, y);
          y += 5;
        });
      });
      y += 10;

      // LGPD
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(plan ? '4. DO TRATAMENTO DE DADOS (LGPD)' : '3. DO TRATAMENTO DE DADOS (LGPD)', margin, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lgpdText = 'O CONTRATANTE autoriza a coleta e tratamento de seus dados pessoais para fins de prestação dos serviços contratados, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Os dados serão utilizados exclusivamente para gestão do relacionamento comercial e não serão compartilhados com terceiros sem consentimento expresso.';
      const lgpdLines = doc.splitTextToSize(lgpdText, contentWidth - 5);
      lgpdLines.forEach((line: string) => {
        doc.text(line, margin + 5, y);
        y += 5;
      });
      y += 15;

      // Signatures
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(plan ? '5. DAS ASSINATURAS' : '4. DAS ASSINATURAS', margin, y);
      y += 15;

      const sigWidth = (contentWidth - 20) / 2;
      
      // Contratante signature
      doc.line(margin, y, margin + sigWidth, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('CONTRATANTE', margin + sigWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(lead.full_name, margin + sigWidth / 2, y, { align: 'center' });
      
      // Contratada signature
      const x2 = margin + sigWidth + 20;
      doc.line(x2, y - 9, x2 + sigWidth, y - 9);
      doc.text('CONTRATADA', x2 + sigWidth / 2, y - 4, { align: 'center' });
      doc.text(unit?.name || 'Academia Boa Forma', x2 + sigWidth / 2, y, { align: 'center' });

      y += 15;
      doc.setFontSize(8);
      doc.text(`Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: 'center' });

      // Save
      const fileName = `contrato_${lead.full_name.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);

      toast({
        title: 'Contrato gerado!',
        description: 'O PDF foi baixado com sucesso.',
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: 'Erro ao gerar contrato',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Gerar Contrato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Contrato</DialogTitle>
          <DialogDescription>
            Será gerado um contrato PDF com os dados do cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium">Dados do Cliente</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Nome:</strong> {lead.full_name}</p>
              <p><strong>Telefone:</strong> {lead.phone}</p>
              {lead.email && <p><strong>E-mail:</strong> {lead.email}</p>}
              {lead.cpf && <p><strong>CPF:</strong> {lead.cpf}</p>}
            </div>
          </div>

          {plan && (
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">Plano Selecionado</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Plano:</strong> {plan.name}</p>
                <p><strong>Valor:</strong> R$ {plan.price.toFixed(2)}</p>
                <p><strong>Duração:</strong> {plan.duration_days} dias</p>
              </div>
            </div>
          )}

          {!plan && (
            <p className="text-sm text-muted-foreground">
              Nenhum plano selecionado. O contrato será gerado sem detalhes de plano.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={generateContract} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
