"use client";

import { useEffect } from "react";
import { saveWpRef } from "@/lib/wpClient";

/** 파트너 추천 랜딩 방문 시 추천 코드를 기기에 30일간 기억(이후 접수할 때 함께 전송) */
export default function SaveWpRef({ code, name }: { code: string; name: string }) {
  useEffect(() => {
    saveWpRef(code, name);
  }, [code, name]);
  return null;
}
