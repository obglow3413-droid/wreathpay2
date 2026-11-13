"use client";

import Logo from "@/components/layout/Logo";

import { useEffect, useRef, useState } from "react";
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

  // 새 접수 알람: 20초마다 확인 → 배지·탭 제목 + 화면 알림창 + 알림음 + (허용 시) 브라우저 알림
  const [alarm, setAlarm] = useState<{ id: string; label: string } | null>(null);
  const [notifyState, setNotifyState] = useState<"unknown" | "default" | "granted" | "denied">("unknown");
  const lastSeen = useRef<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof Notification !== "undefined") setNotifyState(Notification.permission);
    else setNotifyState("denied");
  }, []);
  useEffect(() => {
    let alive = true;
    const beep = () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        [880, 1175].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = f;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
          g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.16);
          o.start(ctx.currentTime + i * 0.18);
          o.stop(ctx.currentTime + i * 0.18 + 0.18);
        });
        setTimeout(() => ctx.close().catch(() => {}), 800);
      } catch {}
    };
    const load = () =>
      fetch("/api/admin/pending-count")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!alive || !j) return;
          setReceived(j.received ?? 0);
          const latest = j.latest as { id: string; createdAt: string; label: string } | null;
          if (!latest) return;
          // 처음 불러올 때는 기준만 잡고, 그 뒤에 더 새로운 접수가 생기면 알린다
          if (lastSeen.current && latest.createdAt > lastSeen.current) {
            setAlarm({ id: latest.id, label: latest.label });
            beep();
            try {
              if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("KKOT PAY 새 접수", { body: latest.label || "새 신청이 들어왔어요.", tag: latest.id });
              }
            } catch {}
          }
          lastSeen.current = latest.createdAt;
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 20000);
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

      {notifyState === "default" && (
        <button
          type="button"
          onClick={async () => {
            try {
              setNotifyState(await Notification.requestPermission());
            } catch {}
          }}
          className="rounded-lg border border-border px-3 py-2 text-left text-[12.5px] font-medium text-foreground hover:bg-surface"
        >
          🔔 새 접수 알림 켜기
          <span className="mt-0.5 block text-[11px] font-normal text-muted-light">다른 창을 보고 있어도 알려드려요</span>
        </button>
      )}
      {notifyState === "granted" && <p className="px-3 text-[11px] text-muted-light">🔔 새 접수 알림 켜짐 · 이 창을 열어 두세요</p>}

      {alarm && (
        <div role="alert" className="fixed right-5 top-5 z-[100] w-[320px] rounded-2xl border border-brass bg-white p-4 shadow-2xl">
          <p className="text-[12px] font-bold text-brass">새 접수가 들어왔어요</p>
          <p className="mt-1 text-[14.5px] font-bold leading-snug">{alarm.label || "새 신청"}</p>
          <div className="mt-3 flex gap-2">
            <Link href={`/admin/requests/${alarm.id}`} onClick={() => setAlarm(null)} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-brand text-[13.5px] font-semibold text-white">
              바로 보기
            </Link>
            <button type="button" onClick={() => setAlarm(null)} className="h-10 rounded-lg border border-border px-3 text-[13px] text-muted">
              닫기
            </button>
          </div>
        </div>
      )}

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
