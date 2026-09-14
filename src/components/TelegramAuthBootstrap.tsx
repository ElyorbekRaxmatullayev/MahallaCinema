"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { verifyAndLogin } from "@/app/actions/auth";

interface SafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        requestFullscreen?: () => void;
        initData?: string;
        // Device-level unsafe area (notch/status bar) plus, separately, the
        // area Telegram's own floating close/menu controls occupy in
        // fullscreen mode — both only meaningful once requestFullscreen() runs.
        safeAreaInset?: SafeAreaInset;
        contentSafeAreaInset?: SafeAreaInset;
        onEvent?: (eventType: string, callback: () => void) => void;
        offEvent?: (eventType: string, callback: () => void) => void;
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

    function applySafeArea() {
      const webApp = window.Telegram?.WebApp;
      if (!webApp) return;
      const top = (webApp.safeAreaInset?.top ?? 0) + (webApp.contentSafeAreaInset?.top ?? 0);
      document.documentElement.style.setProperty("--tg-safe-area-top", `${top}px`);
    }

    function tryInit(): boolean {
      const webApp = window.Telegram?.WebApp;
      if (!webApp) return false;

      webApp.ready?.();
      webApp.expand?.();
      // Hides Telegram's own title bar (app name + ⋮ menu) on client versions
      // that support Bot API 8.0+ fullscreen mode; a no-op elsewhere. In
      // fullscreen, Telegram still floats its own close/menu row over the
      // page — applySafeArea() pushes our own header below it.
      webApp.requestFullscreen?.();
      applySafeArea();
      webApp.onEvent?.("safeAreaChanged", applySafeArea);
      webApp.onEvent?.("contentSafeAreaChanged", applySafeArea);

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
