import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { BANKS, encryptAccount, isAccountStorageConfigured } from "@/lib/payoutAccount";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8;
}
const digits = (v: string) => v.replace(/\D/g, "");

/** 페이백 받을 계좌 등록(최초 1회, 변경은 채널톡 경유). 접수번호 + 연락처가 일치해야 하며, 정산 완료 전까지만 변경 가능. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });

  let body: { requestNo?: string; phone?: string; bankName?: string; holderName?: string; accountNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const requestNo = (body.requestNo ?? "").trim().toUpperCase();
  const phone = digits(body.phone ?? "");
  const bankName = (body.bankName ?? "").trim();
  const holderName = (body.holderName ?? "").trim();
  const account = digits(body.accountNumber ?? "");

  if (!requestNo || phone.length < 9) return NextResponse.json({ error: "접수번호와 연락처를 확인해주세요." }, { status: 400 });
  if (!(BANKS as readonly string[]).includes(bankName)) return NextResponse.json({ error: "은행을 선택해주세요." }, { status: 400 });
  if (holderName.length < 2 || holderName.length > 20) return NextResponse.json({ error: "예금주 이름을 확인해주세요." }, { status: 400 });
  if (account.length < 8 || account.length > 16) return NextResponse.json({ error: "계좌번호를 확인해주세요. (숫자만 8~16자리)" }, { status: 400 });
  if (!isServiceRoleConfigured() || !isAccountStorageConfigured()) {
    return NextResponse.json({ error: "계좌 등록 기능을 준비 중이에요. 잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("estimate_requests")
      .select("id, status, customers(phone), payout_accounts(id)")
      .ilike("request_no", requestNo)
      .maybeSingle();
    const customer = data && (Array.isArray(data.customers) ? data.customers[0] : data.customers);
    if (!data || !customer || digits(customer.phone ?? "") !== phone) {
      return NextResponse.json({ error: "일치하는 접수 내역이 없어요." }, { status: 404 });
    }
    if (data.status === "settled" || data.status === "cancelled") {
      return NextResponse.json({ error: "이미 종료된 접수 건이라 계좌를 변경할 수 없어요." }, { status: 409 });
    }

    // 연락처만으로 조회되는 구조라, 이미 등록된 계좌를 바꾸는 건 본인 확인이 가능한 채널톡/담당자 경유로만 허용
    const existing = Array.isArray(data.payout_accounts) ? data.payout_accounts[0] : data.payout_accounts;
    if (existing) {
      return NextResponse.json({ error: "이미 등록된 계좌예요. 변경은 채널톡으로 문의해 주세요." }, { status: 409 });
    }

    const { error } = await supabase.from("payout_accounts").upsert(
      {
        estimate_request_id: data.id,
        bank_name: bankName,
        holder_name: holderName,
        account_enc: encryptAccount(account),
        account_last4: account.slice(-4),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "estimate_request_id" }
    );
    if (error) throw error;
    return NextResponse.json({ ok: true, bankName, last4: account.slice(-4) });
  } catch (e) {
    console.error("[status account]", e);
    return NextResponse.json({ error: "등록 중 문제가 생겼어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
