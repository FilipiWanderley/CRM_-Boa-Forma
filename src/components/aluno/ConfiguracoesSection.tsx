import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Moon, 
  Sun, 
  Bell, 
  BellOff, 
  Smartphone,
  Mail,
  MessageSquare,
  Volume2,
  Vibrate,
  Shield,
  Palette
} from 'lucide-react';

export function ConfiguracoesSection() {
  const { toast } = useToast();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  // Notification states
  const [notificacoesTreino, setNotificacoesTreino] = useState(true);
  const [notificacoesFinanceiro, setNotificacoesFinanceiro] = useState(true);
  const [notificacoesPromocoes, setNotificacoesPromocoes] = useState(false);
  const [notificacoesMensagens, setNotificacoesMensagens] = useState(true);
  const [somNotificacoes, setSomNotificacoes] = useState(true);
  const [vibracaoNotificacoes, setVibracaoNotificacoes] = useState(true);

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    toast({
      title: newDarkMode ? 'Tema escuro ativado' : 'Tema claro ativado',
      description: 'Suas preferências foram salvas.',
    });
  };

  // Save notification preferences
  const handleNotificationChange = (type: string, value: boolean) => {
    switch (type) {
      case 'treino':
        setNotificacoesTreino(value);
        break;
      case 'financeiro':
        setNotificacoesFinanceiro(value);
        break;
      case 'promocoes':
        setNotificacoesPromocoes(value);
        break;
      case 'mensagens':
        setNotificacoesMensagens(value);
        break;
      case 'som':
        setSomNotificacoes(value);
        break;
      case 'vibracao':
        setVibracaoNotificacoes(value);
        break;
    }
    
    toast({
      title: 'Preferência atualizada',
      description: 'Suas configurações de notificação foram salvas.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Aparência */}
      <Card className="card-fitness">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet/20">
              <Palette className="h-5 w-5 text-violet" />
            </div>
            <div>
              <CardTitle className="text-lg">Aparência</CardTitle>
              <CardDescription>Personalize o visual do app</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-amber" />
              )}
              <div>
                <Label htmlFor="theme-toggle" className="text-base font-medium">
                  Tema Escuro
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isDarkMode ? 'Modo escuro ativado' : 'Modo claro ativado'}
                </p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={isDarkMode}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="card-fitness">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Notificações</CardTitle>
              <CardDescription>Gerencie seus alertas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Treino */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notif-treino" className="text-base font-medium">
                  Lembretes de Treino
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas sobre seus treinos
                </p>
              </div>
            </div>
            <Switch
              id="notif-treino"
              checked={notificacoesTreino}
              onCheckedChange={(v) => handleNotificationChange('treino', v)}
            />
          </div>

          <Separator />

          {/* Financeiro */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notif-financeiro" className="text-base font-medium">
                  Avisos Financeiros
                </Label>
                <p className="text-sm text-muted-foreground">
                  Faturas e vencimentos
                </p>
              </div>
            </div>
            <Switch
              id="notif-financeiro"
              checked={notificacoesFinanceiro}
              onCheckedChange={(v) => handleNotificationChange('financeiro', v)}
            />
          </div>

          <Separator />

          {/* Mensagens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notif-mensagens" className="text-base font-medium">
                  Mensagens
                </Label>
                <p className="text-sm text-muted-foreground">
                  Chat com professores
                </p>
              </div>
            </div>
            <Switch
              id="notif-mensagens"
              checked={notificacoesMensagens}
              onCheckedChange={(v) => handleNotificationChange('mensagens', v)}
            />
          </div>

          <Separator />

          {/* Promoções */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notif-promocoes" className="text-base font-medium">
                  Promoções e Novidades
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ofertas especiais da academia
                </p>
              </div>
            </div>
            <Switch
              id="notif-promocoes"
              checked={notificacoesPromocoes}
              onCheckedChange={(v) => handleNotificationChange('promocoes', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Som e Vibração */}
      <Card className="card-fitness">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber/20">
              <Volume2 className="h-5 w-5 text-amber" />
            </div>
            <div>
              <CardTitle className="text-lg">Som e Vibração</CardTitle>
              <CardDescription>Alertas sonoros e táteis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Som */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notif-som" className="text-base font-medium">
                  Som das Notificações
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas sonoros
                </p>
              </div>
            </div>
            <Switch
              id="notif-som"
              checked={somNotificacoes}
              onCheckedChange={(v) => handleNotificationChange('som', v)}
            />
          </div>

          <Separator />

          {/* Vibração */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notif-vibracao" className="text-base font-medium">
                  Vibração
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas por vibração
                </p>
              </div>
            </div>
            <Switch
              id="notif-vibracao"
              checked={vibracaoNotificacoes}
              onCheckedChange={(v) => handleNotificationChange('vibracao', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacidade */}
      <Card className="card-fitness">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/20">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg">Privacidade</CardTitle>
              <CardDescription>Seus dados estão protegidos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seus dados são armazenados com segurança e não são compartilhados com terceiros. 
            Para mais informações, entre em contato com a academia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}