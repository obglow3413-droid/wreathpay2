
import type { ServiceKey } from "./ServiceTabContext";

export const SERVICE_CONTENT: Record
  ServiceKey,
  {
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
> = {
  wreath: {
    badge: "세상의 모든 화환을 페이백해드립니다",
    titleLines: ["버려지는 화환이", "현금으로 돌아옵니다."],
    desc: ["받은 화환, 그냥 보내면 0원.", "사진 한 장이면 지금 받을 수 있는 페이백 가격을 확인할 수 있습니다."],
    ctaLabel: "지금바로 페이백 받기",
    ctaHref: "/estimate",
    footNote: "사진 견적 무료 · 방문수거 · 수거 완료 후 빠른 정산",
    cardTitle: "사진 올리고 페이백 확인하기",
    cardDesc: "등급별 시세도 함께 확인할 수 있어요.",
    uploadLabel: "화환 사진 올리기",
  },
  plant: {
    badge: "개업 후 남은 화분도 회수해드립니다",
    titleLines: ["사무실 화분 12개,", "관리 담당자는 아직도 공석입니다."],
    desc: ["개업 후 남은 화분, 그냥 두면 골칫거리.", "사진 한 장이면 회수 가능 여부를 바로 확인할 수 있습니다."],
    ctaLabel: "지금바로 화분 회수 신청",
    ctaHref: "/plant-collection",
    footNote: "사진 확인 무료 · 방문회수 · 상태 확인 후 안내",
    cardTitle: "사진 올리고 회수 가능여부 확인하기",
    cardDesc: "화분 종류·크기별 조건도 함께 확인할 수 있어요.",
    uploadLabel: "화분 사진 올리기",
  },
};
