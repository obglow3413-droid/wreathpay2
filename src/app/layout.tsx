import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wreathpay-up6f.vercel.app"),
  title: {
    default: "꽃깞 - 세상의 모든 화환을 페이백 합니다.",
    template: "%s | 꽃깞",
  },
  description:
    "결혼식·장례식·개업식·기업행사 화환을 사진으로 간편하게 견적받고 현금으로 돌려받으세요. 화환수거, 근조화환수거, 축하화환수거, 화환 현금매입 전문 서비스.",
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
  ],
  openGraph: {
    title: "꽃깞 - 세상의 모든 화환을 페이백 합니다.",
    description: "사진 한 장으로 화환 예상 견적을 확인하고, 방문수거 후 현금으로 돌려받으세요.",
    locale: "ko_KR",
    type: "website",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
