import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentPartner } from "@/lib/wpAuth";
import { BANKS, encryptAccount, isAccountStorageConfigured } from "@/lib/payoutAccount";
import { clientIp, rateLimitedShared } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** 파트너 수익금 받을 계좌 등록·변경(계좌번호는 암호화 저장). */
export async function POST(req: Request) {
  const { partner } = await getCurrentPartner();
  if (!partner) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (partner.status !== "approved") return NextResponse.json({ error: "승인 후 등록할 수 있어요." }, { status: 403 });
  if (await rateLimitedShared(`wpacct:${partner.id}:${clientIp(req)}`, 6, 3600)) {
    return NextResponse.json({ error: "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }
  if (!isAccountStorageConfigured()) return NextResponse.json({ error: "지금은 계좌를 등록할 수 없어요. 고객센터로 문의해 주세요." }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const bank = String(b.bank ?? "").trim();
  const holder = String(b.holder ?? "").trim();
  const account = String(b.account ?? "").replace(/\D/g, "");
  if (!(BANKS as readonly string[]).includes(bank)) return NextResponse.json({ error: "은행을 선택해 주세요." }, { status: 400 });
  if (holder.length < 2 || holder.length > 30) return NextResponse.json({ error: "예금주를 확인해 주세요." }, { status: 400 });
  if (account.length < 8 || account.length > 16) return NextResponse.json({ error: "계좌번호를 확인해 주세요." }, { status: 400 });

  const svc = await createServiceRoleClient();
  const { error } = await svc
    .from("wedding_partners")
    .update({ bank_name: bank, account_holder: holder, account_enc: encryptAccount(account), account_last4: account.slice(-4), updated_at: new Date().toISOString() })
    .eq("id", partner.id);
  if (error) return NextResponse.json({ error: "저장하지 못했어요." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
