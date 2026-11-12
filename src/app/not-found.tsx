import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-[13px] font-semibold tracking-wide text-brass">404</p>
      <h1 className="mt-2 text-[22px] font-extrabold">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-[14px] text-muted">주소가 바뀌었거나 없어진 페이지예요.</p>
      <Link href="/" className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white">
        홈으로 가기
      </Link>
    </div>
  );
}
