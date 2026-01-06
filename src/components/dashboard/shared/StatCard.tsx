import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: React.ReactNode;
  loading?: boolean;
  href?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function StatCard({ title, value, change, subtitle, icon, loading, href, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-primary/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-red-500/10',
    info: 'bg-blue-500/10',
  };
  
  const iconColors = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  };
  
  return (
    <Card className="bg-card border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${variantStyles[variant]}`}>
            <div className={iconColors[variant]}>{icon}</div>
          </div>
          {href && (
            <Link to={href} className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <div className={`flex items-center gap-0.5 text-xs font-medium ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}
        {subtitle && !change && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
