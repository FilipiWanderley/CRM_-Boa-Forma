import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfessorStudents } from '@/hooks/useProfessorStats';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Dumbbell, 
  Calendar, 
  Phone, 
  Mail,
  TrendingUp,
  ChevronRight,
  Filter
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MeusAlunos() {
  const { data: students, isLoading } = useProfessorStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter students
  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.phone?.includes(searchTerm) ||
                          student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Get status counts
  const statusCounts = {
    all: students?.length || 0,
    ativo: students?.filter(s => s.status === 'ativo').length || 0,
    inativo: students?.filter(s => s.status === 'inativo').length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-success/20 text-success border-0">Ativo</Badge>;
      case 'inativo':
        return <Badge className="bg-muted text-muted-foreground border-0">Inativo</Badge>;
      case 'cancelado':
        return <Badge className="bg-destructive/20 text-destructive border-0">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Meus Alunos
            </h1>
            <p className="text-muted-foreground mt-1">
              Alunos com treinos criados por você
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className={`card-glow cursor-pointer transition-all ${statusFilter === 'all' ? 'border-primary' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.all}</p>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`card-glow cursor-pointer transition-all ${statusFilter === 'ativo' ? 'border-success' : ''}`}
            onClick={() => setStatusFilter('ativo')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.ativo}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`card-glow cursor-pointer transition-all ${statusFilter === 'inativo' ? 'border-muted' : ''}`}
            onClick={() => setStatusFilter('inativo')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.inativo}</p>
                <p className="text-sm text-muted-foreground">Inativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const activeWorkouts = student.workouts?.filter((w: any) => w.is_active).length || 0;
              const latestSubscription = student.subscriptions?.[0];
              const daysUntilExpiry = latestSubscription?.end_date 
                ? differenceInDays(parseISO(latestSubscription.end_date), new Date())
                : null;

              return (
                <Link key={student.id} to={`/leads/${student.id}`}>
                  <Card className="card-glow hover:border-primary/30 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {student.full_name?.charAt(0)?.toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {student.full_name}
                            </h3>
                            {getStatusBadge(student.status)}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {student.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {student.phone}
                              </span>
                            )}
                            {student.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-primary">
                              <Dumbbell className="h-3 w-3" />
                              {activeWorkouts} treino{activeWorkouts !== 1 ? 's' : ''} ativo{activeWorkouts !== 1 ? 's' : ''}
                            </span>
                            {latestSubscription?.plan?.name && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {latestSubscription.plan.name}
                                {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                                  <Badge className="ml-1 bg-warning/20 text-warning border-0 text-xs">
                                    Vence em {daysUntilExpiry}d
                                  </Badge>
                                )}
                                {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                                  <Badge className="ml-1 bg-destructive/20 text-destructive border-0 text-xs">
                                    Vencido
                                  </Badge>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          ) : (
            <Card className="card-glow">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Quando você criar treinos para alunos, eles aparecerão aqui.'
                  }
                </p>
                <Link to="/workouts">
                  <Button className="mt-4">
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Criar Treino
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}