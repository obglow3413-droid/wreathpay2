import type { MetadataRoute } from "next";
import { getAllPlaces } from "@/lib/places";

const BASE = "https://kkotpay.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/estimate", "/pricing", "/guide", "/about", "/ribbon", "/partner", "/places"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  const places = await getAllPlaces();
  return [...pages, ...places.map((p) => ({ url: `${BASE}/places/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 }))];
}
