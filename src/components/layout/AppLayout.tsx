import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnitTheme } from '@/hooks/useUnitTheme';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Kanban,
  ListTodo,
  LogOut,
  Menu,
  X,
  UserCog,
  User,
  Building2,
  BarChart3,
  Smartphone,
  Zap,
  ClipboardList,
  Wallet,
  CalendarDays,
  MessageCircle,
  Settings,
  History,
  TrendingUp,
  FileText,
  ScanLine,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoBoaforma from '@/assets/logo-boaforma.png';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('gestor' | 'recepcao' | 'professor' | 'aluno')[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meu App', href: '/meu-app', icon: Smartphone, roles: ['aluno'] },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, roles: ['gestor', 'recepcao'] },
  { name: 'Leads', href: '/leads', icon: Users, roles: ['gestor', 'recepcao'] },
  { name: 'Check-in', href: '/check-in', icon: ScanLine, roles: ['gestor', 'recepcao'] },
  { name: 'Busca Aluno', href: '/busca-aluno', icon: Search, roles: ['gestor', 'recepcao'] },
  { name: 'Meus Alunos', href: '/meus-alunos', icon: Users, roles: ['professor'] },
  { name: 'Avaliações', href: '/avaliacoes', icon: ClipboardList, roles: ['professor'] },
  { name: 'Relatórios', href: '/relatorios-professor', icon: BarChart3, roles: ['professor'] },
  { name: 'Treinos', href: '/workouts', icon: ClipboardList, roles: ['gestor', 'professor'] },
  { name: 'Agenda', href: '/scheduling', icon: CalendarDays, roles: ['gestor', 'recepcao', 'professor'] },
  { name: 'Chat', href: '/chat', icon: MessageCircle, roles: ['gestor', 'professor', 'aluno'] },
  { name: 'Tarefas', href: '/tasks', icon: ListTodo, roles: ['gestor', 'recepcao', 'professor'] },
  { name: 'Financeiro', href: '/financial', icon: Wallet, roles: ['gestor', 'recepcao'] },
  { name: 'Automações', href: '/automation', icon: Zap, roles: ['gestor'] },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['gestor'] },
  { name: 'Relatórios Avançados', href: '/advanced-reports', icon: TrendingUp, roles: ['gestor'] },
  { name: 'Contratos', href: '/contracts', icon: FileText, roles: ['gestor'] },
  { name: 'Histórico', href: '/activity-logs', icon: History, roles: ['gestor'] },
  { name: 'Unidades', href: '/units', icon: Building2, roles: ['gestor'] },
  { name: 'Usuários', href: '/users', icon: UserCog, roles: ['gestor'] },
  { name: 'Configurações', href: '/settings', icon: Settings, roles: ['gestor'] },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, signOut, hasRole } = useAuth();
  const { logoUrl } = useUnitTheme(); // Apply unit theme colors
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img 
                src={logoUrl || logoBoaforma} 
                alt="Academia" 
                className="h-10 w-auto max-w-[140px] object-contain dark:invert"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation
              .filter((item) => {
                // If no roles specified, show to everyone
                if (!item.roles) return true;
                // Check if user has any of the required roles
                return item.roles.some((role) => hasRole(role));
              })
              .map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* User */}
          <div className="border-t border-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary transition-colors">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
