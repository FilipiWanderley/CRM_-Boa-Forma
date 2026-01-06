import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { DashboardGestor, DashboardRecepcao, DashboardProfessor, DashboardAluno } from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { hasRole, loading } = useAuth();

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Determina qual dashboard exibir com base no papel (role) do usuário
  // Prioridade: gestor > recepcao > professor > aluno
  const renderDashboard = () => {
    if (hasRole('gestor')) {
      return <DashboardGestor />;
    }
    if (hasRole('recepcao')) {
      return <DashboardRecepcao />;
    }
    if (hasRole('professor')) {
      return <DashboardProfessor />;
    }
    if (hasRole('aluno')) {
      return <DashboardAluno />;
    }
    // Padrão: exibe uma mensagem para usuários sem papel definido
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Bem-vindo ao Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Aguardando atribuição de perfil pelo gestor
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Pendente</h2>
            <p className="text-muted-foreground">
              Seu cadastro foi realizado com sucesso! Aguarde o gestor atribuir seu perfil de acesso ao sistema.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      {renderDashboard()}
    </AppLayout>
  );
}