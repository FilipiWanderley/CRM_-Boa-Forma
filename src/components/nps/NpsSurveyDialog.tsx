import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNps } from '@/hooks/useNps';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export function NpsSurveyDialog() {
  const { shouldShowNps, submitSurvey } = useNps();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (shouldShowNps) {
      // Pequeno delay para não assustar o usuário assim que entra (3 segundos)
      const timer = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowNps]);

  const handleSubmit = async () => {
    if (score === null) return;

    try {
      await submitSurvey.mutateAsync({ score, comment });
      toast({
        title: "Obrigado pelo feedback!",
        description: "Sua opinião é fundamental para melhorarmos.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const getScoreColor = (value: number) => {
    if (value <= 6) return "hover:bg-red-100 hover:text-red-600 border-red-200";
    if (value <= 8) return "hover:bg-yellow-100 hover:text-yellow-600 border-yellow-200";
    return "hover:bg-green-100 hover:text-green-600 border-green-200";
  };
  
  const getSelectedColor = (value: number) => {
      if (value <= 6) return "bg-red-500 text-white hover:bg-red-600 border-red-500";
      if (value <= 8) return "bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500";
      return "bg-green-500 text-white hover:bg-green-600 border-green-500";
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
            <Star className="h-8 w-8 text-primary fill-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Como está sendo sua experiência?</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Em uma escala de 0 a 10, o quanto você recomendaria a <strong>Boa Forma</strong> para um amigo ou familiar?
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {Array.from({ length: 11 }).map((_, i) => (
              <Button
                key={i}
                variant="outline"
                className={cn(
                  "h-10 w-10 p-0 transition-all font-bold",
                  score === i 
                    ? getSelectedColor(i)
                    : getScoreColor(i)
                )}
                onClick={() => setScore(i)}
              >
                {i}
              </Button>
            ))}
          </div>
          <div className="flex justify-between px-4 text-xs text-muted-foreground mt-2 font-medium">
            <span className="text-red-500">Não recomendaria</span>
            <span className="text-green-600">Com certeza recomendaria</span>
          </div>

          {score !== null && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
              <Label htmlFor="comment" className="mb-2 block">
                O que motivou sua nota? (Opcional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Conte-nos mais sobre sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Agora não
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={score === null || submitSurvey.isPending}
            className="w-full sm:w-auto"
          >
            {submitSurvey.isPending ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
