import Link from "next/link";
import { Camera, ChevronRight, Sparkles, ClipboardList } from "lucide-react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { PUBLIC_GRADE_UNIT_PRICES, type GradeUnitPrices } from "@/lib/pricing";
import PricePreviewCard, { type CategoryRange } from "./PricePreviewCard";
import HeroTabToggle from "./HeroTabToggle";
import HeroLiveFeed from "./HeroLiveFeed";

const CATEGORY_ICONS = [
  { emoji: "🕊️", label: "근조화환" },
  { emoji: "💐", label: "축하화환" },
  { emoji: "🎉", label: "개업화환" },
  { emoji: "🏢", label: "기업행사" },
  { emoji: "🌸", label: "생화화환" },
  { emoji: "🎀", label: "조화화환" },
];

const FEATURE_BADGES = [
  { value: "0원", label: "수거비용 부담" },
  { value: "1장", label: "사진이면 충분" },
  { value: "가입없이", label: "바로 확인" },
];

// 화환 종류별 대표 등급 × 수량 범위 (실제 시세표(WreathTypes)와 동일한 기준 사용)
const CATEGORY_DEFS: { label: string; grade: keyof GradeUnitPrices; qtyMin: number; qtyMax: number }[] = [
  { label: "근조화환", grade: "premium", qtyMin: 1, qtyMax: 10 },
  { label: "축하화환", grade: "a", qtyMin: 1, qtyMax: 10 },
  { label: "개업화환", grade: "a", qtyMin: 1, qtyMax: 8 },
  { label: "기업행사", grade: "b", qtyMin: 5, qtyMax: 20 },
  { label: "생화화환", grade: "premium", qtyMin: 1, qtyMax: 5 },
  { label: "조화화환", grade: "c", qtyMin: 1, qtyMax: 10 },
];

/** 관리자 설정(grade_prices)의 실제 단가를 기준으로 화환 종류별 참고 매입가 범위를 계산 */
async function getCategoryRanges(): Promise<CategoryRange[]> {
  const prices: GradeUnitPrices = { ...PUBLIC_GRADE_UNIT_PRICES };

  if (isServiceRoleConfigured()) {
    try {
      const supabase = await createServiceRoleClient();
      const { data } = await supabase
        .from("grade_prices")
        .select("unit_price, wreath_grades(code)")
        .eq("is_current", true);

      for (const row of data ?? []) {
        const code = (row as unknown as { wreath_grades: { code: string } }).wreath_grades?.code;
        if (code && code in prices) {
          prices[code as keyof GradeUnitPrices] = row.unit_price as number;
        }
      }
    } catch {
      // 조회 실패 시 기본값(prices) 그대로 사용
    }
  }

  return CATEGORY_DEFS.map((def) => ({
    label: def.label,
    min: prices[def.grade] * def.qtyMin,
    max: prices[def.grade] * def.qtyMax,
  }));
}

export default async function Hero() {
  const categoryRanges = await getCategoryRanges();

  let loggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = Boolean(user);
  } catch {
    loggedIn = false;
  }

  return (
    <section className="mx-auto max-w-lg px-5 pt-2 pb-8">
      {/* 로그인한 회원에게만 보이는 접수현황 바로가기 배너 */}
      {loggedIn && (
        <Link
          href="/status"
          className="hover-lift fade-up mb-3 flex items-center gap-2.5 rounded-2xl bg-foreground px-4 py-3.5 text-white"
        >
          <ClipboardList size={18} strokeWidth={2} className="shrink-0 text-brand" />
          <span className="min-w-0 flex-1 text-[13.5px] font-medium">
            내 접수현황과 페이백 지급현황을 확인해보세요
          </span>
          <ChevronRight size={16} className="shrink-0 text-white/60" />
        </Link>
      )}

      {/* 상단 탭: 시세조회 / 접수하기 (슬라이딩 애니메이션) */}
      <div className="fade-up">
        <HeroTabToggle />
      </div>

      {/* 이용전에 + 헤드라인 */}
      <div className="fade-up mt-7" style={{ animationDelay: "60ms" }}>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-brand">
          <Sparkles size={15} strokeWidth={2} />
          수거 전에
        </p>
        <h1 className="mt-2 text-[26px] font-extrabold leading-[1.3] tracking-tight">
          받은 화환,
          <br />
          지금 페이백하면 얼마일까요?
        </h1>
      </div>

      {/* 화환 종류 아이콘 행 */}
      <div className="fade-up mt-5 flex gap-3 overflow-x-auto" style={{ animationDelay: "100ms" }}>
        {CATEGORY_ICONS.map((cat) => (
          <div key={cat.label} className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-[22px]">
              {cat.emoji}
            </div>
            <span className="text-[10.5px] text-muted-light">{cat.label}</span>
          </div>
        ))}
      </div>

      <p className="fade-up mt-5 text-[13.5px] leading-relaxed text-muted" style={{ animationDelay: "140ms" }}>
        사진 한 장으로 시세를 확인하고,
        <br />
        원할 때 방문수거까지 한 번에 신청하세요.
      </p>

      {/* 특징 배지 3개 */}
      <div className="fade-up mt-5 grid grid-cols-3 gap-2.5" style={{ animationDelay: "180ms" }}>
        {FEATURE_BADGES.map((b) => (
          <div key={b.label} className="rounded-xl border border-border bg-white py-3 text-center">
            <p className="text-[15px] font-extrabold">{b.value}</p>
            <p className="mt-0.5 text-[10.5px] text-muted-light">{b.label}</p>
          </div>
        ))}
      </div>

      {/* 사진 올리고 확인하기 카드 */}
      <Link
        href="/estimate"
        className="hover-lift mt-5 flex items-center gap-3 rounded-2xl border border-border bg-white p-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-dark">
          <Camera size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold">사진 올리고 페이백 확인하기</p>
          <p className="mt-0.5 text-[12px] text-muted-light">등급별 시세도 함께 확인할 수 있어요</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-muted-light" />
      </Link>

      {/* 실시간 접수현황 (컴팩트) */}
      <HeroLiveFeed />

      {/* 시세 조회 결과 미리보기 */}
      <h2 id="pricing" className="fade-up mt-8 scroll-mt-20 text-[15px] font-bold">
        시세 조회 결과 미리보기
      </h2>
      <PricePreviewCard categories={categoryRanges} />

      {/* 큰 하단 CTA */}
      <Link
        href="/estimate"
        className="hover-lift mt-6 flex h-14 items-center justify-center rounded-2xl bg-brand text-[16px] font-bold text-white shadow-[0_12px_28px_-10px_rgba(15,157,104,0.55)]"
      >
        사진으로 페이백 확인하기
      </Link>
    </section>
  );
}
