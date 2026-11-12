import crypto from "node:crypto";

/**
 * 페이백 계좌번호는 DB에 평문으로 두지 않고 AES-256-GCM 으로 암호화해 저장한다.
 * 키: 환경변수 PAYOUT_ENC_KEY (base64, 32바이트). 없으면 계좌 등록을 받지 않는다(fail closed).
 */
export const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행", "SC제일은행", "카카오뱅크", "토스뱅크", "케이뱅크",
  "새마을금고", "우체국", "수협은행", "부산은행", "대구은행", "광주은행", "전북은행", "경남은행", "제주은행", "신협",
] as const;

function key(): Buffer | null {
  const raw = process.env.PAYOUT_ENC_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

export function isAccountStorageConfigured(): boolean {
  return key() !== null;
}

export function encryptAccount(plain: string): string {
  const k = key();
  if (!k) throw new Error("PAYOUT_ENC_KEY missing");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decryptAccount(payload: string): string {
  const k = key();
  if (!k) throw new Error("PAYOUT_ENC_KEY missing");
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", k, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
