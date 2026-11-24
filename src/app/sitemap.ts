import type { MetadataRoute } from "next";
import { allPublicUrls } from "@/lib/indexnow";

/** 검색엔진에 알리는 주소 목록. IndexNow 제출 목록과 같은 함수를 써서 항상 일치한다. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = await allPublicUrls();
  const now = new Date();
  return urls.map((url) => {
    const path = url.replace("https://kkotpay.kr", "");
    const top = path === "";
    const key = top || path.startsWith("/landing") || path.startsWith("/info") || path === "/estimate";
    return {
      url,
      lastModified: now,
      changeFrequency: top ? ("daily" as const) : path.startsWith("/places/") ? ("monthly" as const) : ("weekly" as const),
      priority: top ? 1 : key ? 0.8 : path.startsWith("/area") ? 0.6 : path.startsWith("/places/") ? 0.5 : 0.7,
    };
  });
}
