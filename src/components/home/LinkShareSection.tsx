"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useServiceTab } from "./ServiceTabContext";

const COPY = {
  celebration: {
    title: "행사 끝난 화환, 대신 보내주세요",
    desc: "받은 분께 링크 한 번이면 신청 화면으로 바로 연결돼요.",
    shareText: "행사 끝난 화환, 사진 한 장이면 수거와 페이백을 확인할 수 있어요.",
    eventType: "opening",
  },
  funeral: {
    title: "경황없는 가족 대신 링크를 보내주세요",
    desc: "조문이 끝난 근조화환 정리를 링크 한 번으로 안내할 수 있어요.",
    shareText: "근조화환 정리는 사진 한 장으로 신청하실 수 있어요. 정중히 수거해 드립니다.",
    eventType: "funeral",
  },
} as const;

export default function LinkShareSection() {
  const { active } = useServiceTab();
  const [toast, setToast] = useState<string | null>(null);
  const copy = COPY[active];

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  async function handleShare() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/estimate?eventType=${copy.eventType}&source=share`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "KKOT PAY | 화환 수거 신청", text: copy.shareText, url });
      } catch {
        // 공유 취소 등은 조용히 종료
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크가 복사되었어요. 필요한 분께 전달해보세요.");
    } catch {
      showToast("링크 복사에 실패했어요. 다시 시도해주세요.");
    }
  }

  return (
    <section className="relative border-t border-line bg-paper">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8 md:py-16">
        <div key={active} className="tab-fade">
          <h2 className="text-[20px] font-extrabold leading-snug md:text-[26px]">{copy.title}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted md:text-[15px]">{copy.desc}</p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="hover-lift flex h-13 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-foreground text-[15px] font-bold text-foreground md:w-auto md:px-8"
        >
          <Share2 size={18} strokeWidth={2} />
          링크 보내기
        </button>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-5">
          <div className="rounded-full bg-foreground px-5 py-3 text-[13px] font-medium text-ivory shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </section>
  );
}
