import * as XLSX from 'xlsx';
import { Lead, getStatusLabel } from '@/hooks/useLeads';
import { format } from 'date-fns';

interface ExportOptions {
  format: 'csv' | 'xlsx';
  filename?: string;
}

const COLUMN_HEADERS = {
  full_name: 'Nome Completo',
  phone: 'Telefone',
  email: 'E-mail',
  cpf: 'CPF',
  birth_date: 'Data de Nascimento',
  gender: 'Gênero',
  address: 'Endereço',
  source: 'Origem',
  status: 'Status',
  notes: 'Observações',
  created_at: 'Data de Cadastro',
};

export function exportLeads(leads: Lead[], options: ExportOptions) {
  const { format: exportFormat, filename } = options;
  
  // Transform leads data for export
  const exportData = leads.map((lead) => ({
    [COLUMN_HEADERS.full_name]: lead.full_name,
    [COLUMN_HEADERS.phone]: lead.phone,
    [COLUMN_HEADERS.email]: lead.email || '',
    [COLUMN_HEADERS.cpf]: lead.cpf || '',
    [COLUMN_HEADERS.birth_date]: lead.birth_date 
      ? format(new Date(lead.birth_date), 'dd/MM/yyyy') 
      : '',
    [COLUMN_HEADERS.gender]: lead.gender || '',
    [COLUMN_HEADERS.address]: lead.address || '',
    [COLUMN_HEADERS.source]: lead.source || '',
    [COLUMN_HEADERS.status]: getStatusLabel(lead.status),
    [COLUMN_HEADERS.notes]: lead.notes || '',
    [COLUMN_HEADERS.created_at]: format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  // Auto-size columns
  const colWidths = Object.values(COLUMN_HEADERS).map((header) => ({
    wch: Math.max(
      header.length,
      ...exportData.map((row) => String(row[header] || '').length)
    ),
  }));
  worksheet['!cols'] = colWidths;

  // Generate filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const defaultFilename = `leads_${dateStr}`;
  const finalFilename = filename || defaultFilename;

  // Export based on format
  if (exportFormat === 'csv') {
    XLSX.writeFile(workbook, `${finalFilename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, `${finalFilename}.xlsx`, { bookType: 'xlsx' });
  }
}
