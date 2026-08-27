import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, companyName, applicantName, email, phone, website, serviceRegions, memo } = body;

    if (!category || !companyName || !applicantName || !phone) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ ok: true, mock: true });
    }

    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from("partner_applications").insert({
      category,
      company_name: companyName,
      applicant_name: applicantName,
      email: email || null,
      phone,
      website: website || null,
      service_regions: serviceRegions || [],
      memo: memo || null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/partner-apply]", err);
    return NextResponse.json(
      { error: "등록 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
