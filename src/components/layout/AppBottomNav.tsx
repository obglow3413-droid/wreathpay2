"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, FileSearch, HelpCircle, ClipboardList, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BASE_TABS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/guide", label: "이용안내", icon: HelpCircle },
  { href: "/status", label: "접수현황", icon: ClipboardList },
];

export default function AppBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(Boolean(data.user)));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // 시세조회 버튼: 이미 홈에 있으면 직접 스크롤, 다른 페이지면 홈으로 이동 후 스크롤
  function handlePricingClick(e: React.MouseEvent) {
    e.preventDefault();
    const target = document.getElementById("pricing");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/#pricing");
    }
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        <Link
          href="/"
          className={`hover-lift flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium ${
            pathname === "/" ? "text-brand-dark" : "text-muted-light"
          }`}
        >
          <Home size={21} strokeWidth={pathname === "/" ? 2.3 : 1.8} />
          홈
        </Link>

        <button
          type="button"
          onClick={handlePricingClick}
          className="hover-lift flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium text-muted-light"
        >
          <FileSearch size={21} strokeWidth={1.8} />
          시세조회
        </button>

        {BASE_TABS.slice(1).map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`hover-lift flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium ${
                active ? "text-brand-dark" : "text-muted-light"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
              {tab.label}
            </Link>
          );
        })}

        {/* 마지막 탭: 로그인 상태에 따라 자동 전환 */}
        {loggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            className="hover-lift flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium text-muted-light"
          >
            <LogOut size={21} strokeWidth={1.8} />
            로그아웃
          </button>
        ) : (
          <Link
            href="/signup"
            className={`hover-lift flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium ${
              pathname.startsWith("/signup") ? "text-brand-dark" : "text-muted-light"
            }`}
          >
            <User size={21} strokeWidth={pathname.startsWith("/signup") ? 2.3 : 1.8} />
            가입
          </Link>
        )}
      </div>
    </nav>
  );
}
