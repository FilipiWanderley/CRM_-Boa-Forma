import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DataTableProps {
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function DataTable({
  title,
  description,
  searchPlaceholder = 'Buscar...',
  searchValue,
  onSearchChange,
  children,
  actions,
}: DataTableProps) {
  return (
    <Card className="border border-border/50">
      {(title || onSearchChange) && (
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-3">
              {onSearchChange && (
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              )}
              {actions}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={title || onSearchChange ? "pt-0" : "p-0"}>
        {children}
      </CardContent>
    </Card>
  );
}
