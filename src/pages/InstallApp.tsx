import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, Share, MoreVertical, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="card-fitness max-w-sm w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">App Instalado!</h1>
            <p className="text-muted-foreground">
              O app Boa Forma já está instalado no seu dispositivo. Acesse pela tela inicial.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/30">
            <Smartphone className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">Instalar App</h1>
          <p className="text-muted-foreground mt-2">
            Instale o app Boa Forma no seu celular para acesso rápido aos seus treinos
          </p>
        </div>

        {/* Benefits */}
        <Card className="card-fitness">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Acesso Offline</p>
                <p className="text-sm text-muted-foreground">Funciona sem internet</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Tela Cheia</p>
                <p className="text-sm text-muted-foreground">Experiência de app nativo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install Instructions */}
        {isIOS ? (
          <Card className="card-fitness">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Como instalar no iPhone:</h3>
              <ol className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>Toque no botão <Share className="inline h-4 w-4" /> Compartilhar na barra inferior do Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span>Role para baixo e toque em "Adicionar à Tela de Início"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>Toque em "Adicionar" no canto superior direito</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button 
            onClick={handleInstall} 
            className="w-full h-14 text-lg rounded-2xl"
          >
            <Download className="h-5 w-5 mr-2" />
            Instalar Agora
          </Button>
        ) : (
          <Card className="card-fitness">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Como instalar no Android:</h3>
              <ol className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>Toque no menu <MoreVertical className="inline h-4 w-4" /> do navegador (três pontos)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>Confirme a instalação</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Back to app */}
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => window.location.href = '/meu-app'}
        >
          Voltar para o App
        </Button>
      </div>
    </div>
  );
}
