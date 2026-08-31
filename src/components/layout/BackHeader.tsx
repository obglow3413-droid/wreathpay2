import Link from "next/link";

export default function BackHeader() {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-paper px-5">
      <Link href="/" className="text-[16px] font-extrabold tracking-[0.12em] text-foreground">
        KKOT<span className="text-brass"> PAY</span>
      </Link>
    </div>
  );
}
