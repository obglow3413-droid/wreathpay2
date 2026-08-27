-- =========================================================
-- 회원이 자신의 신청건에 업로드된 사진을 조회할 수 있도록 권한 추가
-- (SQL Editor에서 이 파일 내용만 추가로 실행하세요)
-- =========================================================

create policy "member can read own estimate_images" on estimate_images
  for select to authenticated
  using (
    exists (
      select 1 from estimate_requests er
      where er.id = estimate_images.estimate_request_id
        and er.auth_user_id = auth.uid()
    )
  );
