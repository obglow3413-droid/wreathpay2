"use client";

import { useEffect } from "react";

/**
 * 채널톡 위젯. NEXT_PUBLIC_CHANNEL_PLUGIN_KEY(채널톡 관리자 > 설치 > 플러그인 키)가 설정된 경우에만 로드.
 * 키가 없으면 아무것도 하지 않으며, 상단 말풍선 아이콘은 기존처럼 채널톡 링크로 연결된다.
 */
export default function ChannelTalk() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY;
    if (!key || document.getElementById("channel-talk-sdk")) return;

    const s = document.createElement("script");
    s.id = "channel-talk-sdk";
    s.async = true;
    s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    s.onload = () => {
      const w = window as unknown as { ChannelIO?: (...args: unknown[]) => void };
      w.ChannelIO?.("boot", { pluginKey: key, language: "ko" });
    };
    document.head.appendChild(s);
  }, []);

  return null;
}
