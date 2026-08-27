import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import RequestDetailForm from "@/components/admin/RequestDetailForm";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <BackLink />
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase가 연결되면 신청 상세 정보를 확인할 수 있어요.
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: requestRow } = await supabase
    .from("estimate_requests")
    .select(
      "*, customers(name, phone), estimate_images(id, storage_path, sort_order), pickup_orders(*), payouts(*)"
    )
    .eq("id", id)
    .single();

  if (!requestRow) notFound();

  const { data: gradePrices } = await supabase
    .from("grade_prices")
    .select("unit_price, wreath_grades(code, label)")
    .eq("is_current", true);

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, name, phone, vehicle_number")
    .eq("is_active", true);

  const images = (requestRow.estimate_images ?? []) as { id: string; storage_path: string }[];
  const storageClient = await createServiceRoleClient();
  const imageUrls = await Promise.all(
    images.map(async (img) => {
      const { data } = await storageClient.storage
        .from("estimate-photos")
        .createSignedUrl(img.storage_path, 60 * 60);
      return data?.signedUrl ?? null;
    })
  );

  return (
    <div>
      <BackLink />
      <RequestDetailForm
        request={requestRow}
        imageUrls={imageUrls.filter((u): u is string => Boolean(u))}
        gradePrices={
          (gradePrices ?? []) as unknown as {
            unit_price: number;
            wreath_grades: { code: string; label: string };
          }[]
        }
        drivers={drivers ?? []}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/requests" className="text-[13.5px] text-muted">
      ← 신청목록으로
    </Link>
  );
}
