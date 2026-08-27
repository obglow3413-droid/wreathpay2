export type LandingSlug = "funeral" | "wedding" | "opening" | "business";

export interface LandingContent {
  slug: LandingSlug;
  eyebrow: string;
  headline: string;
  subcopy: string;
  bullets: string[];
  seoTitle: string;
  seoDescription: string;
}

export const LANDING_CONTENT: Record<LandingSlug, LandingContent> = {
  funeral: {
    slug: "funeral",
    eyebrow: "장례식 근조화환 수거",
    headline: "장례 끝난 화환,\n그냥 두고 오지 마세요.",
    subcopy: "근조화환도 상태에 따라 매입 가능합니다. 사진만 올리면 예상 금액을 바로 확인해요.",
    bullets: ["장례식장 현장 방문수거", "근조화환 전문 매입", "빠른 정산"],
    seoTitle: "장례식 근조화환 수거 · 현금매입 | 꽃깞",
    seoDescription: "장례식 근조화환수거, 화환 현금매입. 사진으로 간편하게 견적받고 방문수거까지 한번에.",
  },
  wedding: {
    slug: "wedding",
    eyebrow: "결혼식 축하화환 수거",
    headline: "결혼식 끝난 축하화환,\n현금으로 돌려받으세요.",
    subcopy: "웨딩홀에 남은 축하화환, 사진 등록만으로 예상 페이백 금액을 확인할 수 있어요.",
    bullets: ["웨딩홀 현장 방문수거", "축하화환 전문 매입", "대량 수거 우대"],
    seoTitle: "결혼식 축하화환 수거 · 현금매입 | 꽃깞",
    seoDescription: "결혼식 화환수거, 축하화환수거를 사진 한 장으로 간편하게. 방문수거 후 현금 정산.",
  },
  opening: {
    slug: "opening",
    eyebrow: "개업식 화환 수거",
    headline: "개업식 끝난 화환도\n매입해드립니다.",
    subcopy: "개업화환 역시 상태와 수량에 따라 매입이 가능합니다. 지금 사진으로 확인해보세요.",
    bullets: ["매장·사무실 방문수거", "개업화환 전문 매입", "당일 견적 확인"],
    seoTitle: "개업화환 수거 · 현금매입 | 꽃깞",
    seoDescription: "개업화환수거, 화환 매입 서비스. 사진 등록 후 예상 견적을 바로 확인하세요.",
  },
  business: {
    slug: "business",
    eyebrow: "기업행사 화환 수거",
    headline: "기업행사 화환,\n한번에 정리하고 정산받으세요.",
    subcopy: "행사 규모가 클수록 더 빠르게 배차됩니다. 대량 화환도 문의해주세요.",
    bullets: ["대량 화환 우선 배차", "기업행사 전문 매입", "세금계산서 발행 가능(협의)"],
    seoTitle: "기업행사 화환 수거 · 대량매입 | 꽃깞",
    seoDescription: "기업행사 화환수거 및 대량 현금매입. 사진으로 견적받고 빠르게 방문수거하세요.",
  },
};
