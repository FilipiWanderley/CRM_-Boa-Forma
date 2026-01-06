import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  loading?: boolean;
  href?: string;
  linkText?: string;
}

export function StatCard({ title, value, change, icon, loading, href, linkText = 'Ver Relatório' }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <Card className="bg-card border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-primary/10">
            {icon}
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="text-3xl font-bold text-foreground">{value}</p>
        )}
        {(change !== undefined || href) && (
          <div className="flex items-center gap-2 mt-3">
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{isPositive ? '+' : ''}{change}%</span>
              </div>
            )}
            {href && (
              <Link to={href} className="text-sm text-primary hover:underline ml-auto">
                {linkText}
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
