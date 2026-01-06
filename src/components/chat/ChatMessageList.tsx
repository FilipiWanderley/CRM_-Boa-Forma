import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatMessageList = ({ messages, isLoading }: ChatMessageListProps) => {
  const { profile } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Nenhuma mensagem ainda. Comece a conversa!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === profile?.id;
          
          return (
            <div
              key={message.id}
              className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2',
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary text-secondary-foreground rounded-bl-md'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
