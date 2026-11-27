import type { Metadata } from "next";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { DEFAULT_WP_SETTINGS, loadWpSettings, tierLabel } from "@/lib/weddingPartners";

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: "웨딩플래너 제휴 · 꽃페이 WEDDING PARTNERS | KKOT PAY 꽃페이" },
  description:
    "웨딩플래너 전용 제휴 프로그램. 신랑·신부를 소개하면 결혼식 화환 수거 1건당 최대 10만 원 소개 수익. 가입비 없음, 직접 수거 없음, 접수부터 수거·정산까지 꽃페이가 진행합니다.",
  alternates: { canonical: "/wedding-partners" },
  openGraph: {
    title: "웨딩플래너님, 새로운 수익을 만들어보세요 | 꽃페이 WEDDING PARTNERS",
    description: "고객 소개 1건당 최대 10만 원. 가입비 없음 · 직접 수거 없음 · 정산까지 꽃페이가 진행.",
    url: "/wedding-partners",
  },
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const STEPS = [
  { t: "파트너 가입", d: "1분 가입 후 관리자 승인을 받아요." },
  { t: "추천 링크·QR 발급", d: "나만의 추천 코드, 접수 링크, QR코드가 자동으로 만들어져요." },
  { t: "신랑·신부 접수", d: "고객이 링크나 QR로 직접 접수해요. 개인정보 동의도 고객이 직접 해요." },
  { t: "수거 일정 확정", d: "꽃페이가 고객과 예식 날짜·장소를 확인하고 일정을 잡아요." },
  { t: "화환 수거", d: "예식이 끝나면 꽃페이 기사님이 수거해요. 플래너님은 아무것도 옮기지 않아요." },
  { t: "검수·판매 정산", d: "수거 수량과 상태를 검수하고 판매 정산을 마쳐요." },
  { t: "소개비 확정", d: "실제 수거 수량 기준으로 소개비가 확정돼요." },
  { t: "수익금 지급", d: "대시보드에서 출금을 신청하면 등록한 계좌로 지급해요." },
];

const FAQ = [
  {
    q: "고객 페이백이 줄어드나요?",
    a: "아니요. 고객 페이백과 파트너 소개비는 별도로 운영해요. 플래너님 소개로 고객 혜택이 줄지 않아요.",
  },
  {
    q: "소개비는 언제 확정되나요?",
    a: "실제 수거와 검수·판매 정산이 끝난 건을 기준으로, 수거 수량 구간에 맞춰 확정돼요. 접수만 되고 수거되지 않은 건은 지급 대상이 아니에요.",
  },
  {
    q: "어느 지역, 어떤 화환이 대상인가요?",
    a: "서울·수도권 예식의 결혼식 축하화환(스탠드 화환)이 대상이에요. 수거 전 고객의 화환 처분 권한과 예식장 반출 가능 여부를 꽃페이가 확인해요.",
  },
  {
    q: "고객 정보는 어디까지 보이나요?",
    a: "이름 일부(예: 김*수)와 예식일은 고객이 공유에 동의한 경우에만 보여드려요. 진행 상태와 수거 수량·소개비는 정산 확인을 위해 보여드리고, 연락처는 공유하지 않아요.",
  },
  {
    q: "소속 회사가 있어도 되나요?",
    a: "가능해요. 다만 소속 회사의 제휴·겸업 규정을 지켜 주셔야 하며, 가입 시 이에 동의해 주셔야 해요.",
  },
];

