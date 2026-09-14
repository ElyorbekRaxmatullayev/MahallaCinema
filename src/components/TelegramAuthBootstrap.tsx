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
