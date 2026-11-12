import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { decryptAccount } from "@/lib/payoutAccount";

export const dynamic = "force-dynamic";

/** 관리자 전용: 정산할 계좌 전체 번호 복호화 조회. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });

  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("payout_accounts")
      .select("bank_name, holder_name, account_enc")
      .eq("estimate_request_id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "등록된 계좌가 없어요." }, { status: 404 });
    return NextResponse.json({ bankName: data.bank_name, holderName: data.holder_name, accountNumber: decryptAccount(data.account_enc) });
  } catch (e) {
    console.error("[admin account]", e);
    return NextResponse.json({ error: "조회하지 못했어요." }, { status: 500 });
  }
}
