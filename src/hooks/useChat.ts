import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ChatRoom {
  id: string;
  unit_id: string;
  lead_id: string;
  professor_id: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  lead?: {
    id: string;
    full_name: string;
  };
  professor?: {
    id: string;
    full_name: string;
  };
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: 'professor' | 'aluno';
  content: string;
  read_at: string | null;
  created_at: string;
}

export const useChat = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch chat rooms with unread count
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chat-rooms', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          lead:leads(id, full_name),
          professor:profiles!chat_rooms_professor_id_fkey(id, full_name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch unread counts for each room
      const roomsWithUnread = await Promise.all(
        (data || []).map(async (room) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', profile.id)
            .is('read_at', null);

          return { ...room, unread_count: count || 0 };
        })
      );

      return roomsWithUnread as ChatRoom[];
    },
    enabled: !!profile?.id,
  });

  // Create chat room
  const createRoomMutation = useMutation({
    mutationFn: async ({ unitId, leadId, professorId }: { unitId: string; leadId: string; professorId: string }) => {
      // Check if room already exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('lead_id', leadId)
        .eq('professor_id', professorId)
        .single();

      if (existingRoom) {
        return existingRoom;
      }

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          unit_id: unitId,
          lead_id: leadId,
          professor_id: professorId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar conversa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    rooms,
    isLoadingRooms,
    createRoom: createRoomMutation.mutate,
    isCreatingRoom: createRoomMutation.isPending,
  };
};

export const useChatMessages = (roomId: string | null) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Fetch messages and mark as read
  const { data: initialMessages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId || !profile?.id) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter((m) => m.sender_id !== profile.id && !m.read_at)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);

        // Invalidate rooms to update unread count
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      }

      return data as ChatMessage[];
    },
    enabled: !!roomId && !!profile?.id,
  });

  // Update messages when initial data loads
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, senderType }: { content: string; senderType: 'professor' | 'aluno' }) => {
      if (!roomId || !profile) throw new Error('Room or profile not found');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: profile.id,
          sender_type: senderType,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update room's updated_at
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
};
