/**
 * 방문 → 신청 단계 집계. 개인정보·쿠키 없이 "어느 단계까지 왔는지"만 하루 단위로 센다.
 * 같은 탭에서 같은 단계는 한 번만 보낸다(새로고침 중복 방지).
 */
export type FunnelEvent = "home_view" | "estimate_view" | "photo_added" | "estimate_shown" | "submit_done" | "reserve_done" | "lookup_view" | "place_view";

export function track(event: FunnelEvent) {
  if (typeof window === "undefined") return;
  try {
    const k = `kkotpay:t:${event}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {}
  try {
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}
