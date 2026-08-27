"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface QuantityPolicyItem {
  label: string;
  priority: "normal" | "high" | "bulk";
}

export default function SettingsForm({
  initialPrices,
  initialPolicy,
}: {
  initialPrices: Record<string, number>;
  initialPolicy: Record<string, QuantityPolicyItem>;
}) {
  const router = useRouter();
  const [prices, setPrices] = useState(initialPrices);
  const [policy, setPolicy] = useState(initialPolicy);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradePrices: prices, quantityPolicy: policy }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      router.refresh();
    } catch {
      alert("저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  const gradeLabels: Record<string, string> = {
    premium: "Premium",
    a: "A급",
    b: "B급",
    c: "C급",
  };

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-[15px] font-bold">등급별 예상 판매단가</h2>
        <p className="mt-1 text-[13px] text-muted">
          변경 시 이후 신규 계산부터 적용되며 기존 이력은 보존됩니다.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(prices).map(([code, price]) => (
            <div key={code}>
              <label className="mb-1 block text-[12.5px] text-muted">{gradeLabels[code] ?? code}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={price}
                  onChange={(e) =>
                    setPrices((prev) => ({ ...prev, [code]: Number(e.target.value) }))
                  }
                  className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
                />
                <span className="text-[13px] text-muted">원</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-[15px] font-bold">수량별 수거 정책</h2>
        <div className="mt-4 space-y-3">
          {Object.entries(policy).map(([range, item]) => (
            <div key={range} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[13.5px] font-medium">{range}</span>
              <input
                type="text"
                value={item.label}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, [range]: { ...prev[range], label: e.target.value } }))
                }
                className="h-10 flex-1 rounded-lg border border-border px-3 text-[13.5px]"
              />
              <select
                value={item.priority}
                onChange={(e) =>
                  setPolicy((prev) => ({
                    ...prev,
                    [range]: { ...prev[range], priority: e.target.value as QuantityPolicyItem["priority"] },
                  }))
                }
                className="h-10 rounded-lg border border-border px-2 text-[13px]"
              >
                <option value="normal">일반</option>
                <option value="high">우선</option>
                <option value="bulk">대량</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex h-12 w-52 items-center justify-center rounded-xl bg-brand text-[14.5px] font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : saved ? "저장됨 ✓" : "설정 저장"}
      </button>
    </div>
  );
}
