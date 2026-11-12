import base from "@/data/places-funeral.json";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

export type PlaceKind = "funeral" | "wedding";
export interface Place {
  slug: string;
  kind: PlaceKind;
  name: string;
  sido: string;
  sigungu: string;
  address: string;
  rooms: number | null;
  parking: number | null;
  operatorType: string | null;
  isPartner: boolean;
  isHidden: boolean;
}

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = { funeral: "장례식장", wedding: "웨딩홀" };

/**
 * 장소 목록 = 공공데이터 기본 목록(코드에 포함) + DB places 테이블(관리자가 추가·숨김·제휴 표시한 행).
 * DB 행의 slug 가 기본 목록과 같으면 DB 값이 우선한다.
 */
export async function getAllPlaces(includeHidden = false): Promise<Place[]> {
  const map = new Map<string, Place>();
  for (const p of base as Omit<Place, "isPartner" | "isHidden">[]) map.set(p.slug, { ...p, isPartner: false, isHidden: false });
  if (isServiceRoleConfigured()) {
    try {
      const svc = await createServiceRoleClient();
      const { data } = await svc.from("places").select("slug, kind, name, sido, sigungu, address, rooms, parking, operator_type, is_partner, is_hidden").limit(2000);
      for (const r of data ?? []) {
        map.set(r.slug, {
          slug: r.slug,
          kind: r.kind as PlaceKind,
          name: r.name,
          sido: r.sido,
          sigungu: r.sigungu,
          address: r.address,
          rooms: r.rooms,
          parking: r.parking,
          operatorType: r.operator_type,
          isPartner: r.is_partner,
          isHidden: r.is_hidden,
        });
      }
    } catch (e) {
      console.error("[places]", e);
    }
  }
  // 공공데이터의 시군구 표기가 제각각(수원시 / 수원시팔달구)이라 경기도는 시 단위로 맞춘다
  for (const p of map.values()) {
    const m = p.sido === "경기도" ? p.sigungu.replace(/\s+/g, "").match(/^(.+?시)(.+구)?$/) : null;
    if (m) p.sigungu = m[1];
  }
  const list = [...map.values()].filter((p) => includeHidden || !p.isHidden);
  list.sort((a, b) => Number(b.isPartner) - Number(a.isPartner) || (a.sido === "서울특별시" ? 0 : 1) - (b.sido === "서울특별시" ? 0 : 1) || a.sigungu.localeCompare(b.sigungu, "ko") || a.name.localeCompare(b.name, "ko"));
  return list;
}

export async function getPlace(slug: string): Promise<Place | null> {
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return null;
  return (await getAllPlaces()).find((p) => p.slug === slug) ?? null;
}

/** 주소에서 괄호 설명을 뺀 신청용 주소 */
export const cleanAddress = (a: string) => a.replace(/\s*\(.*\)\s*$/, "").trim();
