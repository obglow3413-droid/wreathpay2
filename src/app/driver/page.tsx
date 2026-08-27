"use client";

import { useState } from "react";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";

const VEHICLE_TYPES = ["다마스/라보", "1톤 트럭", "개인승용차(소량)", "기타"];

const BENEFITS = [
  "원하는 시간·요일에만 활동 가능",
  "수거 건당 정산, 투명한 정산 구조",
  "활동 지역 직접 선택",
  "화환 외 별도 상하차 부담 적음",
];

export default function DriverApplyPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name || !phone) {
      setError("이름과 연락처는 필수예요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/driver-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, region, vehicleType, vehicleNumber, message }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("지원서 접수에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <div className="fade-up text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl">
            ✓
          </div>
          <h1 className="mt-5 text-[22px] font-bold leading-snug">
            지원서 접수가
            <br />
            완료되었습니다.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            검토 후 등록하신 연락처로 안내드릴게요.
          </p>
        </div>
        <Link
          href="/"
          className="mt-8 flex h-13 items-center justify-center rounded-xl border border-border py-3.5 text-[15px] font-semibold text-foreground"
        >
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BackHeader />

      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-10">
        <div className="fade-up">
          <p className="text-[13px] font-semibold text-brand">수거기사 모집</p>
          <h1 className="mt-3 text-[26px] font-extrabold leading-snug tracking-tight">
            화환 수거 기사님을
            <br />
            모집합니다.
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
            내 시간에 맞춰 화환을 수거하고, 건당 정산받으세요.
          </p>

          <ul className="mt-6 space-y-2 text-[13.5px] text-muted">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-9 space-y-4">
          <h2 className="text-[16px] font-bold">지원서 작성</h2>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해주세요"
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">연락처</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">활동 희망지역</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="예) 서울 강남구, 경기 고양시"
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">보유 차량</label>
            <div className="grid grid-cols-2 gap-2.5">
              {VEHICLE_TYPES.map((type) => {
                const isActive = vehicleType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVehicleType(type)}
                    className={`rounded-xl border px-3.5 py-3 text-left text-[13.5px] font-medium transition ${
                      isActive
                        ? "border-brand bg-brand-tint text-brand-dark"
                        : "border-border bg-white text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">차량번호 (선택)</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="예) 12가 3456"
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">하고 싶은 말 (선택)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="활동 가능 시간대, 경력 등을 자유롭게 적어주세요"
              rows={3}
              className="w-full resize-none rounded-lg border border-border px-4 py-3 text-[15px] placeholder:text-muted-light"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-brand text-[16px] font-semibold text-white transition disabled:opacity-50"
          >
            {submitting ? "접수 중..." : "지원하기"}
          </button>
        </div>
      </main>
    </div>
  );
}
