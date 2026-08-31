
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface PlantRequestRow {
  id: string;
  request_no: string;
  plant_type: string;
  quantity: number;
  plant_size: string;
  pickup_address: string;
  pickup_address_detail: string | null;
  desired_pickup_date: string | null;
  customer_name: string;
  customer_phone: string;
  request_note: string | null;
  status: string;
  created_at: string;
}

async function getPlantRequests(): Promise<PlantRequestRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("plant_collection_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PlantRequestRow[];
  } catch (e) {
    console.error("[admin plant-collection]", e);
    return [];
  }
}

export default async function AdminPlantCollectionPage() {
  const requests = await getPlantRequests();
  const configured = isSupabaseConfigured();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold">개업화분 회수 신청</h1>
        <span className="text-[13px] text-muted">총 {requests.length}건</span>
      </div>
      <p className="mt-1 text-[13.5px] text-muted">화환 견적과는 별도로 접수되는 신청 목록이에요.</p>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase가 연결되면 신청 목록이 표시됩니다.
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">신청번호</th>
              <th className="px-4 py-3 font-medium">고객명</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">화분종류</th>
              <th className="px-4 py-3 font-medium">수량/크기</th>
              <th className="px-4 py-3 font-medium">수거주소</th>
              <th className="px-4 py-3 font-medium">희망일</th>
              <th className="px-4 py-3 font-medium">신청일</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  아직 신청이 없어요.
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3 font-medium text-brand-dark">{r.request_no}</td>
                <td className="px-4 py-3">{r.customer_name}</td>
                <td className="px-4 py-3 text-muted">{r.customer_phone}</td>
                <td className="px-4 py-3">{r.plant_type}</td>
                <td className="px-4 py-3 text-muted">
                  {r.quantity}개 · {r.plant_size}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-muted">
                  {r.pickup_address} {r.pickup_address_detail ?? ""}
                </td>
                <td className="px-4 py-3 text-muted">{r.desired_pickup_date ?? "-"}</td>
                <td className="px-4 py-3 text-muted">
                  {new Date(r.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
