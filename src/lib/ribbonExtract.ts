import type { AiImageInput } from "@/lib/aiEstimate";

/** 화환 리본 사진 → 보내는 분(업체/사람)·문구 명단. 결과는 AI 판독이라 관리자 검수 후 고객에게 확정 표시한다. */
export interface RibbonItem {
  sender: string;
  text: string;
  uncertain?: boolean;
}

const MODEL = process.env.AI_ESTIMATE_MODEL || "claude-sonnet-5-5";

const TOOL = {
  name: "report_ribbons",
  description: "사진 속 화환 리본에 적힌 보내는 분과 문구를 목록으로 보고한다.",
  input_schema: {
    type: "object",
    properties: {
      ribbons: {
        type: "array",
        items: {
          type: "object",
          properties: {
            sender: { type: "string", description: "보내는 사람/업체/단체명 (보이는 그대로, 직함 포함). 없으면 빈 문자열" },
            text: { type: "string", description: "경조사 문구 (예: 謹弔, 삼가 고인의 명복을 빕니다, 祝 開業). 한자는 그대로 적는다" },
            uncertain: { type: "boolean", description: "글씨가 흐리거나 가려져 확신이 없으면 true" },
          },
          required: ["sender", "text"],
        },
      },
    },
    required: ["ribbons"],
  },
} as const;

export async function extractRibbons(images: AiImageInput[]): Promise<RibbonItem[] | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || images.length === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
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
              {
                type: "text" as const,
                text: "장례식·예식·개업 화환에서 떼어낸 리본 사진입니다. 리본 하나당 한 항목으로, 리본에 실제로 적힌 보내는 분(업체/사람)과 문구만 그대로 옮겨 적으세요. 보이지 않거나 읽을 수 없는 글자는 추측해서 채우지 말고 uncertain=true로 표시하세요. 같은 리본이 여러 사진에 중복되면 한 번만 적으세요. 반드시 report_ribbons 도구로만 답하세요.",
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("[ribbonExtract] API error", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const json = (await res.json()) as { content?: { type: string; input?: { ribbons?: RibbonItem[] } }[] };
    const list = json.content?.find((c) => c.type === "tool_use")?.input?.ribbons;
    if (!Array.isArray(list)) return null;
    return list.slice(0, 100).map((r) => ({
      sender: String(r.sender ?? "").slice(0, 80),
      text: String(r.text ?? "").slice(0, 120),
      uncertain: Boolean(r.uncertain),
    }));
  } catch (e) {
    console.error("[ribbonExtract] failed", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
