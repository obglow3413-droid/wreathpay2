"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (err) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      return;
    }
    router.push("/wedding-partners/dashboard");
    router.refresh();
  }

  const input = "mt-1.5 h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none focus:border-foreground";
  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-[13px] font-semibold">
        이메일
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={input} />
      </label>
      <label className="block text-[13px] font-semibold">
        비밀번호
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" className={input} />
      </label>
      {error && <p className="text-[13px] text-error">{error}</p>}
      <button type="submit" disabled={busy || !email || !password} className="h-14 w-full rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-40">
        {busy ? "로그인 중…" : "로그인"}
      </button>
      <p className="text-center text-[12.5px] text-muted">
        아직 파트너가 아니신가요?{" "}
        <Link href="/wedding-partners/join" className="font-semibold underline">
          가입하기
        </Link>
      </p>
      <p className="text-center text-[12px] text-muted-light">비밀번호를 잊으셨다면 고객센터(010-5333-3413)로 연락 주세요.</p>
    </form>
  );
}
