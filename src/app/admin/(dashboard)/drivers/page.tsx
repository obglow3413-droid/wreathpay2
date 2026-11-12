import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import CopyButton from "@/components/status/CopyButton";
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

async function getDriverLinks(): Promise<{ id: string; name: string; phone: string; access_token: string }[]> {
  if (!isServiceRoleConfigured()) return [];
  try {
    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) return [];
    const svc = await createServiceRoleClient();
    const { data } = await svc.from("drivers").select("id, name, phone, access_token").eq("is_active", true).order("created_at");
    return (data ?? []) as { id: string; name: string; phone: string; access_token: string }[];
  } catch {
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
  const driverLinks = await getDriverLinks();
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

      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <h2 className="text-[15px] font-bold">배차 기사 전용 링크</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          기사님께 이 링크를 보내주세요. 로그인 없이 본인에게 배정된 건만 보이고, &ldquo;이동 시작 / 수거 완료&rdquo;를 누를 수 있어요. 링크는 타인에게 공유하지 않도록 안내해 주세요.
        </p>
        {driverLinks.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">등록된 기사가 없어요. 지원서를 승인하면 여기에 나타나요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {driverLinks.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="font-medium">
                  {d.name} <span className="text-muted">{d.phone}</span>
                </span>
                <CopyButton text={`https://kkotpay.kr/driver/${d.access_token}`} label="링크 복사" />
              </li>
            ))}
          </ul>
        )}
      </section>

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
