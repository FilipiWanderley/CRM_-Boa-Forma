import { useState, useMemo } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CreateChatDialog } from '@/components/chat/CreateChatDialog';
import { useChat } from '@/hooks/useChat';

const Chat = () => {
  const { rooms, isLoadingRooms } = useChat();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Chat"
          subtitle="Comunicação em tempo real entre professores e alunos"
          icon={<MessageCircle className="h-6 w-6" />}
        />

        <Card className="h-[calc(100vh-220px)] min-h-[500px] overflow-hidden">
          <div className="flex h-full">
            {/* Room List */}
            <div className="w-80 border-r flex-shrink-0">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Conversas</h3>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              </div>
              <div className="h-[calc(100%-57px)]">
                <ChatRoomList
                  rooms={rooms}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                  isLoading={isLoadingRooms}
                />
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1">
              <ChatWindow room={selectedRoom} />
            </div>
          </div>
        </Card>

        <CreateChatDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AppLayout>
  );
};

export default Chat;
