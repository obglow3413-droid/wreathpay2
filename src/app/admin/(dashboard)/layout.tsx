import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-surface">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
