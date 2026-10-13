-- =============================================================================
-- Distribution AI Challenge — Schema completo (Supabase)
-- Execute este arquivo no SQL Editor do Supabase (uma vez).
-- =============================================================================

-- Extensões
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Profiles (administradores)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Banco permanente de perguntas
-- -----------------------------------------------------------------------------
create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  theme text not null,
  difficulty text not null check (difficulty in ('facil', 'medio', 'dificil')),
  statement text not null,
  explanation text not null default '',
  time_seconds integer not null default 20 check (time_seconds between 5 and 300),
  points_multiplier numeric(4,2) not null default 1.00 check (points_multiplier > 0),
  tags text[] not null default '{}',
  archived boolean not null default false,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank (id) on delete cascade,
  option_key text not null check (option_key in ('A', 'B', 'C', 'D')),
  option_text text not null,
  is_correct boolean not null default false,
  unique (question_id, option_key)
);

-- -----------------------------------------------------------------------------
-- Sessões de quiz
-- -----------------------------------------------------------------------------
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft'
    check (status in (
      'draft', 'lobby', 'active', 'question_open',
      'question_closed', 'revealing', 'ranking', 'finished'
    )),
  current_question_order integer not null default 0,
  show_answer boolean not null default false,
  show_ranking boolean not null default false,
  access_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_by uuid references public.profiles (id),
  started_at timestamptz,
  finished_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Cópia versionada das perguntas na sessão (imutável após criação)
create table if not exists public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  question_bank_id uuid references public.question_bank (id) on delete set null,
  order_index integer not null,
  theme text not null,
  difficulty text not null,
  statement text not null,
  explanation text not null default '',
  time_seconds integer not null,
  points_multiplier numeric(4,2) not null default 1.00,
  tags text[] not null default '{}',
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  opened_at timestamptz,
  closed_at timestamptz,
  answer_revealed boolean not null default false,
  unique (session_id, order_index)
);

-- -----------------------------------------------------------------------------
-- Participantes e respostas
-- -----------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  nickname text not null,
  client_token text not null,
  total_score integer not null default 0,
  correct_count integer not null default 0,
  total_response_ms integer not null default 0,
  is_connected boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, client_token),
  unique (session_id, nickname)
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  session_question_id uuid not null references public.session_questions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  selected_option text not null check (selected_option in ('A', 'B', 'C', 'D')),
  is_correct boolean not null default false,
  response_time_ms integer not null check (response_time_ms >= 0),
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique (session_question_id, participant_id)
);

create table if not exists public.score_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  nickname text not null,
  rank_position integer not null,
  total_score integer not null default 0,
  correct_count integer not null default 0,
  total_response_ms integer not null default 0,
  snapshot_type text not null default 'live' check (snapshot_type in ('live', 'final')),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
create index if not exists idx_question_bank_theme on public.question_bank (theme);
create index if not exists idx_question_bank_difficulty on public.question_bank (difficulty);
create index if not exists idx_question_bank_archived on public.question_bank (archived);
create index if not exists idx_question_bank_tags on public.question_bank using gin (tags);
create index if not exists idx_question_options_question on public.question_options (question_id);

create index if not exists idx_quiz_sessions_status on public.quiz_sessions (status);
create index if not exists idx_quiz_sessions_created_at on public.quiz_sessions (created_at desc);
create index if not exists idx_quiz_sessions_access_code on public.quiz_sessions (access_code);

create index if not exists idx_session_questions_session on public.session_questions (session_id, order_index);

create index if not exists idx_participants_session on public.participants (session_id);
create index if not exists idx_participants_ranking
  on public.participants (session_id, total_score desc, correct_count desc, total_response_ms asc);

create index if not exists idx_answers_session on public.answers (session_id);
create index if not exists idx_answers_question on public.answers (session_question_id);
create index if not exists idx_answers_participant on public.answers (participant_id);

create index if not exists idx_score_snapshots_session
  on public.score_snapshots (session_id, snapshot_type, rank_position);

-- -----------------------------------------------------------------------------
-- Funções auxiliares
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_question_bank_updated_at on public.question_bank;
create trigger trg_question_bank_updated_at
  before update on public.question_bank
  for each row execute function public.set_updated_at();

-- Cria profile automaticamente quando um usuário Auth é criado
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Calcula pontuação no servidor (somente respostas corretas)
create or replace function public.calculate_points(
  p_is_correct boolean,
  p_response_time_ms integer,
  p_time_seconds integer,
  p_multiplier numeric
)
returns integer
language plpgsql
immutable
as $$
declare
  ratio numeric;
  base numeric;
