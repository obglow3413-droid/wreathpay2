import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentPartner } from "@/lib/wpAuth";
import { computeBalance, loadWpSettings } from "@/lib/weddingPartners";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";
import { notifyAdmin } from "@/lib/notify";

export const runtime = "nodejs";

/** 파트너 수익금 출금 신청: 확정된 소개비 중 아직 신청·지급되지 않은 금액 안에서만 가능. */
export async function POST(req: Request) {
  const { partner } = await getCurrentPartner();
  if (!partner) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (partner.status !== "approved") return NextResponse.json({ error: "승인된 파트너만 출금할 수 있어요." }, { status: 403 });
  if (await rateLimitedShared(`wpwd:${partner.id}:${clientIp(req)}`, 5, 3600)) {
    return NextResponse.json({ error: "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const svc = await createServiceRoleClient();
  const { data: full } = await svc.from("wedding_partners").select("bank_name, account_holder, account_enc, account_last4").eq("id", partner.id).single();
  if (!full?.account_enc) return NextResponse.json({ error: "먼저 수익금 받을 계좌를 등록해 주세요." }, { status: 400 });

  const b = (await req.json().catch(() => ({}))) as { amount?: unknown };
  const amount = Math.floor(Number(b.amount));
  const settings = await loadWpSettings(svc);

  const [{ data: refs }, { data: wds }] = await Promise.all([
    svc.from("wp_referrals").select("commission_status, commission_amount").eq("partner_id", partner.id),
    svc.from("wp_withdrawals").select("status, amount").eq("partner_id", partner.id),
  ]);
  const bal = computeBalance(refs ?? [], wds ?? []);

  if (!Number.isFinite(amount) || amount < settings.minWithdrawal) {
    return NextResponse.json({ error: `최소 ${settings.minWithdrawal.toLocaleString("ko-KR")}원부터 출금할 수 있어요.` }, { status: 400 });
  }
  if (amount > bal.available) return NextResponse.json({ error: "출금 가능 금액을 넘었어요." }, { status: 400 });

  const { error } = await svc.from("wp_withdrawals").insert({
    partner_id: partner.id,
    amount,
    bank_name: full.bank_name,
    account_holder: full.account_holder,
    account_enc: full.account_enc,
    account_last4: full.account_last4,
  });
  if (error) return NextResponse.json({ error: "신청하지 못했어요." }, { status: 500 });
  await notifyAdmin(`[KKOT PAY] 웨딩 파트너 출금 신청: ${partner.name} ${amount.toLocaleString("ko-KR")}원`);
  return NextResponse.json({ ok: true });
}
