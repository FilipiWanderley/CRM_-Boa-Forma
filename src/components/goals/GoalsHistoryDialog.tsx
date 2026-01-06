import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archive, FolderOpen } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { ArchivedGoalCard } from './ArchivedGoalCard';
import { Skeleton } from '@/components/ui/skeleton';

export function GoalsHistoryDialog() {
  const [open, setOpen] = useState(false);
  const { archivedGoals, isLoadingArchived } = useGoals();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Archive className="h-4 w-4" />
          Histórico
          {archivedGoals.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
              {archivedGoals.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Histórico de Metas
          </DialogTitle>
        </DialogHeader>
        
        {isLoadingArchived ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : archivedGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma meta arquivada
            </h3>
            <p className="text-sm text-muted-foreground">
              Metas arquivadas aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {archivedGoals.map((goal) => (
                <ArchivedGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
