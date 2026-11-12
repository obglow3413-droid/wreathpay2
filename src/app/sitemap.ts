import type { MetadataRoute } from "next";

const BASE = "https://kkotpay.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/estimate", "/pricing", "/guide", "/about", "/ribbon", "/partner"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
