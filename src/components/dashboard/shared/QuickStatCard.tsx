import { Card, CardContent } from '@/components/ui/card';

export interface QuickStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant: 'success' | 'warning' | 'primary' | 'danger' | 'info';
  loading?: boolean;
}

export function QuickStatCard({ title, value, icon, variant, loading }: QuickStatCardProps) {
  const gradients = {
    success: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    warning: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
    primary: 'from-primary/10 to-primary/5 border-primary/20',
    danger: 'from-red-500/10 to-red-600/5 border-red-500/20',
    info: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
  };

  const iconBg = {
    success: 'bg-emerald-500/20',
    warning: 'bg-amber-500/20',
    primary: 'bg-primary/20',
    danger: 'bg-red-500/20',
    info: 'bg-blue-500/20',
  };

  const iconColor = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    primary: 'text-primary',
    danger: 'text-red-500',
    info: 'text-blue-500',
  };

  return (
    <Card className={`bg-gradient-to-br ${gradients[variant]}`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-full ${iconBg[variant]}`}>
          <div className={iconColor[variant]}>{icon}</div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-xl font-bold text-foreground">
            {loading ? '...' : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
