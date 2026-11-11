"use client";

import { useServiceTab } from "./ServiceTabContext";
import { SERVICE_CONTENT } from "./serviceContent";

export default function TrustIndicators() {
  const { active } = useServiceTab();
  const items = SERVICE_CONTENT[active].points;

  return (
    <section className="border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-[1120px] grid-cols-3 gap-3 px-5 py-7 md:gap-6 md:px-8 md:py-9">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-line bg-paper px-3 py-4 text-center md:py-5"
          >
            <p className="break-keep text-[13px] font-bold text-foreground md:text-[15px]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
