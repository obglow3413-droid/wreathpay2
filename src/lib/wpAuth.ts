import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getPartnerForUser } from "@/lib/weddingPartners";

/** 현재 로그인한 웨딩 파트너(서버 전용). 로그인하지 않았거나 파트너가 아니면 partner=null. */
export async function getCurrentPartner() {
  try {
    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) return { user: null, partner: null };
    const svc = await createServiceRoleClient();
    const partner = await getPartnerForUser(svc, user.id);
    return { user: { id: user.id, email: user.email ?? null }, partner };
  } catch {
    return { user: null, partner: null };
  }
}
