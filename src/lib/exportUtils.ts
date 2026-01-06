export type ExportData = Record<string, string | number | boolean | null | undefined>;

export function exportToCSV<T extends ExportData>(data: T[], filename: string, headers?: Record<string, string>) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = Object.keys(data[0]);
  
  // Create header row with translated headers if provided
  const headerRow = keys.map(key => headers?.[key] || key).join(',');
  
  // Create data rows
  const dataRows = data.map(row => 
    keys.map(key => {
      const value = row[key];
      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      return value ?? '';
    }).join(',')
  ).join('\n');

  const csvContent = `${headerRow}\n${dataRows}`;
  
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDateForExport(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function formatCurrencyForExport(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
