import crypto from "node:crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // 헷갈리는 글자(l, i, o, 0, 1) 제외

export function generateBoardCode(len = 8): string {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const RIBBON_EVENT_LABEL: Record<string, string> = {
  funeral: "근조",
  wedding: "결혼",
  opening: "개업",
  corporate: "행사",
};

export const RIBBON_PHOTO_BUCKET = "estimate-photos";
