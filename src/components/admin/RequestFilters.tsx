"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EVENT_TYPE_LABEL, STATUS_LABEL } from "@/lib/types";

export default function RequestFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/requests?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      <input
        type="date"
        defaultValue={searchParams.get("date") ?? ""}
        onChange={(e) => updateParam("date", e.target.value)}
        className="h-10 rounded-lg border border-border px-3 text-[13.5px]"
      />
      <input
        type="text"
        placeholder="지역 검색 (예: 서울)"
        defaultValue={searchParams.get("region") ?? ""}
        onBlur={(e) => updateParam("region", e.target.value)}
        className="h-10 w-40 rounded-lg border border-border px-3 text-[13.5px]"
      />
      <select
        defaultValue={searchParams.get("eventType") ?? ""}
        onChange={(e) => updateParam("eventType", e.target.value)}
        className="h-10 rounded-lg border border-border px-3 text-[13.5px]"
      >
        <option value="">행사종류 전체</option>
        {Object.entries(EVENT_TYPE_LABEL).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-10 rounded-lg border border-border px-3 text-[13.5px]"
      >
        <option value="">상태 전체</option>
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {(searchParams.get("date") ||
        searchParams.get("region") ||
        searchParams.get("eventType") ||
        searchParams.get("status")) && (
        <button
          type="button"
          onClick={() => router.push("/admin/requests")}
          className="h-10 rounded-lg px-3 text-[13.5px] text-muted underline"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}
