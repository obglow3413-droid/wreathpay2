import { Suspense } from "react";
import type { Metadata } from "next";
import SignupForm from "./SignupForm";
import BackHeader from "@/components/layout/BackHeader";

export const metadata: Metadata = {
  title: "가입하기 / 로그인",
  description: "이메일로 간편하게 가입하고 내 접수현황을 확인하세요.",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
