import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import PartnerApplicationActions from "@/components/admin/PartnerApplicationActions";

interface PartnerRow {
  id: string;
  category: string;
  company_name: string;
  applicant_name: string;
  email: string | null;
  phone: string;
  website: string | null;
  service_regions: string[];
  memo: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

async function getPartnerApplications(): Promise<PartnerRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("partner_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as PartnerRow[];
  } catch (e) {
    console.error("[admin partner applications]", e);
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

export default async function AdminPartnersPage() {
  const applications = await getPartnerApplications();
  const configured = isSupabaseConfigured();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold">업체/파트너 등록</h1>
        <span className="text-[13px] text-muted">총 {applications.length}건</span>
      </div>
      <p className="mt-1 text-[13.5px] text-muted">
        화환 수거대행·재판매·물류 업체의 제휴 등록 신청 목록이에요.
      </p>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase가 연결되면 등록 목록이 표시됩니다.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {applications.length === 0 && (
          <div className="rounded-xl border border-border bg-white px-5 py-10 text-center text-[13.5px] text-muted">
            아직 등록 신청이 없어요.
          </div>
        )}
        {applications.map((app) => (
          <div key={app.id} className="rounded-xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold">{app.company_name}</p>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                    {app.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[app.status]}`}
                  >
                    {STATUS_LABEL[app.status]}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {app.applicant_name} · {app.phone}
                  {app.email ? ` · ${app.email}` : ""}
                </p>
                {app.website && (
                  <p className="mt-0.5 text-[12.5px] text-muted-light">{app.website}</p>
                )}
              </div>
              {app.status === "pending" && <PartnerApplicationActions id={app.id} />}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {app.service_regions.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-border px-2 py-0.5 text-[11.5px] text-muted"
                >
                  {r}
                </span>
              ))}
            </div>

            {app.memo && (
              <p className="mt-3 rounded-lg bg-surface px-3 py-2.5 text-[13px] text-muted">
                {app.memo}
              </p>
            )}

            <p className="mt-3 text-[11.5px] text-muted-light">
              {new Date(app.created_at).toLocaleString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
