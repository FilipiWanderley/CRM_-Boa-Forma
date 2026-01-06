-- Create chat_rooms table for conversations
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, professor_id)
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('professor', 'aluno')),
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_rooms
CREATE POLICY "Professors can view their chat rooms"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  professor_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Alunos can view their chat rooms"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  lead_id IN (
    SELECT id FROM public.leads WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can manage chat rooms"
ON public.chat_rooms FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor') OR 
  public.has_role(auth.uid(), 'recepcao') OR
  public.has_role(auth.uid(), 'professor')
);

-- RLS policies for chat_messages
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  room_id IN (
    SELECT id FROM public.chat_rooms WHERE
      professor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR lead_id IN (SELECT id FROM public.leads WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);

CREATE POLICY "Users can send messages to their rooms"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  room_id IN (
    SELECT id FROM public.chat_rooms WHERE
      professor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR lead_id IN (SELECT id FROM public.leads WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);

CREATE POLICY "Staff can manage all messages"
ON public.chat_messages FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor') OR 
  public.has_role(auth.uid(), 'recepcao') OR
  public.has_role(auth.uid(), 'professor')
);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create updated_at trigger for chat_rooms
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_rooms_updated_at();