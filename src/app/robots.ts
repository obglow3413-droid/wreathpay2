import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/driver", "/ribbon/", "/status", "/estimate/complete", "/api/"] }],
    sitemap: "https://kkotpay.kr/sitemap.xml",
  };
}
