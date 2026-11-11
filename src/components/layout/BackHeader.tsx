import Logo from "./Logo";

export default function BackHeader() {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-paper px-5">
      <Logo />
    </div>
  );
}