begin
  if not p_is_correct then
    return 0;
  end if;
  if p_time_seconds <= 0 then
    return round(1000 * p_multiplier)::integer;
  end if;
  ratio := greatest(0, least(1, 1 - (p_response_time_ms::numeric / (p_time_seconds * 1000.0))));
  base := 1000 * ratio * p_multiplier;
  return greatest(0, round(base))::integer;
end;
$$;

-- Submissão segura de resposta (participante anônimo)
create or replace function public.submit_answer(
  p_participant_id uuid,
  p_client_token text,
  p_session_question_id uuid,
  p_selected_option text,
  p_response_time_ms integer
)
returns public.answers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant public.participants%rowtype;
  v_session public.quiz_sessions%rowtype;
  v_question public.session_questions%rowtype;
  v_is_correct boolean;
  v_points integer;
  v_answer public.answers%rowtype;
begin
  select * into v_participant
  from public.participants
  where id = p_participant_id and client_token = p_client_token;

  if not found then
    raise exception 'Participante inválido';
  end if;

  select * into v_session from public.quiz_sessions where id = v_participant.session_id;
  if v_session.status <> 'question_open' then
    raise exception 'Respostas encerradas para esta pergunta';
  end if;

  select * into v_question
  from public.session_questions
  where id = p_session_question_id and session_id = v_participant.session_id;

  if not found then
    raise exception 'Pergunta inválida';
  end if;

  if v_session.current_question_order <> v_question.order_index then
    raise exception 'Esta não é a pergunta ativa';
  end if;

  if exists (
    select 1 from public.answers
    where session_question_id = p_session_question_id and participant_id = p_participant_id
  ) then
    raise exception 'Você já respondeu esta pergunta';
  end if;

  v_is_correct := upper(p_selected_option) = v_question.correct_option;
  v_points := public.calculate_points(
    v_is_correct,
    greatest(0, p_response_time_ms),
    v_question.time_seconds,
    v_question.points_multiplier
  );

  insert into public.answers (
    session_id, session_question_id, participant_id,
    selected_option, is_correct, response_time_ms, points_awarded
  ) values (
    v_participant.session_id, p_session_question_id, p_participant_id,
    upper(p_selected_option), v_is_correct, greatest(0, p_response_time_ms), v_points
  )
  returning * into v_answer;

  update public.participants
  set
    total_score = total_score + v_points,
    correct_count = correct_count + case when v_is_correct then 1 else 0 end,
    total_response_ms = total_response_ms + greatest(0, p_response_time_ms)
  where id = p_participant_id;

  return v_answer;
end;
$$;

