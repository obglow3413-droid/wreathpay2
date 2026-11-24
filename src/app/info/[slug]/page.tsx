import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackHeader from "@/components/layout/BackHeader";
import JsonLd from "@/components/JsonLd";
import PaybackCalculator from "@/components/tools/PaybackCalculator";
import { INFO_ARTICLES, getInfoArticle } from "@/lib/infoArticles";
import { articleLd, breadcrumbLd, faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return INFO_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getInfoArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/info/${a.slug}` },
    openGraph: { title: a.title, description: a.description, type: "article", url: `/info/${a.slug}` },
  };
}

export default async function InfoArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getInfoArticle(slug);
  if (!a) notFound();
  const others = INFO_ARTICLES.filter((x) => x.slug !== a.slug);
  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />
      <JsonLd data={articleLd({ title: a.title, description: a.description, path: `/info/${a.slug}`, updated: a.updated })} />
      <JsonLd data={faqLd(a.faq)} />
      <JsonLd data={breadcrumbLd([{ name: "홈", path: "/" }, { name: "화환 안내", path: "/info" }, { name: a.title, path: `/info/${a.slug}` }])} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 pb-12">
        <Link href="/info" className="text-[12.5px] text-muted underline underline-offset-4">← 화환 안내</Link>
        <h1 className="mt-4 text-[24px] font-extrabold leading-snug md:text-[30px]">{a.title}</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{a.intro}</p>

        {a.sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-[17px] font-bold">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-2 text-[14.5px] leading-relaxed">{t}</p>
            ))}
          </section>
        ))}

        <Link href={a.cta.href} className="mt-8 flex h-13 w-full items-center justify-center rounded-xl bg-brand py-3.5 text-[15.5px] font-bold text-white">
          {a.cta.label}
        </Link>

        <div className="mt-8">
          <PaybackCalculator />
        </div>

        <section className="mt-10">
          <h2 className="text-[17px] font-bold">자주 묻는 질문</h2>
          <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-white">
            {a.faq.map((f) => (
              <div key={f.q} className="px-5 py-4">
                <dt className="text-[14.5px] font-bold">{f.q}</dt>
                <dd className="mt-1.5 text-[14px] leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-[15px] font-bold">함께 보면 좋은 글</h2>
          <ul className="mt-3 space-y-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/info/${o.slug}`} className="block rounded-xl border border-border bg-white px-4 py-3.5 text-[14px] font-semibold">{o.title}</Link>
              </li>
            ))}
          </ul>
        </section>
        <p className="mt-8 text-[11.5px] text-muted-light">최종 수정 {a.updated} · 페이백 금액과 수거 가능 여부는 화환 수량·상태와 시설 규정에 따라 달라질 수 있어요.</p>
      </main>
    </div>
  );
}
