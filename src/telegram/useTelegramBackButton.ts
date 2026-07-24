"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "./TelegramProvider";

export function useTelegramBackButton(enabled: boolean) {
  const router = useRouter();
  const { webApp } = useTelegram();

  useEffect(() => {
    const backButton = webApp?.BackButton;
    if (!backButton) return;
    const goBack = () => router.back();

    if (enabled) {
      backButton.show();
      backButton.onClick(goBack);
    } else {
      backButton.hide();
    }

    return () => {
      try {
        backButton.offClick(goBack);
        backButton.hide();
      } catch {
        // The WebView may already be closing.
      }
    };
  }, [enabled, router, webApp]);
}

