export type EventType = "funeral" | "wedding" | "opening" | "corporate" | "etc";

export type QuantityRange = "1-4" | "5-9" | "10-29" | "30-49" | "50+";

export type RequestStatus =
  | "received"
  | "estimating"
  | "estimated"
  | "customer_approved"
  | "dispatch_pending"
  | "dispatched"
  | "collecting"
  | "collected"
  | "settled"
  | "cancelled";

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  funeral: "장례식",
  wedding: "결혼식",
  opening: "개업식",
  corporate: "기업행사",
  etc: "기타",
};

export const QUANTITY_RANGE_LABEL: Record<QuantityRange, string> = {
  "1-4": "1~4개",
  "5-9": "5~9개",
  "10-29": "10~29개",
  "30-49": "30~49개",
  "50+": "50개 이상",
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  received: "접수",
  estimating: "견적중",
  estimated: "견적완료",
  customer_approved: "고객승인",
  dispatch_pending: "배차대기",
  dispatched: "배차완료",
  collecting: "수거중",
  collected: "수거완료",
  settled: "정산완료",
  cancelled: "취소",
};

export const PICKUP_TIME_SLOTS = ["오전", "오후", "저녁", "시간 협의"] as const;
export type PickupTimeSlot = (typeof PICKUP_TIME_SLOTS)[number];

export interface EstimateFormData {
  eventType: EventType | null;
  quantityRange: QuantityRange | null;
  images: File[];
  placeName: string;
  address: string;
  addressDetail: string;
  pickupDate: string;
  pickupTimeSlot: PickupTimeSlot | null;
  customerName: string;
  customerPhone: string;
  agreements: {
    disposalAuthority: boolean;
    siteRestriction: boolean;
    finalPriceVariation: boolean;
    privacy: boolean;
  };
}

export interface EstimateRequestRow {
  id: string;
  request_no: string;
  customer_id: string;
  event_type: EventType;
  quantity_range: QuantityRange;
  place_name: string;
  address: string;
  address_detail: string | null;
  pickup_date: string;
  pickup_time_slot: string;
  customer_note: string | null;
  status: RequestStatus;
  grade_premium_count: number;
  grade_a_count: number;
  grade_b_count: number;
  grade_c_count: number;
  estimated_sale_amount: number;
  customer_payback_amount: number;
  estimated_logistics_cost: number;
  estimated_other_cost: number;
  estimated_contribution_margin: number;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    phone: string;
  };
}
