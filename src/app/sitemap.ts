import type { MetadataRoute } from "next";
import { getAllPlaces } from "@/lib/places";

const BASE = "https://kkotpay.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/estimate", "/pricing", "/guide", "/about", "/ribbon", "/partner", "/places", "/reserve", "/reviews", "/wedding-checklist"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  const places = await getAllPlaces();
  const areas = [...new Set(places.map((p) => `${p.sido}-${p.sigungu}`))];
  return [...pages, ...areas.map((a) => ({ url: `${BASE}/area/${encodeURIComponent(a)}`, changeFrequency: "weekly" as const, priority: 0.6 })), ...places.map((p) => ({ url: `${BASE}/places/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 }))];
}
