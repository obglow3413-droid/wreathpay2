import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceRoleClient } from "@/lib/supabase/server";
import GalleryManager, { type GalleryItem } from "@/components/admin/GalleryManager";

async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("case_gallery")
      .select("id, storage_path, label, meta")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const items = await Promise.all(
      data.map(async (row) => {
        const { data: signed } = await supabase.storage
          .from("estimate-photos")
          .createSignedUrl(row.storage_path, 60 * 60);
        return {
          id: row.id,
          imageUrl: signed?.signedUrl ?? "",
          label: row.label,
          meta: row.meta,
        };
      })
    );
    return items.filter((i) => i.imageUrl);
  } catch (e) {
    console.error("[admin gallery]", e);
    return [];
  }
}

export default async function AdminGalleryPage() {
  const items = await getGalleryItems();
  const configured = isSupabaseConfigured();

  return (
    <div>
      <h1 className="text-[20px] font-bold">이용사례 갤러리</h1>
      <p className="mt-1 text-[13.5px] text-muted">
        여기서 등록·삭제한 사진이 홈페이지 &quot;실제 수거 사례&quot; 섹션에 그대로 반영돼요.
      </p>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase가 연결되면 사진을 등록할 수 있어요.
        </div>
      )}

      <GalleryManager items={items} />
    </div>
  );
}
