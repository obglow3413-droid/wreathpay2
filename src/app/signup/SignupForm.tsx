"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";

  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) {
        setError(
          signUpError.message.includes("already registered")
            ? "이미 가입된 이메일이에요. 로그인을 시도해주세요."
            : "가입에 실패했어요. 다시 시도해주세요."
        );
        setLoading(false);
        return;
      }
      setSignupDone(true);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      setLoading(false);
      return;
    }
    router.push("/status");
    router.refresh();
  }

  if (signupDone) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16 text-center">
        <div className="fade-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl">
            ✓
          </div>
          <h1 className="mt-5 text-[20px] font-bold leading-snug">
            가입 확인 이메일을
            <br />
            보내드렸어요.
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
            메일함에서 인증 링크를 눌러 가입을 완료해주세요.
          </p>
          <button
            type="button"
            onClick={() => {
              setSignupDone(false);
              setMode("login");
            }}
            className="hover-lift mt-8 flex h-13 w-full items-center justify-center rounded-xl border border-border text-[15px] font-semibold text-foreground"
          >
            로그인하러 가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="fade-up text-center">
        <p className="text-[13px] font-semibold text-brand">
          {mode === "signup" ? "1초만에 가입하기" : "다시 만나서 반가워요"}
        </p>
        <h1 className="mt-3 text-[22px] font-extrabold leading-snug">
          {mode === "signup" ? (
            <>
              이메일로 간편하게
              <br />
              가입해보세요.
            </>
          ) : (
            <>
              로그인하고
              <br />
              접수현황을 확인하세요.
            </>
          )}
        </h1>
      </div>

      {/* 가입 / 로그인 탭 전환 */}
      <div className="mt-6 flex rounded-full bg-surface p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`flex-1 rounded-full py-2.5 text-[13.5px] font-semibold transition ${
            mode === "signup" ? "bg-foreground text-white" : "text-muted"
          }`}
        >
          가입하기
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`flex-1 rounded-full py-2.5 text-[13.5px] font-semibold transition ${
            mode === "login" ? "bg-foreground text-white" : "text-muted"
          }`}
        >
          로그인
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            required
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
          />
        )}
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
        />

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="hover-lift mt-2 flex h-13 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {loading ? "처리 중..." : mode === "signup" ? "가입하기" : "로그인"}
        </button>
      </form>

      <p className="mt-8 text-center text-[12px] leading-relaxed text-muted-light">
        가입해도 견적신청은 별도 로그인 없이 그대로 이용할 수 있어요.
        <br />
        가입하면 내 신청내역과 페이백 진행상황을 확인할 수 있어요.
      </p>
    </main>
  );
}
