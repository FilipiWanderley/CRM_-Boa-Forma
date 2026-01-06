import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, isSending, disabled }: ChatInputProps) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim() || isSending || disabled) return;
    onSend(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t bg-background">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite sua mensagem..."
        className="min-h-[44px] max-h-32 resize-none"
        disabled={disabled || isSending}
      />
      <Button
        onClick={handleSend}
        disabled={!content.trim() || isSending || disabled}
        size="icon"
        className="flex-shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
