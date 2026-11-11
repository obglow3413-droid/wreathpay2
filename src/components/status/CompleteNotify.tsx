"use client";

import { useSyncExternalStore } from "react";
import NotifyButton from "./NotifyButton";

const noop = () => () => {};

/** 신청 직후 화면: 신청 때 입력한 연락처(세션에만 보관)로 알림을 바로 신청. 없으면 아무것도 보이지 않고, 조회 화면에서 신청할 수 있다. */
export default function CompleteNotify({ requestNo }: { requestNo: string }) {
  const phone = useSyncExternalStore(
    noop,
    () => {
      try {
        return sessionStorage.getItem(`kkotpay:phone:${requestNo}`) ?? "";
      } catch {
        return "";
      }
    },
    () => ""
  );
  if (!phone) return null;
  return <NotifyButton requestNo={requestNo} phone={phone} />;
}
