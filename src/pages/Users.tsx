import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard } from '@/components/shared';
import { Users as UsersIcon, Plus, X, Shield, UserCog, KeyRound, Loader2, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const roleLabels: Record<string, string> = {
  gestor: 'Gestor',
  recepcao: 'Recepção',
  professor: 'Professor',
  aluno: 'Aluno',
};

const roleColors: Record<string, string> = {
  gestor: 'bg-primary/10 text-primary border-primary/30',
  recepcao: 'bg-warning/10 text-warning border-warning/30',
  professor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  aluno: 'bg-info/10 text-info border-info/30',
};

export default function UsersPage() {
  const { users, isLoading, addRole, removeRole, isAddingRole } = useUsers();
  const { profile, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<{ id: string; name: string; email?: string } | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const { toast } = useToast();

  // Redirect non-gestores
  useEffect(() => {
    if (!loading && !hasRole('gestor')) {
      navigate('/dashboard');
    }
  }, [loading, hasRole, navigate]);

  const handleAddRole = () => {
    if (!selectedUserId || !selectedRole || !profile?.unit_id) return;
    
    addRole({
      userId: selectedUserId,
      role: selectedRole as 'gestor' | 'recepcao' | 'professor' | 'aluno',
      unitId: profile.unit_id,
    });
    
    setDialogOpen(false);
    setSelectedRole('');
    setSelectedUserId(null);
  };

  const openAddRoleDialog = (userId: string) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
  };

  const openResetPasswordDialog = (userId: string, fullName: string) => {
    setUserToReset({ id: userId, name: fullName });
    setResetPasswordDialogOpen(true);
  };

  const handleSendPasswordReset = async () => {
    if (!userToReset) return;

    setSendingReset(true);
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userToReset.id)
        .maybeSingle();

      if (profileError || !profileData) {
        toast({
          title: 'Erro ao buscar usuário',
          description: 'Não foi possível encontrar o usuário.',
          variant: 'destructive',
        });
        setSendingReset(false);
        return;
      }

      toast({
        title: 'Instrução enviada',
        description: `Oriente ${userToReset.name} a usar a opção "Esqueci minha senha" na tela de login.`,
      });
      
      setResetPasswordDialogOpen(false);
      setUserToReset(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setSendingReset(false);
    }
  };

  const usersWithRoles = users.filter(u => u.roles.length > 0).length;
  const gestores = users.filter(u => u.roles.some(r => r.role === 'gestor')).length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Gestão de Usuários"
          subtitle="Gerencie os usuários e suas permissões no sistema"
          icon={<UserCog className="h-8 w-8 text-primary" />}
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total de Usuários"
            value={users.length}
            change={5}
            icon={<UsersIcon className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Com Permissões"
            value={usersWithRoles}
            icon={<UserCheck className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Gestores"
            value={gestores}
            icon={<Shield className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
        </div>

        {/* Users List */}
        <div className="space-y-2">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </>
          ) : users.length === 0 ? (
            <Card className="border border-border/50">
              <CardContent className="py-12 text-center">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário cadastrado ainda</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => {
              const initials = user.full_name
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'U';

              return (
                <Card key={user.id} className="border border-border/50 hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.phone || 'Sem telefone'}</p>
                      </div>

                      <div className="hidden md:flex flex-wrap gap-2 max-w-[300px]">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic">Sem role</span>
                        ) : (
                          user.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="outline"
                              className={`${roleColors[role.role]} flex items-center gap-1`}
                            >
                              {roleLabels[role.role]}
                              <button
                                onClick={() => removeRole(role.id)}
                                className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>

                      <div className="hidden lg:block text-sm text-muted-foreground min-w-[120px]">
                        {format(new Date(user.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResetPasswordDialog(user.user_id, user.full_name)}
                          title="Resetar Senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Dialog open={dialogOpen && selectedUserId === user.user_id} onOpenChange={(open) => {
                          if (!open) {
                            setDialogOpen(false);
                            setSelectedUserId(null);
                            setSelectedRole('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddRoleDialog(user.user_id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Role
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adicionar Role</DialogTitle>
                              <DialogDescription>
                                Selecione a role para {user.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gestor">Gestor</SelectItem>
                                  <SelectItem value="recepcao">Recepção</SelectItem>
                                  <SelectItem value="professor">Professor</SelectItem>
                                  <SelectItem value="aluno">Aluno</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleAddRole} disabled={!selectedRole || isAddingRole}>
                                Adicionar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setResetPasswordDialogOpen(false);
            setUserToReset(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Resetar Senha
              </DialogTitle>
              <DialogDescription>
                Orientar {userToReset?.name} a recuperar a senha
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                O usuário deve acessar a tela de login e clicar em{' '}
                <strong>"Esqueci minha senha"</strong> para receber um link de recuperação por e-mail.
              </p>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground">Instruções para o usuário:</p>
                <ol className="text-sm text-muted-foreground mt-2 list-decimal list-inside space-y-1">
                  <li>Acesse a página de login</li>
                  <li>Clique em "Esqueci minha senha"</li>
                  <li>Digite o e-mail cadastrado</li>
                  <li>Verifique a caixa de entrada</li>
                  <li>Clique no link e defina a nova senha</li>
                </ol>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setUserToReset(null);
                }}
              >
                Fechar
              </Button>
              <Button onClick={handleSendPasswordReset} disabled={sendingReset}>
                {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
