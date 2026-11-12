"use client";

import { useEffect } from "react";

/** 추천 링크(?r=코드)로 들어오면 코드를 기기에 30일간 기억해 두었다가 신청할 때 함께 보낸다. */
export default function RefCapture() {
  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get("r");
      if (r && /^[a-z0-9]{5,12}$/.test(r)) localStorage.setItem("kkotpay:ref", r);
    } catch {}
  }, []);
  return null;
}
