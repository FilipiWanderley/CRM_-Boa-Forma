import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeads, type PipelineStatus } from '@/hooks/useLeads';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const statusColors: Record<string, string> = {
  lead: 'hsl(var(--info))',
  visita_agendada: 'hsl(var(--warning))',
  negociacao: 'hsl(var(--primary))',
  ativo: 'hsl(var(--success))',
  inativo: 'hsl(var(--muted-foreground))',
  cancelado: 'hsl(var(--destructive))',
};

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  visita_agendada: 'Visita',
  negociacao: 'Negociação',
  ativo: 'Ativo',
  inativo: 'Inativo',
  cancelado: 'Cancelado',
};

export function ConversionChart() {
  const { data: leads } = useLeads();

  const statusCounts = leads?.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const barData = Object.entries(statusCounts)
    .filter(([status]) => ['lead', 'visita_agendada', 'negociacao', 'ativo'].includes(status))
    .map(([status, count]) => ({
      name: statusLabels[status],
      value: count,
      status,
    }));

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status],
    value: count,
    status,
  }));

  const totalLeads = leads?.length || 0;
  const activeClients = statusCounts['ativo'] || 0;
  const conversionRate = totalLeads > 0 ? ((activeClients / totalLeads) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">{payload[0].value} leads</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[250px]">
            <div className="relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-[180px] h-[180px] rounded-full border-4 border-dashed border-muted flex items-center justify-center">
                  <span className="text-muted-foreground">Sem dados</span>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{conversionRate}%</span>
                <span className="text-xs text-muted-foreground">conversão</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{activeClients}</span> clientes ativos de{' '}
                <span className="font-semibold text-foreground">{totalLeads}</span> leads
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
