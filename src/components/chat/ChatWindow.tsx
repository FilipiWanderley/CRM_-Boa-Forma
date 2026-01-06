import { MessageCircle, User } from 'lucide-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatRoom, useChatMessages } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

interface ChatWindowProps {
  room: ChatRoom | null;
}

export const ChatWindow = ({ room }: ChatWindowProps) => {
  const { hasRole } = useAuth();
  const isAluno = hasRole('aluno');
  const isProfessor = hasRole('professor');
  
  const { messages, isLoading, sendMessage, isSending } = useChatMessages(room?.id || null);

  const senderType = isAluno ? 'aluno' : 'professor';
  const displayName = isAluno ? room?.professor?.full_name : room?.lead?.full_name;

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageCircle className="h-16 w-16 mb-4" />
        <p className="text-lg">Selecione uma conversa para começar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{displayName || 'Usuário'}</p>
          <p className="text-xs text-muted-foreground">
            {isAluno ? 'Professor' : 'Aluno'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ChatMessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={(content) => sendMessage({ content, senderType })}
        isSending={isSending}
      />
    </div>
  );
};
