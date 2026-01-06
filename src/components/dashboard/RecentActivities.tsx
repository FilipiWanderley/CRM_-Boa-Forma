import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityLogs, ENTITY_TYPES, ACTION_TYPES } from '@/hooks/useActivityLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ArrowUpRight, History, User, FileText, DollarSign, Calendar, Dumbbell, LogIn, LogOut, UserPlus, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'lead':
      return <User className="h-4 w-4" />;
    case 'invoice':
    case 'payment':
    case 'subscription':
      return <DollarSign className="h-4 w-4" />;
    case 'contract':
      return <FileText className="h-4 w-4" />;
    case 'appointment':
      return <Calendar className="h-4 w-4" />;
    case 'workout':
      return <Dumbbell className="h-4 w-4" />;
    case 'auth':
      return <LogIn className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'create':
      return <UserPlus className="h-3.5 w-3.5" />;
    case 'update':
      return <Edit className="h-3.5 w-3.5" />;
    case 'delete':
      return <Trash2 className="h-3.5 w-3.5" />;
    case 'login':
      return <LogIn className="h-3.5 w-3.5" />;
    case 'logout':
      return <LogOut className="h-3.5 w-3.5" />;
    default:
      return null;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'create':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    case 'update':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    case 'delete':
      return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'login':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'logout':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    case 'status_change':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getEntityLabel = (entityType: string) => {
  return ENTITY_TYPES.find(e => e.value === entityType)?.label || entityType;
};

const getActionLabel = (action: string) => {
  return ACTION_TYPES.find(a => a.value === action)?.label || action;
};

export function RecentActivities() {
  const { data: activities, isLoading } = useActivityLogs({ limit: 10 });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Atividades Recentes</CardTitle>
          </div>
          <Link 
            to="/activity-logs" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Ver todas
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {getEntityIcon(activity.entity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getActionColor(activity.action)}`}>
                    <span className="flex items-center gap-1">
                      {getActionIcon(activity.action)}
                      {getActionLabel(activity.action)}
                    </span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma atividade registrada ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}