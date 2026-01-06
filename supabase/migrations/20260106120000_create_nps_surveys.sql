create table public.nps_surveys (
  id uuid not null default gen_random_uuid(),
  unit_id uuid not null references public.units(id),
  user_id uuid references auth.users(id),
  score integer not null check (score >= 0 and score <= 10),
  comment text,
  source text default 'app_aluno',
  created_at timestamp with time zone not null default now(),
  constraint nps_surveys_pkey primary key (id)
);

-- Enable RLS
alter table public.nps_surveys enable row level security;

-- Policies
create policy "Alunos can insert their own surveys"
on public.nps_surveys for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Staff can view all surveys"
on public.nps_surveys for select
to authenticated
using (
  (unit_id = get_user_unit_id(auth.uid())) AND
  (
    has_role(auth.uid(), 'gestor'::app_role) OR 
    has_role(auth.uid(), 'recepcao'::app_role)
  )
);

-- Indexes
create index idx_nps_surveys_created_at on public.nps_surveys(created_at);
create index idx_nps_surveys_unit_id on public.nps_surveys(unit_id);
