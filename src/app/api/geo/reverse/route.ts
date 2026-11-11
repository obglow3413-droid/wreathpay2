import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 좌표 → 한국어 주소. OpenStreetMap Nominatim(무료) 사용: 식별 가능한 User-Agent 필수, 사용량 제한 있음.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ address: null }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ address: null }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=ko&lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "kkotpay.kr/1.0 (contact: kkotpay.kr)" }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return NextResponse.json({ address: null });
    const json = (await res.json()) as { address?: Record<string, string>; display_name?: string };
    const a = json.address ?? {};
    const parts = [
      a.city || a.province || a.state,
      a.borough || a.city_district || a.county || a.suburb,
      a.road,
      a.house_number,
    ].filter(Boolean);
    const address = parts.length >= 2 ? parts.join(" ") : json.display_name?.split(", ").reverse().join(" ") ?? null;
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ address: null });
  }
}
