import Image from "next/image";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

interface CaseRow {
  id: string;
  imageUrl: string;
  label: string;
  meta: string | null;
}

async function getCases(): Promise<CaseRow[]> {
  if (!isServiceRoleConfigured()) return [];

  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("case_gallery")
      .select("id, storage_path, label, meta")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(9);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const rows = await Promise.all(
      data.map(async (row) => {
        const { data: signed } = await supabase.storage
          .from("estimate-photos")
          .createSignedUrl(row.storage_path, 60 * 60 * 24);
        return {
          id: row.id,
          imageUrl: signed?.signedUrl ?? "",
          label: row.label,
          meta: row.meta,
        };
      })
    );
    return rows.filter((r) => r.imageUrl);
  } catch (e) {
    console.error("[CaseGallery]", e);
    return [];
  }
}

export default async function CaseGallery() {
  const cases = await getCases();

  if (cases.length === 0) return null;

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <h2 className="text-[24px] font-bold md:text-[30px]">실제 수거 사례</h2>
        <p className="mt-2 text-[13.5px] text-muted">꽃깞이 실제로 방문수거한 화환들이에요.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {cases.map((item, i) => (
            <div
              key={item.id}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-white"
            >
              <Image
                src={item.imageUrl}
                alt={`${item.label} 수거 사례`}
                fill
                sizes="(max-width: 768px) 50vw, 260px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                priority={i < 3}
                unoptimized
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3">
                <p className="text-[12.5px] font-semibold text-white">{item.label}</p>
                {item.meta && <p className="text-[11px] text-white/75">{item.meta}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
