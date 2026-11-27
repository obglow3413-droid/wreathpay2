"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** 파트너 추천 코드·접수 링크·QR코드(다운로드) */
export default function ReferralTools({ code, name }: { code: string; name: string }) {
  const link = `https://kkotpay.kr/w/${code}`;
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(link, { width: 640, margin: 2, color: { dark: "#141211", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  }

  const message = `결혼식 끝나고 남는 축하화환, 꽃페이로 보내시면 수거 후 페이백을 받을 수 있어요. 사진 한 장으로 접수돼요.\n${link}`;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[17px] font-bold">내 추천 링크 · QR</h2>
      <p className="mt-1 text-[12.5px] text-muted">이 링크나 QR로 신랑·신부님이 직접 접수하면 {name}님 추천으로 자동 집계돼요.</p>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11.5px] text-muted">추천 코드</p>
          <p className="text-[18px] font-extrabold tracking-[0.12em]">{code.toUpperCase()}</p>
        </div>
        <button type="button" onClick={() => copy(code, "code")} className="rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-semibold">
          {copied === "code" ? "복사됨" : "코드 복사"}
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3">
        <p className="min-w-0 truncate text-[13.5px] font-semibold">{link.replace("https://", "")}</p>
        <button type="button" onClick={() => copy(link, "link")} className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-semibold">
          {copied === "link" ? "복사됨" : "링크 복사"}
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => copy(message, "msg")} className="h-11 rounded-xl border border-border text-[13px] font-semibold">
          {copied === "msg" ? "복사됨" : "안내 문구 복사"}
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title: "꽃페이 결혼식 화환 페이백", text: message });
              else await copy(message, "msg");
            } catch {}
          }}
          className="h-11 rounded-xl bg-brand text-[13px] font-semibold text-white"
        >
          카톡·문자로 공유
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="추천 QR코드" width={200} height={200} className="h-[200px] w-[200px] rounded-xl border border-border" />
        ) : (
          <div className="h-[200px] w-[200px] animate-pulse rounded-xl bg-surface" />
        )}
        {qr && (
          <a href={qr} download={`kkotpay-qr-${code}.png`} className="mt-3 text-[13px] font-semibold underline">
            QR코드 이미지 저장
          </a>
        )}
        <p className="mt-1 text-[11.5px] text-muted-light">상담 자료·청첩장 안내문에 넣어 쓰세요</p>
      </div>
    </section>
  );
}
