"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import StepProgress from "./StepProgress";
import { formatKRW } from "@/lib/pricing";
import OptionCard from "./OptionCard";
import {
  EVENT_TYPE_LABEL,
  QUANTITY_RANGE_LABEL,
  PICKUP_TIME_SLOTS,
  type EventType,
  type QuantityRange,
  type PickupTimeSlot,
} from "@/lib/types";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; address: string; jibunAddress: string }) => void;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

const MAX_IMAGES = 5;

interface PreviewEstimate {
  status: "ok" | "review";
  confidence: "high" | "medium" | "low";
  lowPayback: number;
  highPayback: number;
  visibleCount: number;
  isCropped: boolean;
  perWreathLow: number;
  perWreathHigh: number;
  notes: string;
}

function rangeFromCount(n: number): QuantityRange {
  if (n >= 50) return "50+";
  if (n >= 30) return "30-49";
  if (n >= 10) return "10-29";
  if (n >= 5) return "5-9";
  return "1-4";
}

// 서울 대략 범위(안내 문구용)
function isInSeoul(lat: number, lng: number) {
  return lat > 37.41 && lat < 37.72 && lng > 126.76 && lng < 127.19;
}

/** 휴대폰 사진(수 MB)을 긴 변 1600px · JPEG로 줄여서 업로드/AI 분석을 빠르고 가볍게 만든다. 실패하면 원본 그대로 사용. */
async function compressImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.size < 400 * 1024) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function toYmd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toYmd(d);
}
const DATE_SHORTCUTS = [
  { label: "오늘", offset: 0 },
  { label: "내일", offset: 1 },
  { label: "모레", offset: 2 },
];

// 데이터를 입력받는 단계 목록
type DataStepName =
  | "photo"
  | "eventType"
  | "quantity"
  | "place"
  | "contact";
