"use client";

import { useEffect } from "react";
import { track, type FunnelEvent } from "@/lib/track";

/** 서버 컴포넌트 페이지에 끼워 넣는 방문 집계용 조각 */
export default function Track({ event }: { event: FunnelEvent }) {
  useEffect(() => {
    track(event);
  }, [event]);
  return null;
}
