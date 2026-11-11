"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/** celebration: 개업·축하화환(화이트 테마) / funeral: 근조화환(블랙 테마) */
export type ServiceKey = "celebration" | "funeral";

interface ServiceTabContextValue {
  active: ServiceKey;
  setActive: (next: ServiceKey) => void;
}

const ServiceTabContext = createContext<ServiceTabContextValue | null>(null);

export function ServiceTabProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ServiceKey>("celebration");
  return (
    <ServiceTabContext.Provider value={{ active, setActive }}>
      {/* 선택한 탭에 따라 화면 전체 테마(화이트 / 블랙)가 바뀜 */}
      <div data-theme={active} className="flex min-h-dvh flex-1 flex-col">
        {children}
      </div>
    </ServiceTabContext.Provider>
  );
}

export function useServiceTab() {
  const ctx = useContext(ServiceTabContext);
  if (!ctx) throw new Error("useServiceTab은 ServiceTabProvider 안에서만 사용할 수 있어요.");
  return ctx;
}
