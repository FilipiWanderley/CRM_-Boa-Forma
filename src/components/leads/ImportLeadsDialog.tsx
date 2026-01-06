import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatPhone, formatCPF, validateCPF, validateEmail, validatePhone } from '@/lib/masks';
import { useQueryClient } from '@tanstack/react-query';

interface ImportLeadsDialogProps {
  trigger?: React.ReactNode;
}

interface ParsedRow {
  [key: string]: string;
}

interface ImportResult {
  success: number;
  errors: { row: number; message: string }[];
}

const FIELD_OPTIONS = [
  { value: 'full_name', label: 'Nome Completo' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'cpf', label: 'CPF' },
  { value: 'birth_date', label: 'Data de Nascimento' },
  { value: 'gender', label: 'Gênero' },
  { value: 'address', label: 'Endereço' },
  { value: 'source', label: 'Origem' },
  { value: 'notes', label: 'Observações' },
  { value: 'skip', label: '(Ignorar coluna)' },
];

const DEFAULT_UNIT_ID = 'a0000000-0000-0000-0000-000000000001';

export function ImportLeadsDialog({ trigger }: ImportLeadsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'results'>('upload');
  const [fileName, setFileName] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [allData, setAllData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult | null>(null);

  const resetState = () => {
    setStep('upload');
    setFileName('');
    setColumns([]);
    setMappings({});
    setPreviewData([]);
    setAllData([]);
    setImporting(false);
    setProgress(0);
    setResults(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { header: 'A' });

      if (jsonData.length < 2) {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados suficientes.',
          variant: 'destructive',
        });
        return;
      }

      // First row as headers
      const headerRow = jsonData[0];
      const headers = Object.values(headerRow).map(String);
      setColumns(headers);

      // Auto-map columns based on header names
      const autoMappings: Record<string, string> = {};
      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase().trim();
        const colKey = Object.keys(headerRow)[index];
        
        if (headerLower.includes('nome')) autoMappings[colKey] = 'full_name';
        else if (headerLower.includes('telefone') || headerLower.includes('celular') || headerLower.includes('phone')) autoMappings[colKey] = 'phone';
        else if (headerLower.includes('email') || headerLower.includes('e-mail')) autoMappings[colKey] = 'email';
        else if (headerLower.includes('cpf')) autoMappings[colKey] = 'cpf';
        else if (headerLower.includes('nascimento') || headerLower.includes('birth')) autoMappings[colKey] = 'birth_date';
        else if (headerLower.includes('gênero') || headerLower.includes('genero') || headerLower.includes('sexo')) autoMappings[colKey] = 'gender';
        else if (headerLower.includes('endereço') || headerLower.includes('endereco') || headerLower.includes('address')) autoMappings[colKey] = 'address';
        else if (headerLower.includes('origem') || headerLower.includes('source')) autoMappings[colKey] = 'source';
        else if (headerLower.includes('obs') || headerLower.includes('nota')) autoMappings[colKey] = 'notes';
        else autoMappings[colKey] = 'skip';
      });
      setMappings(autoMappings);

      // Data rows (skip header)
      const dataRows = jsonData.slice(1);
      setAllData(dataRows);
      setPreviewData(dataRows.slice(0, 5));
      setStep('mapping');
    } catch (error) {
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível processar o arquivo. Verifique se é um CSV ou Excel válido.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    // Validate mappings
    const hasName = Object.values(mappings).includes('full_name');
    const hasPhone = Object.values(mappings).includes('phone');

    if (!hasName || !hasPhone) {
      toast({
        title: 'Mapeamento incompleto',
        description: 'É necessário mapear pelo menos Nome e Telefone.',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImporting(true);

    const importResults: ImportResult = { success: 0, errors: [] };
    const total = allData.length;

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      setProgress(Math.round(((i + 1) / total) * 100));

      try {
        // Build lead object from mappings
        const leadData: Record<string, string | undefined> = {};
        
        Object.entries(mappings).forEach(([colKey, field]) => {
          if (field !== 'skip' && row[colKey]) {
            let value = String(row[colKey]).trim();
            
            // Format values
            if (field === 'phone') value = formatPhone(value);
            if (field === 'cpf') value = formatCPF(value);
            if (field === 'email') value = value.toLowerCase();
            
            leadData[field] = value;
          }
        });

        // Validate required fields
        if (!leadData.full_name || leadData.full_name.length < 2) {
          importResults.errors.push({ row: i + 2, message: 'Nome inválido ou vazio' });
          continue;
        }

        if (!leadData.phone || !validatePhone(leadData.phone)) {
          importResults.errors.push({ row: i + 2, message: 'Telefone inválido' });
          continue;
        }

        // Validate optional fields
        if (leadData.email && !validateEmail(leadData.email)) {
          importResults.errors.push({ row: i + 2, message: 'E-mail inválido' });
          continue;
        }

        if (leadData.cpf && !validateCPF(leadData.cpf)) {
          importResults.errors.push({ row: i + 2, message: 'CPF inválido' });
          continue;
        }

        // Check for duplicates
        const { data: existingPhone } = await supabase
          .from('leads')
          .select('id')
          .eq('phone', leadData.phone)
          .maybeSingle();

        if (existingPhone) {
          importResults.errors.push({ row: i + 2, message: 'Telefone já cadastrado' });
          continue;
        }

        if (leadData.cpf) {
          const { data: existingCpf } = await supabase
            .from('leads')
            .select('id')
            .eq('cpf', leadData.cpf)
            .maybeSingle();

          if (existingCpf) {
            importResults.errors.push({ row: i + 2, message: 'CPF já cadastrado' });
            continue;
          }
        }

        if (leadData.email) {
          const { data: existingEmail } = await supabase
            .from('leads')
            .select('id')
            .eq('email', leadData.email)
            .maybeSingle();

          if (existingEmail) {
            importResults.errors.push({ row: i + 2, message: 'E-mail já cadastrado' });
            continue;
          }
        }

        // Insert lead
        const { error } = await supabase.from('leads').insert({
          full_name: leadData.full_name,
          phone: leadData.phone,
          email: leadData.email || null,
          cpf: leadData.cpf || null,
          birth_date: leadData.birth_date || null,
          gender: leadData.gender || null,
          address: leadData.address || null,
          source: leadData.source || null,
          notes: leadData.notes || null,
          unit_id: DEFAULT_UNIT_ID,
          status: 'lead',
        });

        if (error) {
          importResults.errors.push({ row: i + 2, message: error.message });
        } else {
          importResults.success++;
        }
      } catch (error) {
        importResults.errors.push({ row: i + 2, message: 'Erro desconhecido' });
      }
    }

    setResults(importResults);
    setImporting(false);
    setStep('results');
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Leads
          </DialogTitle>
          <DialogDescription>
            Importe leads de um arquivo CSV ou Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Clique para selecionar ou arraste um arquivo
              </p>
              <p className="text-xs text-muted-foreground">
                Suporta CSV e Excel (.xlsx, .xls)
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Formato esperado:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Primeira linha com cabeçalhos (Nome, Telefone, E-mail, etc.)</li>
                <li>Campos obrigatórios: Nome e Telefone</li>
                <li>Campos opcionais: CPF, E-mail, Data de Nascimento, Endereço, etc.</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">{allData.length} registros encontrados</p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetState}>
                Trocar arquivo
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-3">
                <p className="text-sm font-medium mb-3">Mapeamento de colunas:</p>
                {columns.map((col, index) => {
                  const colKey = Object.keys(previewData[0] || {})[index];
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 text-sm truncate bg-muted/50 px-3 py-2 rounded">
                        {col}
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={mappings[colKey] || 'skip'}
                        onValueChange={(v) => setMappings({ ...mappings, [colKey]: v })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleImport}>
                Importar {allData.length} leads
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <p className="font-medium">Importando leads...</p>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{progress}% concluído</p>
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold text-success">{results.success}</p>
                <p className="text-sm text-muted-foreground">Importados com sucesso</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-2xl font-bold text-destructive">{results.errors.length}</p>
                <p className="text-sm text-muted-foreground">Erros encontrados</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium mb-2">Detalhes dos erros:</p>
                  {results.errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        Linha {err.row}
                      </Badge>
                      <span className="text-muted-foreground">{err.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
