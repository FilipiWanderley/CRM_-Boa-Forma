import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: {
    id: string;
    role: 'gestor' | 'recepcao' | 'professor' | 'aluno';
    unit_id: string | null;
  }[];
}

export function useUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get user emails from auth (we need to fetch this separately)
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: '', // Will be filled if we can get it
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        roles: roles.filter((r) => r.user_id === profile.user_id),
      }));

      return usersWithRoles;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role, unitId }: { userId: string; role: 'gestor' | 'recepcao' | 'professor' | 'aluno'; unitId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          unit_id: unitId,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      logActivity({
        entity_type: 'user',
        entity_id: variables.userId,
        action: 'update',
        description: `Role "${variables.role}" adicionada ao usuário`,
        metadata: { role: variables.role, unit_id: variables.unitId },
      });
      toast({
        title: 'Role adicionada',
        description: 'A role foi adicionada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: (_, roleId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      logActivity({
        entity_type: 'user',
        action: 'update',
        description: 'Role removida do usuário',
        metadata: { role_id: roleId },
      });
      toast({
        title: 'Role removida',
        description: 'A role foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    addRole: addRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAddingRole: addRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
}