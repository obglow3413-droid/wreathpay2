"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ServiceKey = "wreath" | "plant";

interface ServiceTabContextValue {
  active: ServiceKey;
  setActive: (next: ServiceKey) => void;
}

const ServiceTabContext = createContext<ServiceTabContextValue | null>(null);

export function ServiceTabProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ServiceKey>("wreath");
  return (
    <ServiceTabContext.Provider value={{ active, setActive }}>{children}</ServiceTabContext.Provider>
  );
}

export function useServiceTab() {
  const ctx = useContext(ServiceTabContext);
  if (!ctx) throw new Error("useServiceTab은 ServiceTabProvider 안에서만 사용할 수 있어요.");
  return ctx;
}
