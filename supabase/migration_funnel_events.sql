-- 방문 → 신청 단계별 집계(개인정보·쿠키 없음, 날짜·단계·유입처별 횟수만). 서비스 롤 전용.
create table if not exists funnel_events (
  day date not null,
  event text not null,
  source text not null default 'web',
  hits int not null default 0,
  primary key (day, event, source)
);
alter table funnel_events enable row level security;

create or replace function public.funnel_hit(p_event text, p_source text)
returns void
language sql
set search_path = public
as $$
  insert into funnel_events(day, event, source, hits)
  values ((now() at time zone 'Asia/Seoul')::date, p_event, p_source, 1)
  on conflict (day, event, source) do update set hits = funnel_events.hits + 1;
$$;
revoke execute on function public.funnel_hit(text, text) from public, anon, authenticated;
grant execute on function public.funnel_hit(text, text) to service_role;
