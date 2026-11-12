import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackHeader from "@/components/layout/BackHeader";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { RIBBON_EVENT_LABEL } from "@/lib/ribbon";
import SendMessageForm from "./SendMessageForm";
import ShareLink from "./ShareLink";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "마음 전하기", robots: { index: false, follow: false } };

export default async function BoardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isServiceRoleConfigured() || !/^[a-z0-9]{6,12}$/.test(code)) notFound();

  const supabase = await createServiceRoleClient();
  const { data: board } = await supabase
    .from("ribbon_boards")
    .select("id, title, event_type, host_name, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (!board || new Date(board.expires_at) < new Date()) notFound();

  const { data: messages } = await supabase
    .from("ribbon_messages")
    .select("id, sender_name, message, created_at")
    .eq("board_id", board.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const dark = board.event_type === "funeral";

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-24">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">{RIBBON_EVENT_LABEL[board.event_type] ?? "마음"} 리본</p>
        <h1 className="mt-1 text-[22px] font-bold leading-snug">{board.title}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {board.host_name}님께 마음을 전해주세요 · {(messages ?? []).length}개의 마음
        </p>

        <SendMessageForm code={code} />
        <ShareLink code={code} />

        <div className="mt-8 space-y-3">
          {(messages ?? []).length === 0 && (
            <p className="rounded-xl border border-border px-5 py-10 text-center text-[13.5px] text-muted">
              첫 번째 마음을 남겨주세요.
            </p>
          )}
          {(messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-5 py-4 ${dark ? "border border-border bg-surface" : "border border-border bg-white"}`}
            >
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.message}</p>
              <p className="mt-2 text-[12.5px] font-semibold text-muted">— {m.sender_name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
