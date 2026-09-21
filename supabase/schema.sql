-- Additive, application-specific tables. Existing MOAKIT tables are untouched.
begin;
create table public.du_classes (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[0-9]{4}$'),
 school_name text not null default '' check(char_length(school_name)<=60), level text not null check(level in ('elementary','middle')),
 created_at timestamptz not null default now()
);
create table public.du_students (
 id uuid primary key default gen_random_uuid(), class_id uuid not null references public.du_classes on delete cascade,
 nickname text not null check(char_length(nickname) between 1 and 24), current_case int not null default 1 check(current_case between 1 and 5),
 current_step int not null default 0 check(current_step between 0 and 30), created_at timestamptz not null default now(), unique(class_id,nickname)
);
create table public.du_answers (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.du_students on delete cascade,
 case_no int not null check(case_no between 1 and 4), found_items jsonb not null default '[]', choices jsonb not null default '{}',
 reason text not null default '' check(char_length(reason)<=500), completed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(student_id,case_no)
);
create table public.du_cards (
 id uuid primary key default gen_random_uuid(), student_id uuid not null unique references public.du_students on delete cascade,
 surprise text not null default '' check(char_length(surprise)<=300), promise text not null default '' check(char_length(promise)<=300),
 job_thought text not null default '' check(char_length(job_thought)<=300), stamp jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create table public.du_sessions (
 token_hash text primary key, role text not null check(role in('student','teacher')),
 student_id uuid references public.du_students on delete cascade, expires_at timestamptz not null default now()+interval '7 days', created_at timestamptz not null default now()
);
create table public.du_votes (
 student_id uuid primary key references public.du_students on delete cascade,
 card_id uuid not null references public.du_cards on delete cascade, created_at timestamptz not null default now()
);
create table public.du_rate_limits (key text primary key, window_at timestamptz not null default now(), hits int not null default 1);
create index du_students_class_idx on public.du_students(class_id);
create index du_votes_card_idx on public.du_votes(card_id);
create index du_sessions_student_idx on public.du_sessions(student_id);
alter table public.du_classes enable row level security;
alter table public.du_students enable row level security;
alter table public.du_answers enable row level security;
alter table public.du_cards enable row level security;
alter table public.du_sessions enable row level security;
alter table public.du_votes enable row level security;
alter table public.du_rate_limits enable row level security;
revoke all on public.du_classes,public.du_students,public.du_answers,public.du_cards,public.du_sessions,public.du_votes,public.du_rate_limits from anon,authenticated;
grant all on public.du_classes,public.du_students,public.du_answers,public.du_cards,public.du_sessions,public.du_votes,public.du_rate_limits to service_role;
create function public.du_rate_limit(p_key text, p_limit int, p_seconds int) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n int; begin
 insert into public.du_rate_limits as r(key,window_at,hits) values(p_key,now(),1)
 on conflict(key) do update set hits=case when r.window_at<now()-make_interval(secs=>p_seconds) then 1 else r.hits+1 end,
 window_at=case when r.window_at<now()-make_interval(secs=>p_seconds) then now() else r.window_at end returning hits into n;
 return n<=p_limit;
end $$;
revoke all on function public.du_rate_limit(text,int,int) from public,anon,authenticated;
grant execute on function public.du_rate_limit(text,int,int) to service_role;
commit;
