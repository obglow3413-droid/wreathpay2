"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", company: "", phone: "", email: "", password: "", password2: "" });
  const [agree, setAgree] = useState({ terms: false, company: false, privacy: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const allAgree = agree.terms && agree.company && agree.privacy;
  const ready =
    f.name.trim().length >= 2 &&
    f.phone.replace(/\D/g, "").length >= 10 &&
    /\S+@\S+\.\S+/.test(f.email) &&
    f.password.length >= 8 &&
    f.password === f.password2 &&
    allAgree;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/wp/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          company: f.company,
          phone: f.phone,
          email: f.email,
          password: f.password,
          agreeTerms: agree.terms,
          agreeCompanyPolicy: agree.company,
          agreePrivacy: agree.privacy,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "가입하지 못했어요.");
        return;
      }
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email: f.email.trim().toLowerCase(), password: f.password });
      router.push("/wedding-partners/dashboard");
      router.refresh();
    } catch {
      setError("네트워크를 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1.5 h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] outline-none focus:border-foreground";
  const label = "block text-[13px] font-semibold";
  const check = (k: keyof typeof agree, children: React.ReactNode) => (
    <label key={k} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
      <input type="checkbox" checked={agree[k]} onChange={(e) => setAgree({ ...agree, [k]: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </label>
  );

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className={label}>
        이름
        <input value={f.name} onChange={set("name")} className={input} autoComplete="name" placeholder="홍길동" />
      </label>
      <label className={label}>
        소속(회사명) <span className="font-normal text-muted">선택</span>
        <input value={f.company} onChange={set("company")} className={input} autoComplete="organization" placeholder="프리랜서라면 비워 두세요" />
      </label>
      <label className={label}>
        휴대폰 번호
        <input value={f.phone} onChange={set("phone")} className={input} inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" />
      </label>
      <label className={label}>
        이메일(로그인 아이디)
        <input value={f.email} onChange={set("email")} className={input} type="email" autoComplete="email" placeholder="planner@example.com" />
      </label>
      <label className={label}>
        비밀번호 <span className="font-normal text-muted">8자 이상</span>
        <input value={f.password} onChange={set("password")} className={input} type="password" autoComplete="new-password" />
      </label>
      <label className={label}>
        비밀번호 확인
        <input value={f.password2} onChange={set("password2")} className={input} type="password" autoComplete="new-password" />
        {f.password2 && f.password !== f.password2 && <span className="mt-1 block text-[12px] font-normal text-error">비밀번호가 같지 않아요.</span>}
      </label>

      <div className="space-y-3 rounded-2xl bg-surface p-4">
        <label className="flex items-center gap-2.5 text-[14px] font-bold">
          <input type="checkbox" checked={allAgree} onChange={(e) => setAgree({ terms: e.target.checked, company: e.target.checked, privacy: e.target.checked })} className="h-4 w-4" />
          모두 동의
        </label>
        {check("terms", "(필수) 웨딩 파트너스 이용 조건에 동의합니다. 소개비는 실제 수거·판매 정산 완료 건의 수거 수량 기준으로 지급되며, 중복 접수·본인 추천 등 부정 추천은 지급되지 않습니다.")}
        {check("company", "(필수) 소속 회사의 제휴·겸업 규정을 확인했고, 이를 지키겠습니다.")}
        {check("privacy", "(필수) 파트너 관리·정산을 위한 개인정보(이름·연락처·이메일·정산 계좌) 수집·이용에 동의합니다.")}
      </div>

      {error && <p className="text-[13px] text-error">{error}</p>}
      <button type="submit" disabled={!ready || busy} className="h-14 w-full rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-40">
        {busy ? "가입 중…" : "가입 신청하기"}
      </button>
      <p className="text-center text-[12.5px] text-muted">
        이미 가입하셨나요?{" "}
        <Link href="/wedding-partners/login" className="font-semibold underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