-- Atualiza snapshot de ranking
create or replace function public.refresh_score_snapshots(
  p_session_id uuid,
  p_snapshot_type text default 'live'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_snapshot_type = 'live' then
    delete from public.score_snapshots
    where session_id = p_session_id and snapshot_type = 'live';
  end if;

  insert into public.score_snapshots (
    session_id, participant_id, nickname, rank_position,
    total_score, correct_count, total_response_ms, snapshot_type
  )
  select
    p.session_id,
    p.id,
    p.nickname,
    row_number() over (
      order by p.total_score desc, p.correct_count desc, p.total_response_ms asc, p.created_at asc
    ),
    p.total_score,
    p.correct_count,
    p.total_response_ms,
    p_snapshot_type
  from public.participants p
  where p.session_id = p_session_id;
end;
$$;

-- Entrada / reentrada segura do participante
create or replace function public.join_session(
  p_session_id uuid,
  p_nickname text,
  p_client_token text
)
returns public.participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_participant public.participants%rowtype;
  v_nick text := trim(p_nickname);
begin
  if v_nick = '' or char_length(v_nick) > 24 then
    raise exception 'Apelido inválido';
  end if;

  select * into v_session from public.quiz_sessions where id = p_session_id;
  if not found then
    raise exception 'Sessão não encontrada';
  end if;

  if v_session.status not in ('lobby', 'active', 'question_open', 'question_closed', 'revealing', 'ranking') then
    raise exception 'Sessão não está aberta para entrada';
  end if;

  select * into v_participant
  from public.participants
  where session_id = p_session_id and client_token = p_client_token;

  if found then
    update public.participants
    set nickname = v_nick, is_connected = true
    where id = v_participant.id
    returning * into v_participant;
    return v_participant;
  end if;

  insert into public.participants (session_id, nickname, client_token, is_connected)
  values (p_session_id, v_nick, p_client_token, true)
  returning * into v_participant;

  return v_participant;
exception
  when unique_violation then
    raise exception 'Este apelido já está em uso nesta sessão';
end;
$$;

-- Participante consulta apenas a própria resposta
create or replace function public.get_own_answer(
  p_participant_id uuid,
  p_client_token text,
  p_session_question_id uuid
)
returns public.answers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_answer public.answers%rowtype;
begin
  if not exists (
    select 1 from public.participants
    where id = p_participant_id and client_token = p_client_token
  ) then
    return null;
  end if;

  select * into v_answer
  from public.answers
  where participant_id = p_participant_id
    and session_question_id = p_session_question_id;

  if not found then
    return null;
  end if;

  return v_answer;
end;
$$;

-- Ranking público sem expor client_token
create or replace function public.get_leaderboard(p_session_id uuid)
returns table (
  id uuid,
  session_id uuid,
  nickname text,
  total_score integer,
  correct_count integer,
  total_response_ms integer,
  is_connected boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.session_id,
    p.nickname,
    p.total_score,
    p.correct_count,
    p.total_response_ms,
    p.is_connected,
    p.created_at
  from public.participants p
  where p.session_id = p_session_id
  order by p.total_score desc, p.correct_count desc, p.total_response_ms asc, p.created_at asc;
$$;

create or replace function public.get_own_participant(
  p_session_id uuid,
  p_client_token text
)
returns public.participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.participants%rowtype;
begin
  select * into v_row
  from public.participants
  where session_id = p_session_id and client_token = p_client_token;
  if not found then
    return null;
  end if;
  return v_row;
end;
$$;

grant execute on function public.join_session(uuid, text, text) to anon, authenticated;
grant execute on function public.submit_answer(uuid, text, uuid, text, integer) to anon, authenticated;
grant execute on function public.get_own_answer(uuid, text, uuid) to anon, authenticated;
grant execute on function public.get_leaderboard(uuid) to anon, authenticated;
grant execute on function public.get_own_participant(uuid, text) to anon, authenticated;
grant execute on function public.refresh_score_snapshots(uuid, text) to authenticated;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.calculate_points(boolean, integer, integer, numeric) to authenticated, anon;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.question_bank enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.participants enable row level security;
alter table public.answers enable row level security;
alter table public.score_snapshots enable row level security;

-- Profiles
create policy "Admins leem profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Admins atualizam o próprio profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and public.is_admin());

-- Question bank
create policy "Admins gerenciam question_bank"
  on public.question_bank for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins gerenciam question_options"
  on public.question_options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Sessões: admin gerencia; público lê sessões não-draft (para entrar no jogo)
create policy "Admins gerenciam sessões"
  on public.quiz_sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Público lê sessões ativas"
  on public.quiz_sessions for select
  to anon, authenticated
  using (status <> 'draft');

-- Perguntas da sessão: admin gerencia; público lê (sem expor gabarito via coluna — app oculta até revelar)
create policy "Admins gerenciam session_questions"
  on public.session_questions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Público lê perguntas de sessões não-draft"
  on public.session_questions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.quiz_sessions s
      where s.id = session_id and s.status <> 'draft'
    )
  );

-- Participantes
create policy "Admins leem todos participantes"
  on public.participants for select
  to authenticated
  using (public.is_admin());

-- Anon NÃO lê a tabela participants diretamente (evita vazamento de client_token)
-- Ranking público via score_snapshots / get_leaderboard

create policy "Participante se cadastra em sessão aberta"
  on public.participants for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.quiz_sessions s
      where s.id = session_id
        and s.status in ('lobby', 'active', 'question_open', 'question_closed', 'revealing', 'ranking')
    )
  );

-- Anon NÃO atualiza participantes diretamente (pontuação só via submit_answer)
create policy "Admins atualizam participantes"
  on public.participants for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Respostas: admin vê tudo; anon só via RPC get_own_answer / submit_answer
create policy "Admins leem respostas"
  on public.answers for select
  to authenticated
  using (public.is_admin());

create policy "Bloqueia select direto de answers para anon"
  on public.answers for select
  to anon
  using (false);

create policy "Bloqueia insert direto de answers para anon"
  on public.answers for insert
  to anon
  with check (false);

create policy "Admins inserem answers se necessário"
  on public.answers for insert
  to authenticated
  with check (public.is_admin());

-- Score snapshots (ranking público)
create policy "Admins gerenciam snapshots"
  on public.score_snapshots for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Público lê snapshots"
  on public.score_snapshots for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.quiz_sessions;
alter publication supabase_realtime add table public.session_questions;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.score_snapshots;
alter publication supabase_realtime add table public.answers;
