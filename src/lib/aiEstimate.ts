import { calculatePricing, DEFAULT_PAYBACK_RATE, type GradeCounts, type GradeUnitPrices } from "@/lib/pricing";

/**
 * 사진 → 화환 수량·등급 판독(AI) → 기존 단가표로 페이백 "범위" 계산.
 * 금액은 AI가 정하지 않고, AI가 읽은 등급별 수량(최소~최대)에 관리자 단가를 곱해 계산한다.
 */

export interface AiImageInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

export interface AiEstimateResult {
  /** ok: 금액 범위 안내 가능 / review: 사진만으로 산정이 어려워 담당자 확인 필요 */
  status: "ok" | "review";
  confidence: "high" | "medium" | "low";
  isWreathPhoto: boolean;
  visibleCount: number;
  low: { counts: GradeCounts; sale: number; payback: number };
  high: { counts: GradeCounts; sale: number; payback: number };
  notes: string;
  model: string;
  createdAt: string;
}

const DEFAULT_PRICES: GradeUnitPrices = { premium: 80000, a: 50000, b: 30000, c: 10000 };
const MODEL = process.env.AI_ESTIMATE_MODEL || "claude-sonnet-5-5";

export function isAiEstimateConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const GRADE_GUIDE = `등급 기준(재매각 관점):
- premium: 대형(3단 이상) 생화, 꽃이 풍성하고 싱싱하며 리본·받침 상태가 매우 좋음
- a: 일반 3단 화환, 생화 상태 양호, 눈에 띄는 훼손 없음
- b: 1~2단이거나 일부 시들었거나 리본·장식 일부 훼손, 재사용은 가능
- c: 조화 위주, 심하게 시들었거나 파손되어 재사용 가치가 낮음(부자재 회수 수준)`;

const TOOL = {
  name: "report_estimate",
  description: "사진 속 화환의 개수와 등급별 수량(최소~최대)을 보고한다.",
  input_schema: {
    type: "object",
    properties: {
      is_wreath_photo: { type: "boolean", description: "화환이 실제로 보이는 사진인지" },
      visible_wreath_count: { type: "integer", description: "사진에서 확실히 보이는 화환 수" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      grades: {
        type: "object",
        properties: {
          premium: { type: "object", properties: { min: { type: "integer" }, max: { type: "integer" } }, required: ["min", "max"] },
          a: { type: "object", properties: { min: { type: "integer" }, max: { type: "integer" } }, required: ["min", "max"] },
          b: { type: "object", properties: { min: { type: "integer" }, max: { type: "integer" } }, required: ["min", "max"] },
          c: { type: "object", properties: { min: { type: "integer" }, max: { type: "integer" } }, required: ["min", "max"] },
        },
        required: ["premium", "a", "b", "c"],
      },
      notes: { type: "string", description: "판단 근거를 한국어 한 문장으로 (예: 3단 생화 위주, 일부 가려짐)" },
    },
    required: ["is_wreath_photo", "visible_wreath_count", "confidence", "grades", "notes"],
  },
} as const;

interface ToolInput {
  is_wreath_photo: boolean;
  visible_wreath_count: number;
  confidence: "high" | "medium" | "low";
  grades: Record<keyof GradeCounts, { min: number; max: number }>;
  notes: string;
}

const clamp = (n: unknown, max = 200) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));
const roundDown = (n: number) => Math.floor(n / 1000) * 1000;
const roundUp = (n: number) => Math.ceil(n / 1000) * 1000;

