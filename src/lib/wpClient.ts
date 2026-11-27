"use client";

/** 웨딩 파트너 추천 링크로 들어온 고객의 추천 코드를 기기에 30일간 보관(브라우저 전용). */
const KEY = "kkotpay:wp";
const TTL = 30 * 86400_000;

export interface StoredWp {
  code: string;
  name: string;
}

export function saveWpRef(code: string, name: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, name, at: Date.now() }));
  } catch {}
}

export function readWpRef(): StoredWp | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { code?: string; name?: string; at?: number };
    if (!v.code || !/^[a-z0-9]{5,12}$/.test(v.code) || !v.at || Date.now() - v.at > TTL) return null;
    return { code: v.code, name: String(v.name ?? "").slice(0, 40) };
  } catch {
    return null;
  }
}
