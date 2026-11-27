import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import LoginForm from "@/components/wp/LoginForm";

export const metadata: Metadata = { title: "웨딩 파트너 로그인", robots: { index: false, follow: true } };

export default function WpLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 pt-10 pb-16">
        <p className="text-[12px] font-bold tracking-[0.24em] text-brass">WEDDING PARTNERS</p>
        <h1 className="mt-2 text-[24px] font-extrabold tracking-tight">파트너 로그인</h1>
        <LoginForm />
      </main>
    </div>
  );
}
