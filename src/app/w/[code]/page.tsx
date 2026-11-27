import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BackHeader from "@/components/layout/BackHeader";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { WP_CODE_RE } from "@/lib/weddingPartners";
import SaveWpRef from "@/components/wp/SaveWpRef";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "결혼식 화환 페이백 접수",
  description: "웨딩플래너 추천 · 결혼식이 끝나고 남는 축하화환, 사진 한 장으로 접수하고 수거 후 페이백 받으세요.",
  robots: { index: false, follow: false },
};

/** 웨딩 파트너 추천 링크/QR 랜딩: 승인된 파트너 코드만 기억하고 결혼식 접수로 안내한다. */
export default async function PartnerReferralLanding({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = raw.toLowerCase();
  if (!WP_CODE_RE.test(code) || !isServiceRoleConfigured()) redirect("/landing/wedding");

  let partner: { name: string; company: string | null } | null = null;
  try {
    const svc = await createServiceRoleClient();
    const { data } = await svc.from("wedding_partners").select("name, company, status").eq("code", code).maybeSingle();
    if (data?.status === "approved") partner = { name: data.name, company: data.company };
  } catch {}
  if (!partner) redirect("/landing/wedding");

  const who = partner.company ? `${partner.company} ${partner.name} 플래너` : `${partner.name} 플래너`;

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <SaveWpRef code={code} name={who} />
      <main className="flex-1">
        <section className="bg-[#141211] px-5 pt-12 pb-10 text-[#f7f4f0]">
          <div className="mx-auto max-w-lg">
            <p className="inline-block rounded-full border border-[#e9cf97]/40 px-3 py-1 text-[12px] font-semibold text-[#e9cf97]">{who}님 추천</p>
            <h1 className="mt-4 text-[28px] font-extrabold leading-[1.3] tracking-tight">
              결혼식 끝나고 남는 화환,
              <br />
              <span className="text-[#e9cf97]">페이백</span>으로 돌려받으세요
            </h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-[#f7f4f0]/75">
              하객이 보낸 축하화환은 신랑·신부 몫이에요. 사진 한 장으로 접수하면 꽃페이 기사님이 예식장에서 수거하고, 수거 후 페이백해 드려요.
            </p>
            <p className="mt-6 text-[13px] text-[#f7f4f0]/60">서울·수도권 예식 · 최대 100만 원 페이백</p>
          </div>
        </section>
        <section className="px-5 py-8">
          <div className="mx-auto max-w-lg space-y-2.5">
            <Link href="/estimate?eventType=wedding" className="flex h-14 items-center justify-center rounded-xl bg-brand text-[16px] font-bold text-white">
              예식 끝났어요 · 사진으로 접수
            </Link>
            <Link href="/reserve" className="flex h-14 items-center justify-center rounded-xl border border-border bg-white text-[15px] font-semibold">
              예식 전이에요 · 날짜 맞춰 미리 예약
            </Link>
            <ol className="mt-6 space-y-2.5 rounded-2xl border border-border bg-white p-5 text-[13.5px] leading-relaxed text-muted">
              <li><b className="text-foreground">1.</b> 화환 사진을 올리면 예상 페이백 범위를 안내해 드려요.</li>
              <li><b className="text-foreground">2.</b> 예식장 반출 가능 여부와 수거 일정을 확인해요.</li>
              <li><b className="text-foreground">3.</b> 기사님이 수거하고, 수량·상태 확인 후 등록한 계좌로 페이백해요.</li>
            </ol>
            <p className="pt-2 text-[12px] leading-relaxed text-muted-light">
              접수 시 개인정보 수집·이용 동의는 고객님이 직접 해요. 추천 플래너에게 이름 일부·예식일을 보여줄지는 선택할 수 있고, 연락처는 공유되지 않아요.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
