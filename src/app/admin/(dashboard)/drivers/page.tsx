import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import DriverApplicationActions from "@/components/admin/DriverApplicationActions";

interface ApplicationRow {
  id: string;
  name: string;
  phone: string;
  region: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

async function getApplications(): Promise<ApplicationRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("driver_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ApplicationRow[];
  } catch (e) {
    console.error("[admin driver applications]", e);
    return [];
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기중",
  approved: "승인됨",
  rejected: "거절됨",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-brand-tint text-brand-dark",
  rejected: "bg-red-50 text-red-600",
};

export default async function AdminDriversPage() {
  const applications = await getApplications();
  const configured = isSupabaseConfigured();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold">기사 지원서</h1>
        <span className="text-[13px] text-muted">총 {applications.length}건</span>
      </div>
      <p className="mt-1 text-[13.5px] text-muted">
        승인하면 배차 가능한 기사 목록에 자동으로 등록돼요.
      </p>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase가 연결되면 지원서 목록이 표시됩니다.
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">지원일</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">희망지역</th>
              <th className="px-4 py-3 font-medium">차량</th>
              <th className="px-4 py-3 font-medium">메시지</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">처리</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  아직 지원서가 없어요.
                </td>
              </tr>
            )}
            {applications.map((app) => (
              <tr key={app.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3 text-muted">
                  {new Date(app.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3 font-medium">{app.name}</td>
                <td className="px-4 py-3 text-muted">{app.phone}</td>
                <td className="px-4 py-3 text-muted">{app.region ?? "-"}</td>
                <td className="px-4 py-3 text-muted">
                  {app.vehicle_type ?? "-"}
                  {app.vehicle_number ? ` · ${app.vehicle_number}` : ""}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                  {app.message ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLE[app.status]}`}
                  >
                    {STATUS_LABEL[app.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {app.status === "pending" ? (
                    <DriverApplicationActions id={app.id} />
                  ) : (
                    <span className="text-[12px] text-muted-light">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
