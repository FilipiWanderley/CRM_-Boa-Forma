import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Dumbbell, GraduationCap, ClipboardList, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoBoaforma from '@/assets/logo-boaforma.png';
import gymHero from '@/assets/gym-hero.jpg';
import { Badge } from '@/components/ui/badge';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type StaffRole = 'professor' | 'recepcao' | 'gestor';

const roleConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  aluno: {
    label: 'Aluno',
    icon: GraduationCap,
    color: 'bg-info/20 text-info border-info/30',
    description: 'Acesse seus treinos e acompanhe sua evolução',
  },
  professor: {
    label: 'Professor',
    icon: Dumbbell,
    color: 'bg-success/20 text-success border-success/30',
    description: 'Gerencie treinos e acompanhe seus alunos',
  },
  recepcao: {
    label: 'Recepção',
    icon: ClipboardList,
    color: 'bg-warning/20 text-warning border-warning/30',
    description: 'Gerencie leads e atendimento',
  },
  gestor: {
    label: 'Gestor',
    icon: Users,
    color: 'bg-primary/20 text-primary border-primary/30',
    description: 'Acesso administrativo completo',
  },
};

const staffRoles: StaffRole[] = ['professor', 'recepcao', 'gestor'];

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStaffOptions, setShowStaffOptions] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState<StaffRole | null>(null);

  // Recupera o cargo (role) dos parâmetros da URL, se existir
  const roleFromUrl = searchParams.get('role');
  const validRoles = ['aluno', 'professor', 'recepcao', 'gestor'];
  const requestedRole = validRoles.includes(roleFromUrl || '') ? roleFromUrl : null;
  
  // Define o cargo ativo com base na URL ou na seleção do usuário (padrão: aluno)
  const activeRole = requestedRole || selectedStaffRole || 'aluno';
  const roleInfo = roleConfig[activeRole];
  const isStaffSignup = showStaffOptions || (requestedRole && requestedRole !== 'aluno');

  // Estado do formulário de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estado do formulário de cadastro
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({
          title: 'Credenciais inválidas',
          description: 'E-mail ou senha incorretos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao entrar',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    navigate('/dashboard');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!forgotPasswordEmail) {
      setErrors({ forgotEmail: 'Digite seu e-mail' });
      return;
    }

    const emailResult = z.string().email('E-mail inválido').safeParse(forgotPasswordEmail);
    if (!emailResult.success) {
      setErrors({ forgotEmail: 'E-mail inválido' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao enviar e-mail',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'E-mail enviado!',
      description: 'Verifique sua caixa de entrada para redefinir sua senha.',
    });
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      fullName: signupFullName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const roleToUse = activeRole !== 'aluno' ? activeRole : undefined;
    const { error } = await signUp(signupEmail, signupPassword, signupFullName, roleToUse);
    setLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        toast({
          title: 'Usuário já cadastrado',
          description: 'Esse e-mail já está em uso. Tente fazer login.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: 'Conta criada com sucesso!',
      description: `Você foi cadastrado como ${roleInfo.label}.`,
    });
    navigate('/dashboard');
  };

  const handleBackToStudentSignup = () => {
    setShowStaffOptions(false);
    setSelectedStaffRole(null);
  };

  const renderSignupContent = () => {
    // If staff role is selected from URL or state, show form
    if (isStaffSignup && (selectedStaffRole || requestedRole)) {
      return (
        <>
          {!requestedRole && (
            <button
              type="button"
              onClick={handleBackToStudentSignup}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          <div className={`p-3 rounded-lg mb-4 ${roleInfo.color} border`}>
            <div className="flex items-center gap-2">
              <roleInfo.icon className="h-4 w-4" />
              <span className="font-medium">Cadastro de {roleInfo.label}</span>
            </div>
            <p className="text-sm mt-1 opacity-90">{roleInfo.description}</p>
          </div>
          {renderSignupForm()}
        </>
      );
    }

    // If showing staff options but no role selected yet
    if (showStaffOptions) {
      return (
        <>
          <button
            type="button"
            onClick={handleBackToStudentSignup}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para cadastro de aluno
          </button>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Selecione seu cargo:
            </p>
            {staffRoles.map((role) => {
              const config = roleConfig[role];
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedStaffRole(role)}
                  className={`w-full p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${config.color} hover:border-current`}
                >
                  <div className="flex items-center gap-3">
                    <config.icon className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">{config.label}</p>
                      <p className="text-xs opacity-80">{config.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      );
    }

    // Padrão: Formulário de cadastro de aluno
    return (
      <>
        {renderSignupForm()}
        <div className="mt-6 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={() => setShowStaffOptions(true)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            É funcionário? <span className="underline">Acesse aqui</span>
          </button>
        </div>
      </>
    );
  };

  const renderSignupForm = () => (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Nome Completo</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Seu nome"
          value={signupFullName}
          onChange={(e) => setSignupFullName(e.target.value)}
          disabled={loading}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">E-mail</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="seu@email.com"
          value={signupEmail}
          onChange={(e) => setSignupEmail(e.target.value)}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••"
          value={signupPassword}
          onChange={(e) => setSignupPassword(e.target.value)}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
        <Input
          id="signup-confirm-password"
          type="password"
          placeholder="••••••"
          value={signupConfirmPassword}
          onChange={(e) => setSignupConfirmPassword(e.target.value)}
          disabled={loading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar Conta{activeRole !== 'aluno' ? ` de ${roleInfo.label}` : ''}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado esquerdo - Imagem Hero com sobreposição */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Imagem de fundo */}
        <img 
          src={gymHero} 
          alt="Academia" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Sobreposição escura para contraste */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-black/70" />
        
        {/* Conteúdo sobreposto */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="max-w-md text-center">
            {/* Logo da Academia */}
            <img 
              src={logoBoaforma} 
              alt="Boa Forma Academia" 
              className="h-52 xl:h-60 w-auto mx-auto mb-10 drop-shadow-2xl invert"
            />
            
            {/* Título Principal da Aplicação */}
            <h1 className="text-4xl xl:text-5xl font-bold mb-6 drop-shadow-lg">
              Boa Forma Gestão
            </h1>
            
            {/* Subtítulo Descritivo */}
            <p className="text-xl text-white/85 leading-relaxed">
              Seu ecossistema de gestão. Desenvolvido para a realidade da nossa academia.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4 lg:p-8 relative min-h-screen lg:min-h-0">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Mobile logo (only shows on mobile) */}
        <div className="lg:hidden absolute top-4 left-4">
          <img 
            src={logoBoaforma} 
            alt="Boa Forma Academia" 
            className="h-12 w-auto dark:invert"
          />
        </div>

        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center space-y-4 pb-2">
            {/* Exibe logo no mobile, oculta no desktop */}
            <div className="flex justify-center lg:hidden">
              <img 
                src={logoBoaforma} 
                alt="Boa Forma Academia" 
                className="h-24 w-auto dark:invert"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Bem-vindo(a)!</h2>
              <CardDescription className="text-muted-foreground">
                Acesse sua conta para continuar
              </CardDescription>
              {requestedRole && requestedRole !== 'aluno' && (
                <Badge variant="outline" className={`mt-3 ${roleInfo.color}`}>
                  <roleInfo.icon className="h-3 w-3 mr-1" />
                  Cadastro de {roleInfo.label}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                        setErrors({});
                      }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para login
                    </button>
                    
                    <div className="text-center py-4">
                      <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-foreground">Recuperar Senha</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Digite seu e-mail para receber o link de recuperação
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">E-mail</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        disabled={loading}
                      />
                      {errors.forgotEmail && (
                        <p className="text-sm text-destructive">{errors.forgotEmail}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar Link de Recuperação
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={loading}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Senha</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={loading}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                {renderSignupContent()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
