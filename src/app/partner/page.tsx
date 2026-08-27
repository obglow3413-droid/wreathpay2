"use client";

import { useState } from "react";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";

const CATEGORIES = ["화환 수거대행", "화환 재판매·도매", "배송·물류", "기타"];

const REGIONS = [
  "전국",
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const BENEFITS = [
  "꽃깞 신청 고객에게 우선 매칭",
  "화환수거·재판매 두 카테고리 동시 등록 가능",
  "지역 기반 자동 매칭",
];

export default function PartnerApplyPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [companyName, setCompanyName] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [customRegion, setCustomRegion] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRegion(region: string) {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  async function handleSubmit() {
    if (!companyName || !applicantName || !phone) {
      setError("업체명, 신청자명, 대표번호는 필수예요.");
      return;
    }
    if (regions.length === 0 && !customRegion) {
      setError("서비스 지역을 1개 이상 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const serviceRegions = customRegion ? [...regions, customRegion] : regions;
      const res = await fetch("/api/partner-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          companyName,
          applicantName,
          email,
          phone,
          website,
          serviceRegions,
          memo,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("등록에 실패했어요. 다시 시도해주세요.");
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
            등록 신청이
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

      <main className="mx-auto w-full max-w-4xl flex-1 md:grid md:grid-cols-[280px_1fr]">
        {/* 좌측 소개 패널 */}
        <div className="bg-foreground px-6 py-10 text-white md:sticky md:top-14 md:h-[calc(100dvh-56px)] md:px-8 md:py-12">
          <span className="inline-block rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold">
            무료 등록
          </span>
          <h1 className="mt-4 text-[22px] font-bold leading-snug">
            업체를 운영 중이신가요?
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
            꽃깞에 무료로 등록하고 더 많은 매칭 기회를 만나보세요.
          </p>
          <ul className="mt-6 space-y-2.5 text-[13px] text-white/80">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-brand">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 우측 등록폼 */}
        <div className="px-5 py-8 md:px-10 md:py-10">
          <h2 className="text-[17px] font-bold">등록 신청서</h2>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 w-full rounded-lg border border-border px-3 text-[15px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">
                업체명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">
                신청자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">
                대표번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="02-0000-0000"
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">웹사이트</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="홈페이지, 블로그, SNS를 입력"
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-[13.5px] font-medium">
              서비스 지역 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {REGIONS.map((region) => (
                <label key={region} className="flex items-center gap-2 text-[13.5px]">
                  <input
                    type="checkbox"
                    checked={regions.includes(region)}
                    onChange={() => toggleRegion(region)}
                    className="h-4 w-4 accent-[color:var(--brand)]"
                  />
                  {region}
                </label>
              ))}
              <div className="col-span-2 flex items-center gap-2 text-[13.5px] sm:col-span-3">
                기타:
                <input
                  type="text"
                  value={customRegion}
                  onChange={(e) => setCustomRegion(e.target.value)}
                  placeholder="직접 입력"
                  className="h-9 flex-1 rounded-lg border border-border px-3 text-[13.5px] placeholder:text-muted-light"
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-[13.5px] font-medium">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="추가로 전달하실 내용이 있으면 입력해주세요."
              rows={3}
              className="w-full resize-none rounded-lg border border-border px-4 py-3 text-[15px] placeholder:text-muted-light"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-7 flex h-14 w-full items-center justify-center rounded-xl bg-brand text-[16px] font-semibold text-white transition disabled:opacity-50 md:w-fit md:px-10"
          >
            {submitting ? "등록 중..." : "등록 신청하기"}
          </button>
        </div>
      </main>
    </div>
  );
}