/** 사진을 AI로 판독해 페이백 범위를 계산. 키가 없거나 호출이 실패하면 null(= 호출 측에서 담당자 확인으로 처리). */
export async function runAiEstimate(
  images: AiImageInput[],
  options: { eventTypeHint?: string; prices?: GradeUnitPrices; paybackRate?: number } = {}
): Promise<AiEstimateResult | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || images.length === 0) return null;

  const prices = options.prices ?? DEFAULT_PRICES;
  const rate = options.paybackRate ?? DEFAULT_PAYBACK_RATE;

  const hint = options.eventTypeHint ? `행사 종류 힌트: ${options.eventTypeHint}.\n` : "";
  const prompt = `${hint}장례식장·예식장·개업식 등에서 나온 화환 사진입니다. 여러 장이면 같은 현장을 다른 각도에서 찍은 것일 수 있으니 중복해서 세지 마세요.
사진에서 확실히 보이는 화환만 세고, 가려져서 불확실하면 범위(min~max)를 넓게 주세요. 화환이 아니면 is_wreath_photo=false로 답하세요.
${GRADE_GUIDE}
등급별 min/max의 합이 전체 화환 수와 어긋나지 않게 해주세요. 반드시 report_estimate 도구로만 답하세요.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [
          {
            role: "user",
            content: [
              ...images.slice(0, 3).map((img) => ({
                type: "image" as const,
                source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
              })),
              { type: "text" as const, text: prompt },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[aiEstimate] API error", res.status, (await res.text()).slice(0, 300));
      return null;
    }

    const json = (await res.json()) as { content?: { type: string; input?: ToolInput }[] };
    const input = json.content?.find((c) => c.type === "tool_use")?.input;
    if (!input) return null;

    const lowCounts: GradeCounts = { premium: 0, a: 0, b: 0, c: 0 };
    const highCounts: GradeCounts = { premium: 0, a: 0, b: 0, c: 0 };
    for (const g of ["premium", "a", "b", "c"] as const) {
      const lo = clamp(input.grades?.[g]?.min);
      const hi = Math.max(lo, clamp(input.grades?.[g]?.max));
      lowCounts[g] = lo;
      highCounts[g] = hi;
    }

    const costs = { logisticsCost: 0, otherCost: 0, paybackRate: rate };
    const lowPricing = calculatePricing(lowCounts, prices, costs);
    const highPricing = calculatePricing(highCounts, prices, costs);

    const totalHigh = highCounts.premium + highCounts.a + highCounts.b + highCounts.c;
    const needsReview = !input.is_wreath_photo || input.confidence === "low" || totalHigh === 0;

    return {
      status: needsReview ? "review" : "ok",
      confidence: input.confidence,
      isWreathPhoto: Boolean(input.is_wreath_photo),
      visibleCount: clamp(input.visible_wreath_count),
      low: { counts: lowCounts, sale: lowPricing.estimatedSaleAmount, payback: roundDown(lowPricing.customerPaybackAmount) },
      high: { counts: highCounts, sale: highPricing.estimatedSaleAmount, payback: roundUp(highPricing.customerPaybackAmount) },
      notes: String(input.notes ?? "").slice(0, 200),
      model: MODEL,
      createdAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error("[aiEstimate] failed", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 고객 화면에 내려줄 최소 정보 (단가·원가 등은 제외) */
export interface PublicAiEstimate {
  status: "ok" | "review";
  confidence: "high" | "medium" | "low";
  lowPayback: number;
  highPayback: number;
  visibleCount: number;
  notes: string;
}

export function toPublicEstimate(r: AiEstimateResult): PublicAiEstimate {
  return {
    status: r.status,
    confidence: r.confidence,
    lowPayback: r.low.payback,
    highPayback: r.high.payback,
    visibleCount: r.visibleCount,
    notes: r.notes,
  };
}

/** 업로드된 File → AI 입력(base64). 5MB 초과 파일은 제외 */
export async function filesToAiImages(files: File[]): Promise<AiImageInput[]> {
  const out: AiImageInput[] = [];
  for (const f of files.slice(0, 3)) {
    if (f.size > 5 * 1024 * 1024) continue;
    const type = f.type === "image/png" || f.type === "image/webp" || f.type === "image/gif" ? f.type : "image/jpeg";
    out.push({ base64: Buffer.from(await f.arrayBuffer()).toString("base64"), mediaType: type });
  }
  return out;
}