type StepName = DataStepName | "estimate";

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
    base.push("quantity", "place", "contact");
    return base;
  }, [initialEventType]);

  // 사진 다음에 "AI 예상 금액" 화면을 끼워넣음(진행률에는 포함하지 않음)
  const steps: StepName[] = useMemo(() => {
    const list: StepName[] = [...dataSteps];
    list.splice(list.indexOf("photo") + 1, 0, "estimate");
    return list;
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
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressScriptLoaded, setAddressScriptLoaded] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [pickupDate, setPickupDate] = useState(() => daysFromNow(1));
  const [pickupTimeSlot, setPickupTimeSlot] = useState<PickupTimeSlot | null>("시간 협의");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [agreements, setAgreements] = useState({
    disposalAuthority: false,
    siteRestriction: false,
    finalPriceVariation: false,
    privacy: false,
  });

  // AI 예상 금액(범위) 미리보기: 사진 다음 단계에서 호출
  const [aiState, setAiState] = useState<"idle" | "loading" | "done">("idle");
  const [aiEstimate, setAiEstimate] = useState<PreviewEstimate | null>(null);
  const aiSignatureRef = useRef("");
  // 화환 수량: AI가 센 값을 쓰되, 사진이 잘렸거나 다르면 고객이 직접 입력
  const [countOverride, setCountOverride] = useState<number | null>(null);
  // 위치 기반 입력
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateMsg, setLocateMsg] = useState<string | null>(null);
  // 기사님 배정 방식: 빠른 배정(담당자가 가장 빠른 일정 안내) / 날짜 직접 선택
  const [dispatchMode, setDispatchMode] = useState<"fast" | "date">("fast");

  const aiOk = aiState === "done" && aiEstimate?.status === "ok";
  const aiFinalCount: number | null = !aiOk
    ? null
    : countOverride ?? (aiEstimate && !aiEstimate.isCropped && aiEstimate.visibleCount > 0 ? aiEstimate.visibleCount : null);
  const skipQuantity = aiFinalCount !== null;
  const effectiveQuantityRange: QuantityRange | null = skipQuantity ? rangeFromCount(aiFinalCount!) : quantityRange;

  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);

  // 사진 다음 "estimate" 단계: AI가 예상 금액을 계산. 쓸 수 없는 상태(키 미설정·실패)면 조용히 다음 단계로 넘어감
  useEffect(() => {
    if (currentStep !== "estimate") return;
    const signature = images.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|");
    if (aiSignatureRef.current === signature && aiState !== "idle") return;
    aiSignatureRef.current = signature;

    let cancelled = false;
    setAiState("loading");
    setAiEstimate(null);

    const body = new FormData();
    images.slice(0, 3).forEach((img) => body.append("images", img));
    if (eventType) body.append("eventType", eventType);

    fetch("/api/estimate/preview", { method: "POST", body })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.available && json.estimate) {
          setAiEstimate(json.estimate as PreviewEstimate);
          setAiState("done");
        } else {
          setAiState("idle");
          setStepIndex((i) => Math.min(steps.length - 1, i + 1));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAiState("idle");
        setStepIndex((i) => Math.min(steps.length - 1, i + 1));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // 주소검색 레이어가 열리고 스크립트도 준비되면, 다음(Daum) 우편번호 검색 위젯을 그 자리에 그려줌
  useEffect(() => {
    if (!showAddressSearch || !addressScriptLoaded || !addressContainerRef.current) return;
    addressContainerRef.current.innerHTML = "";
    new window.daum.Postcode({
      oncomplete: (data) => {
        setAddress(data.roadAddress || data.address);
        setCoords(null);
        setLocateMsg(null);
        setShowAddressSearch(false);
      },
    }).embed(addressContainerRef.current);
  }, [showAddressSearch, addressScriptLoaded]);

  function goNext() {
    setError(null);
    setStepIndex((i) => {
      let t = Math.min(steps.length - 1, i + 1);
      if (steps[t] === "quantity" && skipQuantity) t = Math.min(steps.length - 1, t + 1);
      return t;
    });
  }
  function goBack() {
    setError(null);
    setStepIndex((i) => {
      let target = Math.max(0, i - 1);
      if (steps[target] === "quantity" && skipQuantity) target = Math.max(0, target - 1);
      // AI 결과가 없는(건너뛴) estimate 단계는 뒤로 갈 때도 건너뜀
      if (steps[target] === "estimate" && aiState !== "done") target = Math.max(0, target - 1);
      return target;
    });
  }

  // 진행률 표시용 단계 번호
  const dataStepNumber = dataSteps.indexOf(currentStep as DataStepName) + 1;

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files);
    const compressed = await Promise.all(picked.map(compressImage));
    setImages((prev) => [...prev, ...compressed].slice(0, MAX_IMAGES));
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  const isSmallOrder = effectiveQuantityRange === "1-4" || effectiveQuantityRange === "5-9";
  const allAgreed = Object.values(agreements).every(Boolean);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocateMsg("이 기기에서는 위치를 가져올 수 없어요. 주소를 직접 입력하거나 검색해 주세요.");
      return;
    }
    setLocating(true);
    setLocateMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const r = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
          const json = await r.json();
          if (json?.address) {
            setAddress(json.address);
            setLocateMsg(
              isInSeoul(lat, lng)
                ? "현재 위치로 주소를 채웠어요. 틀리면 직접 고쳐주세요."
                : "현재 위치로 주소를 채웠어요. 서울 외 지역은 담당자가 일정을 확인해 안내해 드려요."
            );
          } else {
            setLocateMsg("위치는 확인했지만 주소를 찾지 못했어요. 주소를 직접 입력해 주세요.");
          }
        } catch {
          setLocateMsg("위치는 확인했지만 주소를 찾지 못했어요. 주소를 직접 입력해 주세요.");
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocateMsg("위치 권한이 없어 가져오지 못했어요. 주소를 직접 입력하거나 검색해 주세요.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function handleSubmit() {
    const finalSlot = dispatchMode === "fast" ? "시간 협의" : pickupTimeSlot;
    const finalDate = dispatchMode === "fast" ? daysFromNow(1) : pickupDate;
    if (!eventType || !effectiveQuantityRange || !finalSlot) {
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
      formData.append("quantityRange", effectiveQuantityRange);
      if (countOverride !== null) formData.append("customerCount", String(countOverride));
      if (coords) {
        formData.append("addressLat", String(coords.lat));
        formData.append("addressLng", String(coords.lng));
      }
      formData.append("dispatchMode", dispatchMode);
      formData.append("placeName", placeName);
      formData.append("address", address);
      formData.append("addressDetail", addressDetail);
      formData.append("pickupDate", finalDate);
      formData.append("pickupTimeSlot", finalSlot);
      formData.append("customerName", customerName);
      formData.append("customerPhone", customerPhone);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/estimate", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "신청 처리 중 문제가 발생했어요.");
      }
      const data = await res.json();
      try {
        sessionStorage.setItem(`kkotpay:phone:${data.requestNo}`, customerPhone);
      } catch {}
      router.push(`/estimate/complete?req=${data.requestNo}`);
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
      {currentStep !== "estimate" && <StepProgress current={dataStepNumber} total={dataSteps.length} />}

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

      {currentStep === "estimate" && (
        <>
          {aiState !== "done" && <AnalyzingScreen previewSrc={previews[0]} />}
          {aiState === "done" && aiEstimate && (
            <EstimateResult
              estimate={aiEstimate}
              previewSrc={previews[0]}
              count={countOverride}
              onCount={setCountOverride}
              onBack={goBack}
              onNext={goNext}
            />
          )}
        </>
      )}

      {currentStep === "eventType" && (
        <StepBlock title="어떤 행사의 화환인가요?" onBack={goBack}>
          <div className="space-y-2.5">
            {(Object.entries(EVENT_TYPE_LABEL) as [EventType, string][]).map(([key, label]) => (
              <OptionCard
                key={key}
                label={label}
                selected={eventType === key}
                onClick={() => {
                  setEventType(key);
                  setTimeout(goNext, 180);
                }}
              />
            ))}
          </div>
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
                  onClick={() => {
                    setQuantityRange(key);
                    setTimeout(goNext, 180);
                  }}
                />
              )
            )}
          </div>
        </StepBlock>
      )}

      {currentStep === "place" && (
        <StepBlock title="어디로 언제 갈까요?" onBack={goBack}>
          <div className="space-y-3">
            <Field label="장소명" placeholder="예) 서울아산병원 장례식장" value={placeName} onChange={setPlaceName} />

            <div>
              <Field
                label="주소"
                placeholder="주소를 입력해주세요"
                value={address}
                onChange={(v) => {
                  setAddress(v);
                  setCoords(null);
                }}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="hover-lift flex h-11 items-center justify-center rounded-lg border border-brand bg-brand-tint text-[13px] font-semibold text-brand-dark disabled:opacity-50"
                >
                  {locating ? "위치 확인 중..." : "📍 현재 위치로 입력"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressSearch(true)}
                  className="hover-lift flex h-11 items-center justify-center rounded-lg border border-border text-[13px] font-medium"
                >
                  🔍 주소 검색
                </button>
              </div>
              {locateMsg && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{locateMsg}</p>}
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

            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">기사님 배정 신청</label>
              <div className="grid grid-cols-2 gap-2">
                <OptionCard label="빠른 배정" compact selected={dispatchMode === "fast"} onClick={() => setDispatchMode("fast")} />
                <OptionCard label="날짜 선택" compact selected={dispatchMode === "date"} onClick={() => setDispatchMode("date")} />
              </div>
              {dispatchMode === "fast" && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                  가장 빠른 일정으로 배정을 요청해요. 담당자가 확인 후 수거 날짜를 안내해 드립니다.
                </p>
              )}
            </div>

            {dispatchMode === "date" && (
            <>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">수거 희망일</label>
              <div className="grid grid-cols-3 gap-2">
                {DATE_SHORTCUTS.map((d) => {
                  const value = daysFromNow(d.offset);
                  return (
                    <OptionCard
                      key={d.label}
                      label={d.label}
                      compact
                      selected={pickupDate === value}
                      onClick={() => setPickupDate(value)}
                    />
                  );
                })}
              </div>
              <input
                type="date"
                value={pickupDate}
                min={daysFromNow(0)}
                onChange={(e) => setPickupDate(e.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-border px-4 text-[15px]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium">시간대</label>
              <div className="grid grid-cols-4 gap-2">
                {PICKUP_TIME_SLOTS.map((slot) => (
                  <OptionCard
                    key={slot}
                    label={slot}
                    compact
                    selected={pickupTimeSlot === slot}
                    onClick={() => setPickupTimeSlot(slot)}
                  />
                ))}
              </div>
            </div>
            </>
            )}
          </div>
          <NextButton
            disabled={!placeName || !address || (dispatchMode === "date" && (!pickupDate || !pickupTimeSlot))}
            onClick={goNext}
          />
        </StepBlock>
      )}

      {currentStep === "contact" && (
        <StepBlock title="마지막이에요. 연락처만 남겨주세요" onBack={goBack}>
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

          {isSmallOrder && (
            <div className="mt-6 rounded-xl border border-brand bg-brand-tint px-4 py-4">
              <p className="text-[13.5px] font-bold">소량도 페이백 받을 수 있어요</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                1~9개 소량은 권역별 기사님이 돌면서 실어갑니다. 방문 시간대는 신청하신 일정에 맞춰 안내해 드려요.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <label className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3.5">
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={(e) =>
                  setAgreements({
                    disposalAuthority: e.target.checked,
                    siteRestriction: e.target.checked,
                    finalPriceVariation: e.target.checked,
                    privacy: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-[color:var(--brand)]"
              />
              <span className="text-[14px] font-semibold">약관 모두 동의</span>
            </label>
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
            disabled={!customerName || !customerPhone || !allAgreed || submitting}
            onClick={handleSubmit}
            className="hover-lift mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-brand text-[16px] font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "신청 중..." : "예상 페이백 요청하기"}
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

/** AI가 실제로 사진을 분석하는 동안 보여주는 화면 */
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
      <h1 className="mt-6 text-[19px] font-bold leading-snug">AI가 사진을 분석하고 있어요</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        화환 수량과 상태를 확인해서
        <br />
        예상 페이백 금액을 계산하고 있어요. (10~20초)
      </p>
      <div className="mt-6 flex items-center gap-1.5">
        <span className="dot-fade h-1.5 w-1.5 rounded-full bg-brand" style={{ animationDelay: "0ms" }} />
        <span className="dot-fade h-1.5 w-1.5 rounded-full bg-brand" style={{ animationDelay: "200ms" }} />
        <span className="dot-fade h-1.5 w-1.5 rounded-full bg-brand" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}

/** AI 예상 금액 결과: 확정 금액이 아니라 범위로 안내. 사진이 잘렸으면 수량을 직접 입력받아 금액을 다시 계산 */
function EstimateResult({
  estimate,
  previewSrc,
  count,
  onCount,
  onBack,
  onNext,
}: {
  estimate: PreviewEstimate;
  previewSrc?: string;
  count: number | null;
  onCount: (n: number | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const ok = estimate.status === "ok";
  const needsInput = ok && (estimate.isCropped || estimate.visibleCount <= 0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(count ? String(count) : "");
  const showInput = needsInput ? count === null || editing : editing;

  const effectiveCount = count ?? (needsInput ? null : estimate.visibleCount);
  const low = count !== null ? estimate.perWreathLow * count : estimate.lowPayback;
  const high = count !== null ? estimate.perWreathHigh * count : estimate.highPayback;
  const showRange = ok && (!needsInput || count !== null);
  const canNext = !ok || effectiveCount !== null;

  function applyDraft() {
    const n = Math.round(Number(draft));
    if (!Number.isFinite(n) || n < 1 || n > 500) return;
    onCount(n);
    setEditing(false);
  }

  return (
    <StepBlock title={ok ? "화환 수량과 페이백을 계산했어요" : "담당자가 확인 후 알려드려요"} onBack={onBack}>
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        {previewSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="업로드한 화환 사진" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0">
          {ok ? (
            showRange ? (
              <>
                <p className="text-[12px] text-muted">
                  {effectiveCount !== null ? `화환 ${count !== null ? "" : "약 "}${effectiveCount}개 · 예상 페이백` : "예상 페이백"}
                </p>
                <p className="text-[22px] font-extrabold leading-tight tabular-nums">
                  {formatKRW(low)} ~ {formatKRW(high)}
                </p>
              </>
            ) : (
              <p className="text-[13.5px] leading-relaxed">
                사진 가장자리에서 화환이 잘린 것 같아요. 전체 수량을 직접 입력해 주세요.
              </p>
            )
          ) : (
            <p className="text-[13.5px] leading-relaxed text-muted">
              사진만으로는 정확한 산정이 어려워요. 아래 정보를 입력해 주시면 담당자가 확인하고 금액을 안내해 드릴게요.
            </p>
          )}
        </div>
      </div>

      {ok && showInput && (
        <div className="mt-4 rounded-xl border border-border p-4">
          <label className="block text-[13.5px] font-medium">전체 화환 수량</label>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="예) 12"
              className="h-12 min-w-0 flex-1 rounded-lg border border-border px-4 text-[15px]"
            />
            <button
              type="button"
              onClick={applyDraft}
              disabled={!draft}
              className="hover-lift h-12 shrink-0 rounded-lg bg-brand px-5 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              적용
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-muted">입력하신 수량에 맞춰 예상 페이백을 다시 계산해요.</p>
        </div>
      )}

      {ok && (
        <ul className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-muted">
          {estimate.notes && <li>· AI 판독: {estimate.notes}</li>}
          {!needsInput && count === null && estimate.visibleCount > 0 && (
            <li>
              · 사진에서 확인된 화환 약 {estimate.visibleCount}개{" "}
              {!editing && (
                <button type="button" onClick={() => setEditing(true)} className="font-medium text-brand-dark underline">
                  수량이 달라요
                </button>
              )}
            </li>
          )}
          {count !== null && !editing && (
            <li>
              · 직접 입력한 수량 {count}개 기준이에요.{" "}
              <button type="button" onClick={() => { setDraft(String(count)); setEditing(true); }} className="font-medium text-brand-dark underline">
                수정
              </button>
            </li>
          )}
          <li>· 페이백 비율은 자동 반영됐어요. 사진 기준 예상 금액이며 현장 수량·상태 확인 후 최종 금액이 확정됩니다.</li>
        </ul>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="hover-lift mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-brand text-[16px] font-semibold text-white disabled:opacity-40"
      >
        {ok ? "이 금액으로 계속하기" : "계속하기"}
      </button>
    </StepBlock>
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
