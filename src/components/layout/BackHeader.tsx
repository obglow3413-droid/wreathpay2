import Link from "next/link";

export default function BackHeader() {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-white px-5">
      <Link href="/" className="text-[17px] font-extrabold tracking-tight">
        KKOT<span className="text-brand"> PAY</span>
      </Link>
    </div>
  );
}
