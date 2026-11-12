"use client";

import Logo from "@/components/layout/Logo";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/requests", label: "신청목록" },
  { href: "/admin/schedule", label: "수거 일정 보드" },
  { href: "/admin/settlements", label: "정산 대기" },
  { href: "/admin/ribbons", label: "리본 명단" },
  { href: "/admin/reviews", label: "고객 후기" },
  { href: "/admin/places", label: "수거 가능 장소" },
  { href: "/admin/drivers", label: "기사 지원서" },
  { href: "/admin/partners", label: "업체/파트너" },
  { href: "/admin/members", label: "가입회원" },
  { href: "/admin/settings", label: "설정" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [received, setReceived] = useState(0);

  // 새 접수 배지(30초마다 확인) + 브라우저 탭 제목에도 표시
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/admin/pending-count")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => alive && j && setReceived(j.received ?? 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = received > 0 ? `(${received}) ${base}` : base;
  }, [received]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-dvh w-56 shrink-0 flex-col border-r border-border bg-white px-4 py-6">
      <div className="px-2">
        <Logo size="sm" />
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
              {item.href === "/admin/requests" && received > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{received}</span>
              )}
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
