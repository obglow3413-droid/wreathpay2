export default function Loading() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4 px-6 py-16" aria-label="불러오는 중">
      <div className="h-6 w-1/2 rounded-lg bg-sage" />
      <div className="h-4 w-3/4 rounded-lg bg-sage" />
      <div className="h-32 rounded-2xl bg-sage" />
      <div className="h-12 rounded-xl bg-sage" />
    </div>
  );
}
