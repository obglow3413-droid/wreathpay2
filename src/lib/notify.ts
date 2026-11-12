import crypto from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * 진행 알림(문자) 발송. Solapi 환경변수가 없으면 아무것도 보내지 않는다(= 신청만 저장, 발송은 키 설정 후).
 *   SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_SENDER(사전 등록된 발신번호)
 */
export function isSmsConfigured(): boolean {
  return Boolean(process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET && process.env.SOLAPI_SENDER);
}

const SITE = "https://kkotpay.kr";

function message(status: string, requestNo: string, pickupDate: string | null): string | null {
  void requestNo;
  const link = `${SITE}/status/lookup`;
  switch (status) {
    case "estimated":
      return `[KKOT PAY] 예상 페이백이 산정됐어요.\n진행상황: ${link}`;
    case "dispatched":
      return `[KKOT PAY] 꽃페이 전담기사님이 배정됐어요${pickupDate ? ` (수거일 ${pickupDate})` : ""}.\n${link}`;
    case "collecting":
      return `[KKOT PAY] 꽃페이 전담기사님이 지정하신 날짜에 이동 중입니다.\n실시간 진행상황: ${link}`;
    case "collected":
      return `[KKOT PAY] 화환 수거가 완료됐어요. 곧 정산해 드릴게요.\n${link}`;
    case "settled":
      return `[KKOT PAY] 페이백 정산이 완료됐어요. 이용해 주셔서 감사합니다.`;
    default:
      return null;
  }
}

export async function sendSms(to: string, text: string): Promise<boolean> {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto.createHmac("sha256", process.env.SOLAPI_API_SECRET!).update(date + salt).digest("hex");
  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `HMAC-SHA256 apiKey=${process.env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({ message: { to: to.replace(/\D/g, ""), from: process.env.SOLAPI_SENDER!.replace(/\D/g, ""), text } }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) console.error("[notify] solapi", res.status, (await res.text()).slice(0, 200));
  return res.ok;
}

/** 관리자가 상태를 바꿨을 때 호출. 알림을 신청했고 아직 같은 상태로 보낸 적이 없을 때만 1회 발송. 실패해도 예외를 던지지 않는다. */
export async function notifyStatusChange(requestId: string, status: string): Promise<void> {
  try {
    if (!isSmsConfigured()) return;
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("estimate_requests")
      .select("request_no, pickup_date, notify_opt_in, notified_status, customers(phone)")
      .eq("id", requestId)
      .maybeSingle();
    if (!data || !data.notify_opt_in || data.notified_status === status) return;
    const text = message(status, data.request_no, data.pickup_date);
    const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
    if (!text || !customer?.phone) return;
    if (await sendSms(customer.phone, text)) {
      await supabase.from("estimate_requests").update({ notified_status: status }).eq("id", requestId);
    }
  } catch (e) {
    console.error("[notify]", e);
  }
}

/** 관리자에게 문자 알림(Solapi 설정 + ADMIN_NOTIFY_PHONE 이 있을 때만). 없으면 조용히 건너뛴다. */
export async function notifyAdmin(text: string): Promise<void> {
  try {
    const to = process.env.ADMIN_NOTIFY_PHONE;
    if (!to || !isSmsConfigured()) return;
    await sendSms(to, text);
  } catch (e) {
    console.error("[notifyAdmin]", e);
  }
}
