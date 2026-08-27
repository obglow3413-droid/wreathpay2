import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-5xl px-5 py-10 text-[12.5px] leading-relaxed text-muted-light">
        <p className="font-semibold text-muted">꽃깞</p>
        <p className="mt-2">
          상호명 (주)루우크컴퍼니 · 대표 이두형 · 사업자등록번호 230-99-03514
          <br />
          사업장주소 경기도 고양시 덕양구 향동동 515-1
          <br />
          통신판매업신고 2026-고양덕양구-0537호
        </p>
        <p className="mt-2">
          고객센터 010-5333-3413 · 운영시간 평일 09:00 - 18:00 (주말·공휴일 휴무)
        </p>
        <p className="mt-3 space-x-3">
          <Link href="/about" className="underline hover:text-muted">
            서비스소개
          </Link>
          <Link href="/driver" className="underline hover:text-muted">
            수거기사 모집
          </Link>
          <Link href="/partner" className="underline hover:text-muted">
            업체·파트너 등록
          </Link>
        </p>
        <p className="mt-4">© 꽃깞. All rights reserved.</p>
      </div>
    </footer>
  );
}
