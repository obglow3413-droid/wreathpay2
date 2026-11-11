import type { ServiceKey } from "./ServiceTabContext";

export interface ServiceContent {
  tabLabel: string;
  badge: string;
  titleLines: [string, string];
  desc: [string, string];
  ctaLabel: string;
  ctaHref: string;
  footNote: string;
  cardTitle: string;
  cardDesc: string;
  uploadLabel: string;
}

export const SERVICE_ORDER: ServiceKey[] = ["celebration", "funeral"];

export const SERVICE_CONTENT: Record<ServiceKey, ServiceContent> = {
  celebration: {
    tabLabel: "개업·축하화환",
    badge: "개업 · 결혼 · 기업행사 축하화환",
    titleLines: ["축하는 받으시고,", "화환은 현금으로."],
    desc: ["행사가 끝난 화환, 그냥 두면 처리 비용입니다.", "사진 한 장이면 지금 받을 수 있는 페이백 가격을 확인할 수 있어요."],
    ctaLabel: "축하화환 페이백 받기",
    ctaHref: "/estimate?eventType=opening",
    footNote: "수거비용 0원 · 가입 없이 신청 · 평일 09:00–18:00 상담",
    cardTitle: "사진 올리고 페이백 확인하기",
    cardDesc: "화환 등급별 시세도 함께 안내해 드려요.",
    uploadLabel: "축하화환 사진 올리기",
  },
  funeral: {
    tabLabel: "근조화환",
    badge: "장례식장 · 상가 근조화환",
    titleLines: ["마음을 전한 화환,", "정중하게 거두겠습니다."],
    desc: ["조문이 끝난 근조화환을 조용하고 신속하게 방문수거합니다.", "사진 한 장으로 수거 가능 여부와 정산 금액을 안내해 드립니다."],
    ctaLabel: "근조화환 수거 신청",
    ctaHref: "/estimate?eventType=funeral",
    footNote: "수거비용 0원 · 가입 없이 신청 · 평일 09:00–18:00 상담",
    cardTitle: "사진 올리고 수거 가능 여부 확인하기",
    cardDesc: "장례식장·상가 위치만 알려주시면 됩니다.",
    uploadLabel: "근조화환 사진 올리기",
  },
};
