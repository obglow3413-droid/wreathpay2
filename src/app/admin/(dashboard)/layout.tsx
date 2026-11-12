import AdminSidebar from "@/components/admin/AdminSidebar";

// 관리자 화면은 로그인 세션에 따라 달라지므로 절대 빌드 시점에 굳히지 않는다(빈 화면으로 고정되는 문제 방지).
export const dynamic = "force-dynamic";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-surface">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
