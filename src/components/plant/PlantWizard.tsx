"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

const MAX_IMAGES = 5;
const ANALYZING_DURATION_MS = 1800;
const PLANT_TYPES = ["관엽식물", "난·호접란", "대형 화분", "기타"];
const PLANT_SIZES = ["소형", "중형", "대형"];
const PICKUP_TIME_SLOTS = ["오전", "오후", "저녁", "시간 협의"];
const ACCENT = "#8B5A2B";
const ACCENT_BG = "#F3E8DD";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; address: string; jibunAddress: string }) => void;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

type StepName =
  | "photo"
  | "analyzing"
  | "plantType"
  | "sizeQty"
  | "address"
  | "date"
  | "contact"
  | "agreement";

const STEPS: StepName[] = [
  "photo",
  "analyzing",
  "plantType",
  "sizeQty",
  "address",
  "date",
  "contact",
  "agreement",
];
const DATA_STEPS = STEPS.filter((s) => s !== "analyzing");

export default function PlantWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = STEPS[stepIndex];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [plantType, setPlantType] = useState<string | null>(null);
  const [plantSize, setPlantSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupAddressDetail, setPickupAddressDetail] = useState("");
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressScriptLoaded, setAddressScriptLoaded] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const [desiredPickupDate, setDesiredPickupDate] = useState("");
  const [desiredPickupTimeSlot, setDesiredPickupTimeSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [agreed, setAgreed] = useState(false);

  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  const dataStepNumber = DATA_STEPS.indexOf(currentStep === "analyzing" ? "photo" : currentStep) + 1;

  useEffect(() => {
    if (currentStep !== "analyzing") return;
    const timer = setTimeout(() => {
      setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
    }, ANALYZING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentStep]);

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

  function goNext() {
    setError(null);
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }
  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const wasEmpty = images.length === 0;
    setImages((prev) => [...prev, ...Array.from(files)].slice(0, MAX_IMAGES));
    // 처음 사진을 등록하는 순간이면, "다음" 버튼을 누르지 않아도 바로 분석 화면으로 진행
    if (wasEmpty) {
      goNext();
    }
  }
  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!plantType || !plantSize || !pickupAddress || !customerName || !customerPhone) {
      setError("입력하지 않은 항목이 있어요. 이전 단계를 확인해주세요.");
      return;
    }
    if (!agreed) {
      setError("약관에 동의해주세요.");
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
      formData.append("desiredPickupTimeSlot", desiredPickupTimeSlot ?? "");
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
      router.push(`/plant-collection/complete?req=${data.requestNo}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청 처리 중 문제가 발생했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8 pb-28">
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => setAddressScriptLoaded(true)}
      />

      {currentStep !== "analyzing" && (
        <div className="mb-6 flex items-center gap-1.5">
          {DATA_STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{ backgroundColor: i < dataStepNumber ? ACCENT : "#E3E8E5" }}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
          {error}
        </div>
      )}

      {currentStep === "photo" && (
        <StepBlock title="화분 사진을 올려주세요">
          <p className="mb-1 text-[15px] font-bold leading-snug text-foreground">
            사무실 화분 12개,
            <br />
            관리 담당자는 아직도 공석입니다.
          </p>
          <p className="mb-4 text-[13.5px] text-muted">
            화분 전체와 상태가 보이도록 촬영해주세요. 사진 한 장이면 바로 시작할 수 있어요.
          </p>
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
              <button
                type="button"
                onClick={() => setShowPhotoSheet(true)}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface text-[12px] text-muted"
              >
                <span className="text-xl">+</span>
                사진 추가
              </button>
            )}
          </div>
          <p className="mt-2 text-[12px] text-muted-light">최대 {MAX_IMAGES}장까지 업로드할 수 있어요.</p>
          <NextButton disabled={images.length === 0} onClick={goNext} />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {showPhotoSheet && (
            <PhotoActionSheet
              onSelectGallery={() => {
                setShowPhotoSheet(false);
                galleryInputRef.current?.click();
              }}
              onSelectCamera={() => {
                setShowPhotoSheet(false);
                cameraInputRef.current?.click();
              }}
              onCancel={() => setShowPhotoSheet(false)}
            />
          )}
        </StepBlock>
      )}

      {currentStep === "analyzing" && <AnalyzingScreen previewSrc={previews[0]} />}

      {currentStep === "plantType" && (
        <StepBlock title="화분 종류를 알려주세요" onBack={goBack}>
          <div className="grid grid-cols-2 gap-2.5">
            {PLANT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPlantType(type)}
                className="hover-lift rounded-xl border px-3.5 py-4 text-left text-[14px] font-medium"
                style={
                  plantType === type
                    ? { borderColor: ACCENT, backgroundColor: ACCENT_BG, color: ACCENT }
                    : { borderColor: "#E3E8E5" }
                }
              >
                {type}
              </button>
            ))}
          </div>
          <NextButton disabled={!plantType} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "sizeQty" && (
        <StepBlock title="화분 크기와 수량을 알려주세요" onBack={goBack}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[13.5px] font-medium">화분 크기</label>
              <div className="grid grid-cols-3 gap-2.5">
                {PLANT_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPlantSize(size)}
                    className="hover-lift rounded-xl border px-3 py-3.5 text-center text-[14px] font-medium"
                    style={
                      plantSize === size
                        ? { borderColor: ACCENT, backgroundColor: ACCENT_BG, color: ACCENT }
                        : { borderColor: "#E3E8E5" }
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
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
          </div>
          <NextButton disabled={!plantSize} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "address" && (
        <StepBlock title="수거 주소를 알려주세요" onBack={goBack}>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">주소</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="주소를 입력해주세요"
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
              />
              <button
                type="button"
                onClick={() => setShowAddressSearch(true)}
                className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium underline"
                style={{ color: ACCENT }}
              >
                📍 주소를 모르겠다면 검색해서 바로 등록하기
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">상세주소 (선택)</label>
              <input
                type="text"
                value={pickupAddressDetail}
                onChange={(e) => setPickupAddressDetail(e.target.value)}
                placeholder="예) 1층 로비"
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
              />
            </div>
          </div>
          <NextButton disabled={!pickupAddress} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "date" && (
        <StepBlock title="희망 수거일을 선택해주세요" onBack={goBack}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">날짜</label>
              <input
                type="date"
                value={desiredPickupDate}
                onChange={(e) => setDesiredPickupDate(e.target.value)}
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
              />
            </div>
            <div>
              <label className="mb-2 block text-[13.5px] font-medium">시간대설정</label>
              <div className="grid grid-cols-2 gap-2.5">
                {PICKUP_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setDesiredPickupTimeSlot(slot)}
                    className="hover-lift rounded-xl border px-3.5 py-3.5 text-center text-[14px] font-medium"
                    style={
                      desiredPickupTimeSlot === slot
                        ? { borderColor: ACCENT, backgroundColor: ACCENT_BG, color: ACCENT }
                        : { borderColor: "#E3E8E5" }
                    }
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <NextButton disabled={!desiredPickupDate || !desiredPickupTimeSlot} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "contact" && (
        <StepBlock title="연락처를 남겨주세요" onBack={goBack}>
          <div className="space-y-3">
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
              <label className="mb-1.5 block text-[13.5px] font-medium">휴대폰번호</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
              />
            </div>
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
          </div>
          <NextButton disabled={!customerName || !customerPhone} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "agreement" && (
        <StepBlock title="약관에 동의해주세요" onBack={goBack}>
          <label className="flex items-start gap-3 rounded-lg border border-border px-4 py-3.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4"
              style={{ accentColor: ACCENT }}
            />
            <span className="text-[13.5px] leading-relaxed">
              화분의 상태·종류·수량·수거지역에 따라 무료회수, 페이백 또는 회수 불가로 안내될 수
              있으며, 최종 조건은 사진 및 현장 확인 후 확정됨에 동의합니다.
            </span>
          </label>
          <button
            type="button"
            disabled={!agreed || submitting}
            onClick={handleSubmit}
            className="hover-lift mt-8 flex h-14 w-full items-center justify-center rounded-xl text-[16px] font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
          >
            {submitting ? "신청 중..." : "화분 회수 신청하기"}
          </button>
        </StepBlock>
      )}

      {showAddressSearch && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddressSearch(false)} />
          <div className="fade-up relative flex w-full max-w-lg flex-col rounded-t-2xl bg-white">
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

function AnalyzingScreen({ previewSrc }: { previewSrc?: string }) {
  return (
    <div className="fade-up flex flex-col items-center py-10 text-center">
      <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-border">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="업로드한 화분 사진" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-surface" />
        )}
        <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: `${ACCENT}1A` }} />
      </div>
      <h1 className="mt-6 text-[19px] font-bold leading-snug">사진을 분석하고 있어요</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        화분 종류와 상태를 확인해서
        <br />
        회수 가능 여부를 확인할게요.
      </p>
      <div className="mt-6 flex items-center gap-1.5">
        <span
          className="h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]"
          style={{ backgroundColor: ACCENT }}
        />
        <span
          className="h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]"
          style={{ backgroundColor: ACCENT }}
        />
        <span className="h-2 w-2 animate-bounce rounded-full" style={{ backgroundColor: ACCENT }} />
      </div>
    </div>
  );
}

function StepBlock({
  title,
  children,
  onBack,
}: {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="fade-up">
      <div className="mb-5 flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted"
            aria-label="이전 단계"
          >
            ←
          </button>
        )}
        <h1 className="text-[20px] font-bold leading-snug">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function NextButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="hover-lift mt-8 flex h-14 w-full items-center justify-center rounded-xl text-[16px] font-semibold text-white disabled:opacity-40"
      style={{ backgroundColor: ACCENT }}
    >
      다음
    </button>
  );
}

function PhotoActionSheet({
  onSelectGallery,
  onSelectCamera,
  onCancel,
}: {
  onSelectGallery: () => void;
  onSelectCamera: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="fade-up relative w-full max-w-lg rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <p className="mb-4 text-center text-[14px] font-semibold text-muted">사진 추가 방법을 선택해주세요</p>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onSelectCamera}
            className="hover-lift flex h-14 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            사진 촬영
          </button>
          <button
            type="button"
            onClick={onSelectGallery}
            className="hover-lift flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-border text-[15px] font-semibold text-foreground"
          >
            갤러리에서 선택
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-12 w-full items-center justify-center text-[14px] font-medium text-muted-light"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
