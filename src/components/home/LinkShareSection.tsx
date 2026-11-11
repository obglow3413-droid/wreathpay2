"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useServiceTab, type ServiceKey } from "./ServiceTabContext";

interface RoleCard {
  key: string;
  label: string;
  big: string;
  small: string;
}

const ROLES: Record<ServiceKey, RoleCard[]> = {
  celebration: [
    {
      key: "friend",
      label: "친구에게",
      big: "야, 화환까지 네가 챙길 필요는 없잖아.",
      small: "행사 끝나면 KKOT PAY가 회수와 정리를 도와준대.",
    },
    {
      key: "ceo",
      label: "대표님에게",
      big: "개업 축하 화환, 정리는 맡기시고 페이백 받으세요.",
      small: "사진 한 장이면 예상 페이백을 바로 확인할 수 있어요.",
    },
    {
      key: "couple",
      label: "신랑·신부에게",
      big: "결혼식은 끝났고, 화환은 남았습니다.",
      small: "받은 화환, 그냥 두고 가지 마세요.",
    },
  ],
  funeral: [
    {
      key: "family",
      label: "상주·가족에게",
      big: "경황없는 중에 화환 정리까지 마음 쓰지 않으셔도 됩니다.",
      small: "조문이 끝나면 정중히 방문수거해 드립니다.",
    },
    {
      key: "friend",
      label: "지인에게",
      big: "근조화환 정리, KKOT PAY에 맡겨보시라고 전해주세요.",
      small: "사진 확인 후 수거 가능 여부를 안내해 드립니다.",
    },
    {
      key: "hall",
      label: "장례식장 담당자에게",
      big: "행사 후 남는 근조화환, 신속하게 수거해 드립니다.",
      small: "수거비용 부담 없이 빠르게 정리할 수 있어요.",
    },
  ],
};

const META: Record<ServiceKey, { buttonLabel: string; path: string; eventType: string }> = {
  celebration: { buttonLabel: "축하화환 정리 링크 보내기", path: "/estimate", eventType: "opening" },
  funeral: { buttonLabel: "근조화환 정리 링크 보내기", path: "/estimate", eventType: "funeral" },
};

export default function LinkShareSection() {
  const { active } = useServiceTab();
  const [selected, setSelected] = useState<{ service: ServiceKey; key: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const meta = META[active];
  const roles = ROLES[active];
  // 탭이 바뀌면 다른 서비스의 선택은 자동으로 무효 처리
  const selectedRole = selected && selected.service === active ? roles.find((r) => r.key === selected.key) ?? null : null;

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  async function handleShare() {
    if (!selectedRole) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}${meta.path}?eventType=${meta.eventType}&source=share&role=${selectedRole.key}`;
    const shareText = `${selectedRole.big}\n${selectedRole.small}`;
    const shareTitle = "KKOT PAY | 행사 후 화환 정리";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch {
        // 사용자가 공유를 취소한 경우 등 - 조용히 종료
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("KKOT PAY 링크가 복사되었습니다. 필요한 분께 전달해보세요.");
    } catch {
      showToast("링크 복사에 실패했어요. 다시 시도해주세요.");
    }
  }

  return (
    <section className="relative border-t border-line bg-paper">
      <div className="mx-auto max-w-[1120px] px-5 py-14 md:px-8 md:py-20">
        <p className="text-[13px] font-semibold text-brass">
          {active === "funeral" ? "조문이 끝난 뒤" : "행사 끝난 뒤"}
        </p>
        <h2 className="mt-2 text-[24px] font-extrabold leading-[1.35] tracking-tight text-foreground md:text-[32px]">
          {active === "funeral" ? (
            <>
              마음은 받으셨으니,
              <br />
              정리는 KKOT PAY가 하겠습니다.
            </>
          ) : (
            <>
              축하는 받으세요.
              <br />
              정리는 KKOT PAY가 할게요.
            </>
          )}
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted md:text-[15.5px]">
          정신없는 행사 당일, 화환 정리 링크를 대신 보내주세요.
        </p>

        <div key={active} className="tab-fade mt-7 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {roles.map((role) => {
            const isSelected = selectedRole?.key === role.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => setSelected({ service: active, key: role.key })}
                className={`hover-lift relative rounded-[18px] border p-5 text-left ${
                  isSelected ? "border-foreground bg-brand-tint" : "border-line bg-ivory"
                }`}
              >
                <span className="inline-block rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-brass">
                  {role.label}
                </span>
                <p className="mt-3 break-keep text-[15px] font-bold leading-snug text-foreground">{role.big}</p>
                <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-muted">{role.small}</p>
                {isSelected && (
                  <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-ivory">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedRole && (
          <div className="fade-up mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleShare}
              className="hover-lift flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-forest text-[15px] font-bold text-ivory md:w-auto md:px-10"
            >
              <Share2 size={18} strokeWidth={2} />
              {meta.buttonLabel}
            </button>
          </div>
        )}
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
