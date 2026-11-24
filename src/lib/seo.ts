/** 검색 노출용 공통 값과 구조화 데이터(JSON-LD) 생성기 */
export const SITE_URL = "https://kkotpay.kr";
export const SITE_NAME = "KKOT PAY(꽃페이)";
export const HOME_TITLE = "화환 수거·페이백 KKOT PAY(꽃페이) | 근조화환·축하화환 방문수거";
export const HOME_DESCRIPTION =
  "화환 수거는 KKOT PAY(꽃페이). 장례식 근조화환, 결혼식·개업 축하화환을 사진 한 장으로 신청하면 전담기사가 방문수거하고 수량·상태에 따라 페이백해 드려요. 수거비 0원, 서울·경기.";

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "KKOT PAY",
  alternateName: ["꽃페이", "KKOT PAY 꽃페이"],
  legalName: "(주)루우크컴퍼니",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  contactPoint: { "@type": "ContactPoint", telephone: "+82-10-5333-3413", contactType: "customer service", areaServed: "KR", availableLanguage: "Korean" },
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "KKOT PAY",
  alternateName: "꽃페이",
  inLanguage: "ko-KR",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

/** 서비스 설명: 화환 수거·매입(페이백), 서울·경기 */
export const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "화환 수거·페이백",
  serviceType: "화환 수거, 근조화환 수거, 축하화환 수거, 화환 매입",
  description: HOME_DESCRIPTION,
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "AdministrativeArea", name: "서울특별시" },
    { "@type": "AdministrativeArea", name: "경기도" },
  ],
  url: SITE_URL,
};

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: `${SITE_URL}${t.path}` })),
  };
}

export function articleLd(a: { title: string; description: string; path: string; updated: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    dateModified: a.updated,
    datePublished: a.updated,
    inLanguage: "ko-KR",
    mainEntityOfPage: `${SITE_URL}${a.path}`,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}
