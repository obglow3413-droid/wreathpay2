"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/requests", label: "신청목록" },
  { href: "/admin/plant-collection", label: "개업화분 회수" },
  { href: "/admin/drivers", label: "기사 지원서" },
  { href: "/admin/partners", label: "업체/파트너" },
  { href: "/admin/members", label: "가입회원" },
  { href: "/admin/gallery", label: "이용사례 갤러리" },
  { href: "/admin/settings", label: "설정" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-dvh w-56 shrink-0 flex-col border-r border-border bg-white px-4 py-6">
      <div className="px-2">
        <Image src="/logo.png" alt="꽃깞" width={88} height={20} className="h-5 w-auto" />
      </div>
      <p className="mt-1 px-2 text-[12px] text-muted-light">관리자</p>

      <nav className="mt-8 flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-[14px] font-medium ${
                active ? "bg-brand-tint text-brand-dark" : "text-muted hover:bg-surface"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-4 rounded-lg px-3 py-2.5 text-left text-[13.5px] text-muted-light hover:bg-surface"
      >
        로그아웃
      </button>
    </aside>
  );
}
