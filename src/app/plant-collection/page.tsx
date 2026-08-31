
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import BackHeader from "@/components/layout/BackHeader";

const PLANT_TYPES = ["관엽식물", "난·호접란", "대형 화분", "기타"];
const PLANT_SIZES = ["소형", "중형", "대형"];
const MAX_IMAGES = 5;

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; address: string; jibunAddress: string }) => void;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

export default function PlantCollectionPage() {
  const [plantType, setPlantType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [plantSize, setPlantSize] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupAddressDetail, setPickupAddressDetail] = useState("");
  const [desiredPickupDate, setDesiredPickupDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [requestNote, setRequestNote] = useState("");

  const [addressScriptLoaded, setAddressScriptLoaded] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestNo, setRequestNo] = useState<string | null>(null);

  const previews = images.map((f) => URL.createObjectURL(f));

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setImages((prev) => [...prev, ...Array.from(files)].slice(0, MAX_IMAGES));
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function openAddressSearch() {
    setShowAddressSearch(true);
  }

  useEffect(() => {
    if (!showAddressSearch || !addressScriptLoaded || !addressContainerRef.current) return;
    addressContainerRef.current.innerHTML = "";
    new window.daum.Postcode({
      oncomplete: (data) => {
        setPickupAddress(data.roadAddress || data.address);
        setShowAddressSearch(false);
      },
    }).embed(addressContainerRef.current);
  }, [showAddressSearch, addressScriptLoaded]);

  async function handleSubmit() {
    if (!plantType || !plantSize || !pickupAddress || !customerName || !customerPhone) {
      setError("입력하지 않은 필수 항목이 있어요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("plantType", plantType);
      formData.append("quantity", quantity);
      formData.append("plantSize", plantSize);
      formData.append("pickupAddress", pickupAddress);
      formData.append("pickupAddressDetail", pickupAddressDetail);
      formData.append("desiredPickupDate", desiredPickupDate);
      formData.append("customerName", customerName);
      formData.append("customerPhone", customerPhone);
      formData.append("requestNote", requestNote);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/plant-collection", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "신청 처리 중 문제가 발생했어요.");
      }
      const data = await res.json();
      setRequestNo(data.requestNo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청 처리 중 문제가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (requestNo) {
    return (
      <div className="flex min-h-dvh flex-col">
        <BackHeader />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F2EC] text-2xl">
            ✓
          </div>
          <h1 className="mt-5 text-[20px] font-bold leading-snug">
            개업화분 회수 신청이
            <br />
            완료되었습니다.
          </h1>
          <p className="mt-2 text-[13.5px] text-muted">신청번호 {requestNo}</p>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-light">
            화분의 상태·종류·수량·수거지역에 따라 무료회수, 페이백 또는 회수 불가로 안내될 수
            있습니다. 최종 조건은 사진 및 현장 확인 후 확정됩니다.
          </p>
          <Link
            href="/"
            className="hover-lift mt-8 flex h-13 w-full items-center justify-center rounded-xl border border-border text-[15px] font-semibold text-foreground"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => setAddressScriptLoaded(true)}
      />
      <BackHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-8">
        <p className="text-[13px] font-semibold" style={{ color: "#0B6B4F" }}>
          개업화분 회수
        </p>
        <h1 className="mt-2 text-[22px] font-extrabold leading-snug text-foreground">
          남은 화분, 저희가
          <br />
          회수해드릴게요.
        </h1>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {/* 화분 종류 */}
          <div>
            <label className="mb-2 block text-[13.5px] font-medium">화분 종류</label>
            <div className="grid grid-cols-2 gap-2.5">
              {PLANT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPlantType(type)}
                  className={`rounded-xl border px-3.5 py-3 text-left text-[13.5px] font-medium transition ${
                    plantType === type
                      ? "border-[#0B6B4F] bg-[#E6F2EC] text-[#0B6B4F]"
                      : "border-border bg-white text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 수량 */}
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">수량</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
            />
          </div>

          {/* 화분 크기 */}
          <div>
            <label className="mb-2 block text-[13.5px] font-medium">화분 크기</label>
            <div className="grid grid-cols-3 gap-2.5">
              {PLANT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPlantSize(size)}
                  className={`rounded-xl border px-3 py-3 text-[13.5px] font-medium transition ${
                    plantSize === size
                      ? "border-[#0B6B4F] bg-[#E6F2EC] text-[#0B6B4F]"
                      : "border-border bg-white text-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 사진 업로드 */}
          <div>
            <label className="mb-2 block text-[13.5px] font-medium">사진 업로드</label>
            <div className="grid grid-cols-3 gap-2.5">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={src} alt={`업로드 사진 ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                    aria-label="사진 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface text-[12px] text-muted">
                  <span className="text-xl">+</span>
                  사진 추가
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 수거 주소 */}
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">수거 주소</label>
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="주소를 입력해주세요"
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
            <button
              type="button"
              onClick={openAddressSearch}
              className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium underline"
              style={{ color: "#0B6B4F" }}
            >
              📍 주소 검색해서 바로 등록하기
            </button>
            <input
              type="text"
              value={pickupAddressDetail}
              onChange={(e) => setPickupAddressDetail(e.target.value)}
              placeholder="상세주소 (선택)"
              className="mt-2 h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
          </div>

          {/* 희망 수거일 */}
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">희망 수거일</label>
            <input
              type="date"
              value={desiredPickupDate}
              onChange={(e) => setDesiredPickupDate(e.target.value)}
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
            />
          </div>

          {/* 이름/연락처 */}
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">이름</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="이름을 입력해주세요"
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">연락처</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
            />
          </div>

          {/* 요청사항 */}
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium">요청사항 (선택)</label>
            <textarea
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              rows={3}
              placeholder="전달하실 내용이 있으면 입력해주세요"
              className="w-full resize-none rounded-lg border border-border px-4 py-3 text-[15px] placeholder:text-muted-light"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="hover-lift flex h-14 w-full items-center justify-center rounded-xl text-[16px] font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#0B6B4F" }}
          >
            {submitting ? "신청 중..." : "화분 회수 신청하기"}
          </button>

          <p className="text-[12px] leading-relaxed text-muted-light">
            화분의 상태·종류·수량·수거지역에 따라 무료회수, 페이백 또는 회수 불가로 안내될 수
            있습니다. 최종 조건은 사진 및 현장 확인 후 확정됩니다.
          </p>
        </div>
      </main>

      {showAddressSearch && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddressSearch(false)} />
          <div className="relative flex w-full max-w-lg flex-col rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="text-[15px] font-semibold">주소 검색</p>
              <button
                type="button"
                onClick={() => setShowAddressSearch(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div ref={addressContainerRef} className="h-[420px] w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
