"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

interface Item {
  slug: string;
  kind: "funeral" | "wedding";
  name: string;
  sido: string;
  sigungu: string;
  address: string;
  isPartner: boolean;
}

const KIND_LABEL = { funeral: "장례식장", wedding: "웨딩홀" } as const;
const PAGE = 30;

export default function PlaceBrowser({ places }: { places: Item[] }) {
  const kinds = useMemo(() => [...new Set(places.map((p) => p.kind))], [places]);
  const [kind, setKind] = useState<"all" | "funeral" | "wedding">("all");
  const [sido, setSido] = useState("all");
  const [sigungu, setSigungu] = useState("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const sidos = useMemo(() => [...new Set(places.map((p) => p.sido))], [places]);
  const sigungus = useMemo(
    () => [...new Set(places.filter((p) => sido === "all" || p.sido === sido).map((p) => p.sigungu))].sort((a, b) => a.localeCompare(b, "ko")),
    [places, sido]
  );
  const filtered = useMemo(() => {
    const k = q.trim().replace(/\s+/g, "");
    return places.filter(
      (p) =>
        (kind === "all" || p.kind === kind) &&
        (sido === "all" || p.sido === sido) &&
        (sigungu === "all" || p.sigungu === sigungu) &&
        (!k || (p.name + p.address).replace(/\s+/g, "").includes(k))
    );
  }, [places, kind, sido, sigungu, q]);

  const selectClass = "h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-[14px] outline-none";
  const reset = () => setShown(PAGE);

  return (
    <div className="mt-6">
      {kinds.length > 1 && (
        <div className="mb-3 flex gap-2">
          {(["all", ...kinds] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                reset();
              }}
              className={`h-9 rounded-full border px-4 text-[13px] font-semibold ${kind === k ? "border-forest bg-forest text-ivory" : "border-border bg-white text-muted"}`}
            >
              {k === "all" ? "전체" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-light" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            reset();
          }}
          placeholder="장소 이름이나 주소로 검색"
          className="h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-[15px] outline-none"
          aria-label="장소 검색"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <select
          value={sido}
          onChange={(e) => {
            setSido(e.target.value);
            setSigungu("all");
            reset();
          }}
          className={selectClass}
          aria-label="시·도"
        >
          <option value="all">시·도 전체</option>
          {sidos.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sigungu}
          onChange={(e) => {
            setSigungu(e.target.value);
            reset();
          }}
          className={selectClass}
          aria-label="시·군·구"
        >
          <option value="all">시·군·구 전체</option>
          {sigungus.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-[12.5px] text-muted">{filtered.length.toLocaleString("ko-KR")}곳</p>
      <ul className="mt-2 space-y-2">
        {filtered.slice(0, shown).map((p) => (
          <li key={p.slug}>
            <Link href={`/places/${p.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3.5">
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[14.5px] font-bold">{p.name}</span>
                  {p.isPartner && <span className="shrink-0 rounded-full bg-brand-tint px-2 py-0.5 text-[10.5px] font-bold text-brass">제휴</span>}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                  {KIND_LABEL[p.kind]} · {p.address}
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-muted-light" />
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <div className="mt-3 rounded-xl border border-border bg-white px-5 py-8 text-center">
          <p className="text-[14px] font-semibold">찾는 장소가 목록에 없나요?</p>
          <p className="mt-1 text-[12.5px] text-muted">목록에 없어도 주소만 입력하면 신청할 수 있어요.</p>
          <Link href="/estimate" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-[14px] font-semibold text-white">
            주소 직접 입력해 신청하기
          </Link>
        </div>
      )}
      {filtered.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mt-3 h-11 w-full rounded-xl border border-border bg-white text-[13.5px] font-semibold">
          더 보기 ({(filtered.length - shown).toLocaleString("ko-KR")}곳 남음)
        </button>
      )}
    </div>
  );
}
