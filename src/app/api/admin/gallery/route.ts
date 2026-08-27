import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * 관리자가 홈페이지 "실제 수거 사례" 갤러리에 사진을 등록하는 API.
 * 이미지는 estimate-photos 버킷의 gallery/ 폴더에 저장합니다.
 *
 * 인증 확인은 사용자 세션 클라이언트로, 실제 Storage 업로드/DB 저장은
 * 서비스 롤 클라이언트로 수행합니다. (Storage 버킷은 별도 정책을 추가하지 않아
 * authenticated 세션으로는 storage.objects에 접근할 수 없기 때문입니다.)
 */
export async function POST(request: Request) {
  try {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const label = formData.get("label") as string | null;
    const meta = formData.get("meta") as string | null;

    if (!(image instanceof File) || !label) {
      return NextResponse.json({ error: "사진과 화환 종류는 필수예요." }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    const arrayBuffer = await image.arrayBuffer();
    const ext = image.name.split(".").pop() || "jpg";
    const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("estimate-photos")
      .upload(path, Buffer.from(arrayBuffer), { contentType: image.type || "image/jpeg" });

    if (uploadError) throw uploadError;

    const { data: inserted, error: insertError } = await supabase
      .from("case_gallery")
      .insert({ storage_path: path, label, meta: meta || null })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, id: inserted.id });
  } catch (err) {
    console.error("[POST /api/admin/gallery]", err);
    return NextResponse.json({ error: "등록 중 문제가 발생했어요." }, { status: 500 });
  }
}
