import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

interface MemberRow {
  id: string;
  email: string | null;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
}

async function getMembers(): Promise<MemberRow[]> {
  if (!isServiceRoleConfigured()) return [];

  try {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (error) throw error;

    return (data.users ?? [])
      .map((u) => ({
        id: u.id,
        email: u.email ?? null,
        provider: (u.app_metadata?.provider as string) ?? "unknown",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("[admin members]", e);
    return [];
  }
}

const PROVIDER_LABEL: Record<string, string> = {
  kakao: "카카오톡",
  google: "구글",
  email: "이메일",
  unknown: "기타",
};

export default async function AdminMembersPage() {
  const members = await getMembers();
  const configured = isServiceRoleConfigured();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold">가입회원</h1>
        <span className="text-[13px] text-muted">총 {members.length}명</span>
      </div>
      <p className="mt-1 text-[13.5px] text-muted">
        카카오톡 · 구글로 가입한 회원 목록이에요. (견적신청은 회원가입 없이도 가능해요)
      </p>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-700">
          Supabase가 연결되면 가입회원 목록이 표시됩니다.
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[600px] text-left text-[13px]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">가입경로</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium">최근 로그인</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  아직 가입한 회원이 없어요.
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3">{m.email ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[12px] font-medium text-brand-dark">
                    {PROVIDER_LABEL[m.provider] ?? m.provider}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(m.createdAt).toLocaleString("ko-KR")}
                </td>
                <td className="px-4 py-3 text-muted">
                  {m.lastSignInAt ? new Date(m.lastSignInAt).toLocaleString("ko-KR") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
