import { Toaster } from "@/components/ui/toaster";
import { lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Leads from "./pages/Leads";
import NewLead from "./pages/NewLead";
import EditLead from "./pages/EditLead";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Anamnesis from "./pages/Anamnesis";
import LeadDetails from "./pages/LeadDetails";
import Units from "./pages/Units";
import Reports from "./pages/Reports";
import AlunoApp from "./pages/AlunoApp";
import Automation from "./pages/Automation";
import Exercises from "./pages/Exercises";
import Workouts from "./pages/Workouts";
import WorkoutDetail from "./pages/WorkoutDetail";
import Financial from "./pages/Financial";
import Scheduling from "./pages/Scheduling";
import NotFound from "./pages/NotFound";
import Store from "./pages/Store";
import Chat from "./pages/Chat";
import InstallApp from "./pages/InstallApp";
import MeusAlunos from "./pages/MeusAlunos";
import Avaliacoes from "./pages/Avaliacoes";
import ProfessorReports from "./pages/ProfessorReports";
import GymSettings from "./pages/GymSettings";
import ActivityLogs from "./pages/ActivityLogs";
import AdvancedReports from "./pages/AdvancedReports";
import Contracts from "./pages/Contracts";
import CheckIn from "./pages/CheckIn";
import StudentLookup from "./pages/StudentLookup";
const queryClient = new QueryClient();

// Theme is managed by next-themes provider in main.tsx

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
    <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
    <Route path="/leads/new" element={<ProtectedRoute><NewLead /></ProtectedRoute>} />
    <Route path="/leads/:id" element={<ProtectedRoute><LeadDetails /></ProtectedRoute>} />
    <Route path="/leads/:id/edit" element={<ProtectedRoute><EditLead /></ProtectedRoute>} />
    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
    <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
    <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
    <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/anamnesis/:leadId" element={<ProtectedRoute><Anamnesis /></ProtectedRoute>} />
    <Route path="/meu-app" element={<ProtectedRoute><AlunoApp /></ProtectedRoute>} />
    <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
    <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
    <Route path="/workouts/:id" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
    <Route path="/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
    <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/meus-alunos" element={<ProtectedRoute><MeusAlunos /></ProtectedRoute>} />
    <Route path="/avaliacoes" element={<ProtectedRoute><Avaliacoes /></ProtectedRoute>} />
    <Route path="/relatorios-professor" element={<ProtectedRoute><ProfessorReports /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><GymSettings /></ProtectedRoute>} />
    <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
    <Route path="/advanced-reports" element={<ProtectedRoute><AdvancedReports /></ProtectedRoute>} />
    <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
    <Route path="/check-in" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
    <Route path="/busca-aluno" element={<ProtectedRoute><StudentLookup /></ProtectedRoute>} />
    <Route path="/loja" element={<Store />} />
    <Route path="/instalar" element={<InstallApp />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
