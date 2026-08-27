"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 서로 달라요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        "비밀번호 변경에 실패했어요. 이메일로 받은 링크를 다시 눌러 들어와주세요."
      );
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface px-5">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-xl">
            ✓
          </div>
          <h1 className="mt-4 text-[18px] font-bold">비밀번호가 변경됐어요</h1>
          <p className="mt-1 text-[13.5px] text-muted">새 비밀번호로 다시 로그인해주세요.</p>
          <button
            type="button"
            onClick={() => router.push("/admin/login")}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-foreground text-[14.5px] font-semibold text-white"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8">
        <h1 className="text-[19px] font-bold">새 비밀번호 설정</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          이메일 링크로 들어오셨다면, 새 비밀번호를 설정해주세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="새 비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="새 비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
          />
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-brand text-[14.5px] font-semibold text-white disabled:opacity-50"
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}

