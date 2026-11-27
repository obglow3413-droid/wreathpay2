import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUser, auditLog } from "@/lib/adminAuth";
import { decryptAccount } from "@/lib/payoutAccount";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 관리자: 출금 신청 계좌번호 열람(열람 기록 남김) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const svc = await createServiceRoleClient();
  const { data } = await svc.from("wp_withdrawals").select("bank_name, account_holder, account_enc").eq("id", id).single();
  if (!data?.account_enc) return NextResponse.json({ error: "계좌 정보가 없어요." }, { status: 404 });
  try {
    const account = decryptAccount(data.account_enc);
    await auditLog(admin.id, "wp_withdrawal.view_account", id);
    return NextResponse.json({ bank: data.bank_name, holder: data.account_holder, account });
  } catch {
    return NextResponse.json({ error: "계좌를 열람하지 못했어요." }, { status: 500 });
  }
}
