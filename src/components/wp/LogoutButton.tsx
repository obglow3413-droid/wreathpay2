"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/wedding-partners");
        router.refresh();
      }}
      className={compact ? "shrink-0 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-muted" : "h-12 w-full rounded-xl border border-border text-[14px] font-semibold text-muted"}
    >
      로그아웃
    </button>
  );
}
