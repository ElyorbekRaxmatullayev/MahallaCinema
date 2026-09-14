"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { verifyAndLogin } from "@/app/actions/auth";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        requestFullscreen?: () => void;
        initData?: string;
      };
    };
  }
}

export default function TelegramAuthBootstrap() {
  const router = useRouter();
  const didVerify = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function tryInit(): boolean {
      const webApp = window.Telegram?.WebApp;
      if (!webApp) return false;

      webApp.ready?.();
      webApp.expand?.();
      // Hides Telegram's own title bar (app name + ⋮ menu) on client versions
      // that support Bot API 8.0+ fullscreen mode; a no-op elsewhere.
      webApp.requestFullscreen?.();

      const initData = webApp.initData;
      if (!initData || didVerify.current) return true;

      didVerify.current = true;
      verifyAndLogin(initData).then((res) => {
        if (!cancelled && res.success) router.refresh();
      });
      return true;
    }

    if (!tryInit()) {
      interval = setInterval(() => {
        if (tryInit() && interval) clearInterval(interval);
      }, 100);
      timeout = setTimeout(() => interval && clearInterval(interval), 5000);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [router]);

  return null;
}
