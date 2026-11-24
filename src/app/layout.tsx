import type { Metadata } from "next";
import "./globals.css";
import ChannelTalk from "@/components/layout/ChannelTalk";
import JsonLd from "@/components/JsonLd";
import { HOME_DESCRIPTION, HOME_TITLE, organizationLd, websiteLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL("https://kkotpay.kr"),
  title: {
    default: HOME_TITLE,
    template: "%s | KKOT PAY 꽃페이",
  },
  description: HOME_DESCRIPTION,
  applicationName: "KKOT PAY",
  // 검색엔진 사이트 소유 확인값(네이버 서치어드바이저·구글 서치콘솔에서 받은 코드를 환경변수로 넣으면 자동 반영)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NAVER_SITE_VERIFICATION ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION } : undefined,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  keywords: [
    "화환수거",
    "근조화환수거",
    "축하화환수거",
    "장례식 화환수거",
    "결혼식 화환수거",
    "개업화환수거",
    "폐화환수거",
    "화환 매입",
    "화환 현금매입",
    "화환 페이백",
    "화환 수거",
    "화환 처리",
    "화환 수거 업체",
    "꽃페이",
    "KKOT PAY",
  ],
  openGraph: {
    title: HOME_TITLE,
    description: "사진 한 장으로 화환 수거를 신청하고, 방문수거 후 수량·상태에 따라 페이백 받으세요. 수거비 0원.",
    locale: "ko_KR",
    type: "website",
    siteName: "KKOT PAY",
    url: "https://kkotpay.kr",
  },
  twitter: {
    card: "summary_large_image",
    title: "KKOT PAY - 받은 화환, 현금으로 돌려받으세요",
    description: "사진 한 장으로 신청 · 방문수거 · 수거비 0원",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
        <style>{`:root{--font-pretendard:'PretendardVariable';}`}</style>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
        {children}
        <ChannelTalk />
      </body>
    </html>
  );
}