export default async function WeddingPartnersLanding() {
  let settings = DEFAULT_WP_SETTINGS;
  if (isServiceRoleConfigured()) {
    try {
      settings = await loadWpSettings(await createServiceRoleClient());
    } catch {}
  }
  const tiers = tierLabel(settings.tiers);
  const max = Math.max(...settings.tiers.map((t) => t.amount));

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#141211] px-5 pt-14 pb-12 text-[#f7f4f0]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-[-80px] h-[320px] w-[320px] rounded-full opacity-60"
            style={{ background: "radial-gradient(closest-side, rgba(233,207,151,0.35), rgba(233,207,151,0))" }}
          />
          <div className="relative mx-auto max-w-lg">
            <p className="text-[12px] font-bold tracking-[0.28em] text-[#e9cf97]">KKOT PAY · WEDDING PARTNERS</p>
            <h1 className="mt-4 text-[30px] font-extrabold leading-[1.3] tracking-tight">
              웨딩플래너님,
              <br />
              <span className="text-[#e9cf97]">새로운 수익</span>을 만들어보세요.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#f7f4f0]/75">
              결혼식이 끝난 후 남겨지는 수많은 축하화환. 꽃페이를 통해 신랑·신부에게는 페이백 혜택을, 플래너님에게는 새로운 소개 수익을 드려요.
            </p>
            <div className="mt-8 rounded-2xl border border-[#e9cf97]/25 bg-white/[0.04] p-5">
              <p className="text-[13px] text-[#f7f4f0]/70">고객 소개 1건당</p>
              <p className="mt-1 text-[38px] font-black leading-none tracking-tight text-[#e9cf97]">
                최대 {max >= 10000 ? `${Math.round(max / 10000)}만 원` : won(max)}
              </p>
              <p className="mt-2 text-[12.5px] text-[#f7f4f0]/60">실제 수거·판매 정산 완료 건 기준 · 고객 페이백과 별도</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <Link href="/wedding-partners/join" className="flex h-13 items-center justify-center rounded-xl bg-[#e9cf97] py-3.5 text-[15px] font-bold text-[#141211]">
                파트너 가입하기
              </Link>
              <Link href="/wedding-partners/login" className="flex h-13 items-center justify-center rounded-xl border border-white/25 py-3.5 text-[15px] font-semibold text-[#f7f4f0]">
                파트너 로그인
              </Link>
            </div>
          </div>
        </section>

        {/* 혜택 */}
        <section className="px-5 py-10">
          <div className="mx-auto max-w-lg">
            <h2 className="text-[20px] font-extrabold tracking-tight">플래너님은 소개만 하세요</h2>
            <ul className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                ["가입비 0원", "별도 가입비·월 이용료가 없어요"],
                ["직접 수거 없음", "옮기는 일은 꽃페이 기사님이 해요"],
                ["정산까지 대행", "접수부터 수거·정산까지 꽃페이가"],
                ["별도 수익", "고객 페이백과 따로 지급돼요"],
              ].map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-[15px] font-bold">✔ {t}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 수익 구조 */}
        <section className="border-y border-border bg-surface px-5 py-10">
          <div className="mx-auto max-w-lg">
            <h2 className="text-[20px] font-extrabold tracking-tight">소개 수익 구조</h2>
            <p className="mt-2 text-[13.5px] text-muted">실제 수거된 화환 수량 기준으로 1건마다 지급돼요.</p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
              {tiers.map((t, i) => (
                <div key={t.range} className={`flex items-center justify-between px-5 py-4 ${i ? "border-t border-border" : ""}`}>
                  <span className="text-[14.5px] font-semibold">화환 {t.range}</span>
                  <span className="text-[17px] font-extrabold tabular-nums">{won(t.amount)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-light">
              ※ 소개비는 수거 수량 및 판매 정산 완료 기준으로 지급돼요. {settings.tiers[0]?.min ?? 30}개 미만 건은 소개비 대상이 아니에요. 중복 접수·본인 추천 등 부정 추천은 지급되지 않아요.
            </p>
          </div>
        </section>

        {/* 진행 과정 */}
        <section className="px-5 py-10">
          <div className="mx-auto max-w-lg">
            <h2 className="text-[20px] font-extrabold tracking-tight">진행 과정</h2>
            <ol className="mt-5 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#141211] text-[12px] font-bold text-[#e9cf97]">{i + 1}</span>
                  <div>
                    <p className="text-[14.5px] font-bold">{s.t}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 운영 기준 */}
        <section className="border-t border-border bg-surface px-5 py-10">
          <div className="mx-auto max-w-lg">
            <h2 className="text-[20px] font-extrabold tracking-tight">운영 기준</h2>
            <ul className="mt-4 space-y-2.5 text-[13.5px] leading-relaxed text-muted">
              <li>· 수거 지역: 서울·수도권 예식 (지역 외 예식은 접수 후 개별 안내)</li>
              <li>· 대상 품목: 결혼식 축하화환(스탠드 화환)</li>
              <li>· 고객의 화환 처분 권한과 예식장 반출 가능 여부를 수거 전에 확인해요</li>
              <li>· 파트너는 소속 회사의 제휴·겸업 규정을 지켜야 해요</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-10">
          <div className="mx-auto max-w-lg">
            <h2 className="text-[20px] font-extrabold tracking-tight">자주 묻는 질문</h2>
            <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-white">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-[14.5px] font-semibold">
                    {f.q}
                    <span className="float-right text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/wedding-partners/join" className="mt-8 flex h-14 items-center justify-center rounded-xl bg-brand text-[16px] font-bold text-white">
              웨딩 파트너 가입하기
            </Link>
            <p className="mt-3 text-center text-[12.5px] text-muted">
              이미 가입하셨나요?{" "}
              <Link href="/wedding-partners/login" className="font-semibold underline">
                로그인
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
