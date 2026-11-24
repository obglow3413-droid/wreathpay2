import type { Metadata } from "next";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";
import JsonLd from "@/components/JsonLd";
import { INFO_ARTICLES } from "@/lib/infoArticles";
import { breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "화환 수거·처리 안내",
  description: "화환 수거 신청 방법, 근조화환·결혼식 축하화환·개업 화환을 행사 후 정리하는 방법을 안내합니다.",
  alternates: { canonical: "/info" },
};

export default function InfoIndexPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <JsonLd data={breadcrumbLd([{ name: "홈", path: "/" }, { name: "화환 안내", path: "/info" }])} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 pb-12">
        <p className="text-[12.5px] font-semibold tracking-wide text-brass">GUIDE</p>
        <h1 className="mt-2 text-[23px] font-extrabold leading-snug">화환 수거·처리 안내</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">행사가 끝난 뒤 화환을 어떻게 정리하면 되는지 상황별로 정리했어요.</p>
        <ul className="mt-6 space-y-3">
          {INFO_ARTICLES.map((a) => (
            <li key={a.slug}>
              <Link href={`/info/${a.slug}`} className="block rounded-2xl border border-border bg-white px-5 py-4">
                <span className="block text-[15px] font-bold leading-snug">{a.title}</span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">{a.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
