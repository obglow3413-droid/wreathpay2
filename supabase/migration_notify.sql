-- 진행 알림 신청(문자) 여부와 마지막 발송 상태. Supabase SQL Editor 에서 한 번 실행.
alter table estimate_requests add column if not exists notify_opt_in boolean not null default false;
alter table estimate_requests add column if not exists notified_status text;
