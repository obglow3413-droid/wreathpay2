"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface GalleryItem {
  id: string;
  imageUrl: string;
  label: string;
  meta: string | null;
}

export default function GalleryManager({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [meta, setMeta] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleFileChange(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleUpload() {
    if (!file || !label) {
      setError("사진과 화환 종류를 입력해주세요.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("label", label);
      formData.append("meta", meta);

      const res = await fetch("/api/admin/gallery", { method: "POST", body: formData });
      if (!res.ok) throw new Error();

      setFile(null);
      setPreview(null);
      setLabel("");
      setMeta("");
      router.refresh();
    } catch {
      setError("등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("이 사례를 삭제할까요?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("삭제에 실패했어요.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* 업로드 폼 */}
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-[15px] font-bold">새 사례 등록</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
          <label className="flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface text-[12px] text-muted overflow-hidden">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="미리보기" className="h-full w-full object-cover" />
            ) : (
              <>
                <span className="text-xl">+</span>
                사진 선택
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">화환 종류</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="예) 장례식 근조화환"
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] text-muted">설명 (선택)</label>
              <input
                type="text"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                placeholder="예) 5개 수거"
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px]"
              />
            </div>
            {error && <p className="text-[12.5px] text-red-600">{error}</p>}
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-[13.5px] font-semibold text-white disabled:opacity-50"
            >
              {uploading ? "등록 중..." : "사례 등록"}
            </button>
          </div>
        </div>
      </section>

      {/* 등록된 목록 */}
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-[15px] font-bold">등록된 사례 ({items.length})</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-[13.5px] text-muted">
            아직 등록된 사례가 없어요. 위에서 사진을 등록하면 홈페이지에 바로 노출돼요.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-[11.5px] font-semibold text-white">{item.label}</p>
                  {item.meta && <p className="text-[10.5px] text-white/75">{item.meta}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white disabled:opacity-50"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
