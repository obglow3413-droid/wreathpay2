"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[22px] font-extrabold">잠시 문제가 생겼어요</h1>
      <p className="mt-2 text-[14px] text-muted">잠시 후 다시 시도해 주세요. 계속되면 채널톡으로 알려주세요.</p>
      <button type="button" onClick={reset} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white">
        다시 시도
      </button>
      <a href="https://d5dpz.channel.io" target="_blank" rel="noopener noreferrer" className="mt-3 text-[13px] text-muted underline">
        채널톡 문의
      </a>
    </div>
  );
}
