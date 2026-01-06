import { ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableRowItemProps {
  avatar?: {
    name: string;
    image?: string;
  };
  columns: ReactNode[];
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRowItem({ avatar, columns, badge, onClick, className }: TableRowItemProps) {
  const initials = avatar?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '';

  return (
    <div 
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {avatar && (
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      {columns.map((column, index) => (
        <div key={index} className="flex-1 min-w-0">
          {column}
        </div>
      ))}
      {badge}
      <button className="text-muted-foreground hover:text-foreground transition-colors">
        <MoreVertical className="h-5 w-5" />
      </button>
    </div>
  );
}
