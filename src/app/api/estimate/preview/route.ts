import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import {
  filesToAiImages,
  isAiEstimateConfigured,
  runAiEstimate,
  toPublicEstimate,
} from "@/lib/aiEstimate";
import type { GradeUnitPrices } from "@/lib/pricing";

export const runtime = "nodejs";
export const maxDuration = 60;

// AI 호출 비용 남용을 막기 위한 단순 요청 제한(인스턴스 단위, best-effort)
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 8;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

async function loadPrices(): Promise<GradeUnitPrices | undefined> {
  if (!isServiceRoleConfigured()) return undefined;
  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase.from("grade_prices").select("unit_price, wreath_grades(code)").eq("is_current", true);
    const byCode: Record<string, number> = {};
    for (const row of data ?? []) {
      const code = (row as unknown as { wreath_grades: { code: string } }).wreath_grades?.code;
      if (code) byCode[code] = row.unit_price as number;
    }
    if (byCode.premium && byCode.a && byCode.b && byCode.c) {
      return { premium: byCode.premium, a: byCode.a, b: byCode.b, c: byCode.c };
    }
  } catch (e) {
    console.error("[preview prices]", e);
  }
  return undefined;
}

/**
 * 사진만으로 페이백 예상 금액(범위)을 즉시 계산해서 돌려준다. 저장은 하지 않는다.
 * 응답: { available: false } 이면 AI 산정을 쓸 수 없는 상태(키 미설정·실패) → 화면은 일반 접수로 진행.
 */
export async function POST(request: Request) {
  if (!isAiEstimateConfigured()) return NextResponse.json({ available: false });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ available: false, reason: "rate_limited" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("images").filter((f): f is File => f instanceof File);
    const eventType = (formData.get("eventType") as string | null) ?? undefined;

    const images = await filesToAiImages(files);
    if (images.length === 0) return NextResponse.json({ available: false });

    const result = await runAiEstimate(images, { eventTypeHint: eventType, prices: await loadPrices() });
    if (!result) return NextResponse.json({ available: false });

    return NextResponse.json({ available: true, estimate: toPublicEstimate(result) });
  } catch (e) {
    console.error("[POST /api/estimate/preview]", e);
    return NextResponse.json({ available: false });
  }
}
