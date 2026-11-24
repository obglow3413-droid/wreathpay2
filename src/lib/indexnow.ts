import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAllPlaces } from "@/lib/places";
import { INFO_ARTICLES } from "@/lib/infoArticles";
import { LANDING_CONTENT } from "@/lib/landingContent";
import { SITE_URL } from "@/lib/seo";

/**
 * IndexNow: 네이버·빙에 "이 주소들이 새로 생기거나 바뀌었다"고 직접 알려 색인을 앞당긴다.
 * 계정 등록 없이 쓸 수 있고, 키 파일(public/<키>.txt)로 사이트 소유를 증명한다. 키는 공개돼도 되는 값이다.
 */
export const INDEXNOW_KEY = "6f80a074382ae3ba22cd1aa6bfa6aa1b";
const ENDPOINTS = ["https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"];

export async function allPublicUrls(): Promise<string[]> {
  const core = ["", "/estimate", "/pricing", "/guide", "/about", "/places", "/reserve", "/reviews", "/wedding-checklist", "/info"];
  const places = await getAllPlaces();
  const areas = [...new Set(places.map((p) => `${p.sido}-${p.sigungu}`))];
  return [
    ...core,
    ...Object.keys(LANDING_CONTENT).map((t) => `/landing/${t}`),
    ...INFO_ARTICLES.map((a) => `/info/${a.slug}`),
    ...areas.map((a) => `/area/${encodeURIComponent(a)}`),
    ...places.map((p) => `/places/${p.slug}`),
  ].map((p) => `${SITE_URL}${p}`);
}

/** 전체 주소 제출은 30일에 한 번만(바뀌지 않은 주소를 매일 보내면 무시당한다). 그 사이에는 핵심 페이지만 주 1회. */
export async function submitIndexNow(): Promise<{ mode: string; sent: number; results: Record<string, number> } | null> {
  const svc = await createServiceRoleClient();
  const { data } = await svc.from("system_settings").select("value").eq("key", "indexnow").maybeSingle();
  const state = (data?.value ?? {}) as { fullAt?: string; coreAt?: string };
  const days = (iso?: string) => (iso ? (Date.now() - new Date(iso).getTime()) / 86400_000 : Infinity);
  const full = days(state.fullAt) >= 30;
  if (!full && days(state.coreAt) < 7) return null;
  const all = await allPublicUrls();
  const urlList = full ? all : all.slice(0, 18);
  const results: Record<string, number> = {};
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: "kkotpay.kr", key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
      });
      results[new URL(ep).host] = res.status;
    } catch {
      results[new URL(ep).host] = 0;
    }
  }
  const now = new Date().toISOString();
  await svc.from("system_settings").upsert(
    { key: "indexnow", value: { fullAt: full ? now : state.fullAt, coreAt: now, last: results }, description: "검색엔진 색인 알림(IndexNow) 마지막 제출 기록", updated_at: now },
    { onConflict: "key" }
  );
  return { mode: full ? "full" : "core", sent: urlList.length, results };
}
