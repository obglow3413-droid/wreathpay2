import type { Metadata } from "next";
import BackHeader from "@/components/layout/BackHeader";
import ShareTextTool from "./ShareTextTool";

export const metadata: Metadata = {
  title: "청첩장·부고·개업 안내용 화환 문구",
  description: "청첩장, 부고, 개업 안내에 붙여 넣는 화환 안내 문구를 만들어 드려요.",
  alternates: { canonical: "/share-text" },
};

export default function ShareTextPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-8 pb-12">
        <h1 className="text-[22px] font-extrabold leading-snug">안내문에 붙이는 화환 문구</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">청첩장·부고·개업 안내에 그대로 붙여 넣으세요. 행사 후 화환 정리가 한결 쉬워져요.</p>
        <ShareTextTool />
      </main>
    </div>
  );
}
