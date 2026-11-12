import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** 관리자 사이드바 배지용: 아직 처리 전(접수) 건수 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { count } = await supabase.from("estimate_requests").select("id", { count: "exact", head: true }).eq("status", "received");
  return NextResponse.json({ received: count ?? 0 });
}
