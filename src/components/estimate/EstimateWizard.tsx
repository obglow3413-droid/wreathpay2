"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StepProgress from "./StepProgress";
import OptionCard from "./OptionCard";
import {
  EVENT_TYPE_LABEL,
  QUANTITY_RANGE_LABEL,
  PICKUP_TIME_SLOTS,
  type EventType,
  type QuantityRange,
  type PickupTimeSlot,
} from "@/lib/types";

const MAX_IMAGES = 5;
const ANALYZING_DURATION_MS = 1800;

// 데이터를 입력받는 실제 단계 목록. "analyzing"은 진행률에는 포함하지 않는 연출용 단계.
type DataStepName =
  | "photo"
  | "eventType"
  | "quantity"
  | "place"
  | "time"
  | "contact"
  | "agreement";
type StepName = DataStepName | "analyzing";

export default function EstimateWizard({
  initialBulk = false,
  initialEventType = null,
}: {
  initialBulk?: boolean;
  initialEventType?: EventType | null;
}) {
  const router = useRouter();

  // 화환 종류가 광고 랜딩 등에서 이미 정해져 들어온 경우, 그 선택 단계는 건너뜀
  const dataSteps: DataStepName[] = useMemo(() => {
    const base: DataStepName[] = ["photo"];
    if (!initialEventType) base.push("eventType");
    base.push("quantity", "place", "time", "contact", "agreement");
    return base;
  }, [initialEventType]);

  // 실제 화면에 표시되는 순서: 사진 다음에 "분석 중" 연출을 끼워넣음
  const steps: StepName[] = useMemo(() => {
    const withAnalyzing: StepName[] = [...dataSteps];
    const photoIdx = withAnalyzing.indexOf("photo");
    withAnalyzing.splice(photoIdx + 1, 0, "analyzing");
    return withAnalyzing;
  }, [dataSteps]);

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventType, setEventType] = useState<EventType | null>(initialEventType);
  const [quantityRange, setQuantityRange] = useState<QuantityRange | null>(
    initialBulk ? "30-49" : null
  );
  const [images, setImages] = useState<File[]>([]);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTimeSlot, setPickupTimeSlot] = useState<PickupTimeSlot | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [agreements, setAgreements] = useState({
    disposalAuthority: false,
    siteRestriction: false,
    finalPriceVariation: false,
    privacy: false,
  });

  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);

  // "분석 중" 화면은 잠깐 보여준 뒤 자동으로 다음 단계로 넘어감
  useEffect(() => {
    if (currentStep !== "analyzing") return;
    const timer = setTimeout(() => {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
    }, ANALYZING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  function goNext() {
    setError(null);
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }
  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  // 진행률 표시용: "analyzing"을 제외한 실제 데이터 단계 기준 번호
  const dataStepNumber = dataSteps.indexOf(currentStep as DataStepName) + 1;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = [...images, ...Array.from(files)].slice(0, MAX_IMAGES);
    setImages(next);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  const allAgreed = Object.values(agreements).every(Boolean);

  async function handleSubmit() {
    if (!eventType || !quantityRange || !pickupTimeSlot) {
      setError("입력하지 않은 항목이 있어요. 이전 단계를 확인해주세요.");
      return;
    }
    if (!allAgreed) {
      setError("모든 약관에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("eventType", eventType);
      formData.append("quantityRange", quantityRange);
      formData.append("placeName", placeName);
      formData.append("address", address);
      formData.append("addressDetail", addressDetail);
      formData.append("pickupDate", pickupDate);
      formData.append("pickupTimeSlot", pickupTimeSlot);
      formData.append("customerName", customerName);
      formData.append("customerPhone", customerPhone);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/estimate", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "신청 처리 중 문제가 발생했어요.");
      }
      const data = await res.json();
      router.push(`/estimate/complete?req=${data.requestNo}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청 처리 중 문제가 발생했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8 pb-28">
      {currentStep !== "analyzing" && (
        <StepProgress current={dataStepNumber} total={dataSteps.length} />
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
          {error}
        </div>
      )}

      {currentStep === "photo" && (
        <StepBlock title="현장사진을 업로드해주세요">
          <p className="mb-4 text-[13.5px] text-muted">
            화환 전체 수량과 상태가 보이도록 촬영해주세요. 사진 한 장이면 바로 시작할 수 있어요.
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

          {/* 숨겨진 파일 입력 2종: 갤러리 선택용 / 카메라 촬영용 */}
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

      {currentStep === "eventType" && (
        <StepBlock title="어떤 행사의 화환인가요?" onBack={goBack}>
          <div className="space-y-2.5">
            {(Object.entries(EVENT_TYPE_LABEL) as [EventType, string][]).map(([key, label]) => (
              <OptionCard
                key={key}
                label={label}
                selected={eventType === key}
                onClick={() => setEventType(key)}
              />
            ))}
          </div>
          <NextButton disabled={!eventType} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "quantity" && (
        <StepBlock title="화환은 몇 개 정도인가요?" onBack={goBack}>
          <div className="space-y-2.5">
            {(Object.entries(QUANTITY_RANGE_LABEL) as [QuantityRange, string][]).map(
              ([key, label]) => (
                <OptionCard
                  key={key}
                  label={label}
                  selected={quantityRange === key}
                  onClick={() => setQuantityRange(key)}
                />
              )
            )}
          </div>
          <NextButton disabled={!quantityRange} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "place" && (
        <StepBlock title="수거 장소를 알려주세요" onBack={goBack}>
          <div className="space-y-3">
            <Field label="장소명" placeholder="예) 서울아산병원 장례식장" value={placeName} onChange={setPlaceName} />

            <div>
              <Field label="주소" placeholder="주소를 입력해주세요" value={address} onChange={setAddress} />
              <a
                href={`https://map.kakao.com/?q=${encodeURIComponent(placeName || address || "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-dark underline"
              >
                📍 주소를 모르겠다면 지도에서 검색하기
              </a>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1.5 block text-[13.5px] font-medium">상세위치</label>
                <button
                  type="button"
                  onClick={() => setAddressDetail("알아서 가져가주세요")}
                  className="mb-1.5 rounded-full border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted"
                >
                  모르겠어요
                </button>
              </div>
              <input
                type="text"
                value={addressDetail}
                placeholder="예) 3층 7호실"
                onChange={(e) => setAddressDetail(e.target.value)}
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
              />
            </div>
          </div>
          <NextButton disabled={!placeName || !address} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "time" && (
        <StepBlock title="수거 희망일시를 선택해주세요" onBack={goBack}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">날짜</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="h-12 w-full rounded-lg border border-border px-4 text-[15px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">시간대</label>
              <div className="grid grid-cols-2 gap-2.5">
                {PICKUP_TIME_SLOTS.map((slot) => (
                  <OptionCard
                    key={slot}
                    label={slot}
                    selected={pickupTimeSlot === slot}
                    onClick={() => setPickupTimeSlot(slot)}
                  />
                ))}
              </div>
            </div>
          </div>
          <NextButton disabled={!pickupDate || !pickupTimeSlot} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "contact" && (
        <StepBlock title="연락처를 남겨주세요" onBack={goBack}>
          <div className="space-y-3">
            <Field label="이름" placeholder="이름을 입력해주세요" value={customerName} onChange={setCustomerName} />
            <Field
              label="휴대폰번호"
              placeholder="010-0000-0000"
              value={customerPhone}
              onChange={setCustomerPhone}
              type="tel"
            />
          </div>
          <NextButton disabled={!customerName || !customerPhone} onClick={goNext} />
        </StepBlock>
      )}

      {currentStep === "agreement" && (
        <StepBlock title="약관에 동의해주세요" onBack={goBack}>
          <div className="space-y-3">
            <AgreementRow
              checked={agreements.disposalAuthority}
              onChange={(v) => setAgreements((p) => ({ ...p, disposalAuthority: v }))}
              label="본인은 해당 화환을 처분 또는 양도할 권한이 있습니다."
            />
            <AgreementRow
              checked={agreements.siteRestriction}
              onChange={(v) => setAgreements((p) => ({ ...p, siteRestriction: v }))}
              label="수거 장소의 내부 반출 규정에 따라 수거가 제한될 수 있음에 동의합니다."
            />
            <AgreementRow
              checked={agreements.finalPriceVariation}
              onChange={(v) => setAgreements((p) => ({ ...p, finalPriceVariation: v }))}
              label="현장 상태와 실제 수량에 따라 최종 매입금액이 달라질 수 있음에 동의합니다."
            />
            <AgreementRow
              checked={agreements.privacy}
              onChange={(v) => setAgreements((p) => ({ ...p, privacy: v }))}
              label="개인정보 수집 및 이용에 동의합니다."
            />
          </div>
          <button
            type="button"
            disabled={!allAgreed || submitting}
            onClick={handleSubmit}
            className="hover-lift mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-brand text-[16px] font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "신청 중..." : "예상 페이백 요청하기"}
          </button>
        </StepBlock>
      )}
    </div>
  );
}

/** 사진 등록 직후 잠깐 보여주는 "분석 중" 연출 화면 */
function AnalyzingScreen({ previewSrc }: { previewSrc?: string }) {
  return (
    <div className="fade-up flex flex-col items-center py-10 text-center">
      <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-border">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="업로드한 화환 사진" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-surface" />
        )}
        <div className="absolute inset-0 animate-pulse bg-brand/10" />
      </div>
      <h1 className="mt-6 text-[19px] font-bold leading-snug">
        사진을 분석하고 있어요
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        화환 종류와 상태를 확인해서
        <br />
        예상 페이백 금액을 계산할게요.
      </p>
      <div className="mt-6 flex items-center gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
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
      className="hover-lift mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-brand text-[16px] font-semibold text-white disabled:opacity-40"
    >
      다음
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13.5px] font-medium">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-lg border border-border px-4 text-[15px] placeholder:text-muted-light"
      />
    </div>
  );
}

/** 사진 추가 시 "갤러리에서 선택" / "사진 촬영" 중 고르는 하단 액션시트 */
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
            className="hover-lift flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white"
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

function AgreementRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border px-4 py-3.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]"
      />
      <span className="text-[13.5px] leading-relaxed">{label}</span>
    </label>
  );
}
