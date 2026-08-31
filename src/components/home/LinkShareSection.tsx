"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

type ServiceKey = "wreath" | "plant";

interface RoleCard {
  key: string;
  label: string; // "친구에게" 등
  big: string;
  small: string;
}

const WREATH_ROLES: RoleCard[] = [
  {
    key: "friend",
    label: "친구에게",
    big: "야, 화환까지 네가 챙길 필요는 없잖아.",
    small: "행사 끝나면 꽃페이가 회수와 정리를 도와준대.",
  },
  {
    key: "family",
    label: "가족·친지에게",
    big: "정신없는 날, 화환 정리까지 덜어드릴게요.",
    small: "방문회수부터 예상 페이백 확인까지 한 번에.",
  },
  {
    key: "couple",
    label: "신랑·신부에게",
    big: "결혼식은 끝났고, 화환은 남았습니다.",
    small: "받은 화환, 그냥 두고 가지 마세요.",
  },
];

const PLANT_ROLES: RoleCard[] = [
  {
    key: "friend",
    label: "친구에게",
    big: "야, 개업 축하는 했고 화분까지 키울 필요는 없잖아.",
    small: "남은 개업화분, 꽃페이에 맡겨봐.",
  },
  {
    key: "ceo",
    label: "대표님에게",
    big: "대표님, 화분도 출근 도장 찍어야 하나요?",
    small: "개업 후 남은 화분의 회수·정리 가능 여부를 확인하세요.",
  },
  {
    key: "staff",
    label: "직원·총무에게",
    big: "사무실 화분 12개, 관리 담당자는 아직도 공석입니다.",
    small: "대표님께 꽃페이 화분 정리 링크를 보내주세요.",
  },
];

const SERVICE_META: Record<
  ServiceKey,
  { tabLabel: string; accent: string; accentBg: string; buttonLabel: string; path: string; roles: RoleCard[] }
> = {
  wreath: {
    tabLabel: "화환 정리",
    accent: "#102A22",
    accentBg: "#E7EBE4",
    buttonLabel: "화환 정리 링크 보내기",
    path: "/estimate",
    roles: WREATH_ROLES,
  },
  plant: {
    tabLabel: "개업화분 정리",
    accent: "#0B6B4F",
    accentBg: "#E6F2EC",
    buttonLabel: "화분 정리 링크 보내기",
    path: "/plant-collection",
    roles: PLANT_ROLES,
  },
};

export default function LinkShareSection() {
  const [service, setService] = useState<ServiceKey>("wreath");
  const [selectedRoleKey, setSelectedRoleKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const meta = SERVICE_META[service];
  const selectedRole = meta.roles.find((r) => r.key === selectedRoleKey) ?? null;

  function handleServiceChange(next: ServiceKey) {
    setService(next);
    setSelectedRoleKey(null);
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  async function handleShare() {
    if (!selectedRole) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}${meta.path}?service=${service}&source=share&role=${selectedRole.key}`;
    const shareText = `${selectedRole.big}\n${selectedRole.small}`;
    const shareTitle = "꽃페이 | 행사 후 화환·화분 정리";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // 사용자가 공유를 취소한 경우 등 - 별도 처리 없이 조용히 종료
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("꽃페이 링크가 복사되었습니다. 필요한 분께 전달해보세요.");
    } catch {
      showToast("링크 복사에 실패했어요. 다시 시도해주세요.");
    }
  }

  return (
    <section className="relative bg-[#F6F3EE]">
      <div className="mx-auto max-w-[1120px] px-5 py-14 md:px-8 md:py-20">
        {/* 헤드라인 */}
        <p className="text-[13px] font-semibold" style={{ color: meta.accent }}>
          행사 끝난 뒤
        </p>
        <h2 className="mt-2 text-[24px] font-extrabold leading-[1.35] tracking-tight text-[#1D211F] md:text-[32px]">
          축하는 받으세요.
          <br />
          정리는 꽃페이가 할게요.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#727872] md:text-[15.5px]">
          정신없는 행사 당일, 화환과 개업화분 정리 링크를 대신 보내주세요.
        </p>

        {/* 서비스 탭 */}
        <div className="relative mt-7 flex max-w-[320px] rounded-full bg-white p-1 shadow-[0_2px_10px_-4px_rgba(23,26,24,0.12)]">
          <div
            className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out"
            style={{
              backgroundColor: SERVICE_META[service].accent,
              transform: service === "wreath" ? "translateX(0%)" : "translateX(calc(100% + 8px))",
            }}
          />
          <button
            type="button"
            onClick={() => handleServiceChange("wreath")}
            className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13px] font-semibold transition-colors md:text-[13.5px] ${
              service === "wreath" ? "text-white" : "text-[#727872]"
            }`}
          >
            화환 정리
          </button>
          <button
            type="button"
            onClick={() => handleServiceChange("plant")}
            className={`relative z-10 flex-1 rounded-full py-2.5 text-center text-[13px] font-semibold transition-colors md:text-[13.5px] ${
              service === "plant" ? "text-white" : "text-[#727872]"
            }`}
          >
            개업화분 정리
          </button>
        </div>

        {/* 역할 카드 3개 */}
        <div key={service} className="fade-up mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {meta.roles.map((role) => {
            const isSelected = selectedRoleKey === role.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => setSelectedRoleKey(role.key)}
                className="hover-lift relative rounded-[18px] border bg-white p-5 text-left"
                style={
                  isSelected
                    ? { borderColor: meta.accent, backgroundColor: meta.accentBg }
                    : { borderColor: "#DCD8CF" }
                }
              >
                <span
                  className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: isSelected ? "white" : "#F6F3EE", color: meta.accent }}
                >
                  {role.label}
                </span>
                <p className="mt-3 text-[15px] font-bold leading-snug text-[#1D211F]">{role.big}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#727872]">{role.small}</p>
                {isSelected && (
                  <span
                    className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: meta.accent }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 공유 버튼 */}
        {selectedRole && (
          <div className="fade-up mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleShare}
              className="hover-lift flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white md:w-auto md:px-10"
              style={{ backgroundColor: meta.accent }}
            >
              <Share2 size={18} strokeWidth={2} />
              {meta.buttonLabel}
            </button>
          </div>
        )}
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-5">
          <div className="rounded-full bg-[#1D211F] px-5 py-3 text-[13px] font-medium text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </section>
  );
}
