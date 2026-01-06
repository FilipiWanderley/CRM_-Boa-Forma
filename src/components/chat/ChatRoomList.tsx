import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChatRoom } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  isLoading: boolean;
}

export const ChatRoomList = ({ rooms, selectedRoomId, onSelectRoom, isLoading }: ChatRoomListProps) => {
  const { hasRole } = useAuth();
  const isAluno = hasRole('aluno');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <MessageCircle className="h-12 w-12 mb-2" />
        <p className="text-center">Nenhuma conversa ainda</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {rooms.map((room) => {
          const displayName = isAluno ? room.professor?.full_name : room.lead?.full_name;
          const unreadCount = room.unread_count || 0;
          
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                selectedRoomId === room.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <div className="relative flex-shrink-0 h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                <User className="h-5 w-5" />
                {unreadCount > 0 && selectedRoomId !== room.id && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                    variant="destructive"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'truncate',
                    unreadCount > 0 && selectedRoomId !== room.id ? 'font-bold' : 'font-medium'
                  )}>
                    {displayName || 'Usuário'}
                  </p>
                </div>
                <p className={cn(
                  'text-xs',
                  selectedRoomId === room.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}>
                  {format(new Date(room.updated_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};
