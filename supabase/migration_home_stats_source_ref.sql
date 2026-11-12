-- 홈 실적 수동 표시값(관리자 수정) + 유입 경로(제휴 장소·친구 추천) 추적
insert into system_settings (key, value, description)
values ('home_stats', '{"weekCount":67,"returnedAmount":13278000}'::jsonb, '홈 실적 수동 표시값(관리자 수정). 값이 0이면 DB 집계를 그대로 표시')
on conflict (key) do nothing;

alter table estimate_requests add column if not exists source_ref text;   -- 'place:<slug>' | 'ref:<추천코드>'
alter table estimate_requests add column if not exists ref_code text;     -- 이 신청 고객의 추천 코드
update estimate_requests set ref_code = substr(md5(id::text || 'kp'), 1, 7) where ref_code is null;
create unique index if not exists estimate_requests_ref_code_key on estimate_requests (ref_code);
create index if not exists estimate_requests_source_ref_idx on estimate_requests (source_ref);
