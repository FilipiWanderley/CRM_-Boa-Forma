import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickContactActionsProps {
  phone?: string | null;
  email?: string | null;
  leadName?: string;
  className?: string;
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove tudo exceto números
  const numbers = phone.replace(/\D/g, '');
  
  // Se não começar com 55, adiciona
  if (!numbers.startsWith('55')) {
    return `55${numbers}`;
  }
  return numbers;
}

export function QuickContactActions({ phone, email, leadName, className }: QuickContactActionsProps) {
  const handleCall = () => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleWhatsApp = () => {
    if (phone) {
      const formattedPhone = formatPhoneForWhatsApp(phone);
      const message = leadName 
        ? encodeURIComponent(`Olá ${leadName}! Aqui é da Boa Forma Academia.`)
        : '';
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (email) {
      const subject = encodeURIComponent('Boa Forma Academia');
      window.open(`mailto:${email}?subject=${subject}`, '_self');
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {phone && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="gap-2"
          >
            <Phone className="h-4 w-4" />
            Ligar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="gap-2 text-green-600 border-green-600/30 hover:bg-green-600/10 hover:text-green-600"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </>
      )}
      {email && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleEmail}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          E-mail
        </Button>
      )}
    </div>
  );
}
