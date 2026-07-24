"use client";

import Script from "next/script";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  TelegramInset,
  TelegramUser,
  TelegramWebApp,
} from "./types";

const EMPTY_INSET: TelegramInset = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
const FULLSCREEN_CONTROL_CLEARANCE = 92;

type TelegramContextValue = {
  ready: boolean;
  isTelegram: boolean;
  isFullscreen: boolean;
  initData: string;
  startParam: string;
  user: TelegramUser | null;
  webApp: TelegramWebApp | null;
  haptic: (
    kind?: "light" | "medium" | "heavy" | "success" | "warning" | "error",
  ) => void;
  openTelegramLink: (url: string) => void;
};

const TelegramContext = createContext<TelegramContextValue | null>(null);

function supported(webApp: TelegramWebApp, minimum: string) {
  try {
    if (webApp.isVersionAtLeast) return webApp.isVersionAtLeast(minimum);
  } catch {
    // Fall back to local version comparison.
  }

  const current = (webApp.version ?? "0").split(".").map(Number);
  const wanted = minimum.split(".").map(Number);
  const count = Math.max(current.length, wanted.length);
  for (let index = 0; index < count; index += 1) {
    const left = current[index] ?? 0;
    const right = wanted[index] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}

function readInset(value?: Partial<TelegramInset>) {
  return {
    top: Number(value?.top) || 0,
    right: Number(value?.right) || 0,
    bottom: Number(value?.bottom) || 0,
    left: Number(value?.left) || 0,
  };
}

function applyTelegramEnvironment(
  webApp: TelegramWebApp,
  fullscreenRequested: boolean,
) {
  const root = document.documentElement;
  const safe = readInset(webApp.safeAreaInset);
  const content = readInset(webApp.contentSafeAreaInset);
  const fullscreen = fullscreenRequested || Boolean(webApp.isFullscreen);
  const resolved = {
    top: Math.max(
      safe.top,
      content.top,
      fullscreen ? FULLSCREEN_CONTROL_CLEARANCE : 0,
    ),
    right: Math.max(safe.right, content.right),
    bottom: Math.max(safe.bottom, content.bottom),
    left: Math.max(safe.left, content.left),
  };

  (Object.keys(EMPTY_INSET) as Array<keyof TelegramInset>).forEach((side) => {
    root.style.setProperty(`--telegram-${side}`, `${resolved[side]}px`);
  });
  root.dataset.telegram = "true";
  root.dataset.fullscreen = fullscreen ? "true" : "false";
  // This product intentionally uses a stable light visual system. Telegram's
  // native controls are matched to it below, regardless of the device theme.
  root.dataset.theme = "light";
}

function clearTelegramEnvironment() {
  const root = document.documentElement;
  (Object.keys(EMPTY_INSET) as Array<keyof TelegramInset>).forEach((side) => {
    root.style.removeProperty(`--telegram-${side}`);
  });
  delete root.dataset.telegram;
  delete root.dataset.fullscreen;
  delete root.dataset.theme;
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const initializedRef = useRef(false);
  const fullscreenRequestedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const initialize = useCallback(() => {
    if (initializedRef.current) return true;
    const app = window.Telegram?.WebApp;
    if (!app) return false;
    initializedRef.current = true;

    const listeners: Array<{
      event: string;
      callback: (...args: unknown[]) => void;
    }> = [];
    const listen = (event: string, callback: (...args: unknown[]) => void) => {
      try {
        app.onEvent?.(event, callback);
        listeners.push({ event, callback });
      } catch {
        // Older clients can reject newer event names.
      }
    };
    const syncEnvironment = () => {
      try {
        applyTelegramEnvironment(app, fullscreenRequestedRef.current);
        setIsFullscreen(
          fullscreenRequestedRef.current || Boolean(app.isFullscreen),
        );
      } catch {
        // A partially initialized bridge must not block the application.
      }
    };
    const fullscreenChanged = () => {
      fullscreenRequestedRef.current = false;
      syncEnvironment();
    };
    const fullscreenFailed = () => {
      fullscreenRequestedRef.current = false;
      try {
        app.expand();
      } catch {
        // Keep the current viewport when expand is unavailable.
      }
      syncEnvironment();
    };
    const themeChanged = () => syncEnvironment();

    try {
      app.setHeaderColor?.("#f5f7fb");
      app.setBackgroundColor?.("#f5f7fb");
      if (supported(app, "7.10")) app.setBottomBarColor?.("#ffffff");
      app.ready();
      app.expand();
    } catch {
      // Rendering in the WebView is still useful with a partial bridge.
    }

    if (supported(app, "8.0")) {
      listen("safeAreaChanged", syncEnvironment);
      listen("contentSafeAreaChanged", syncEnvironment);
      listen("fullscreenChanged", fullscreenChanged);
      listen("fullscreenFailed", fullscreenFailed);
    }
    listen("themeChanged", themeChanged);
    syncEnvironment();

    if (
      supported(app, "8.0") &&
      !app.isFullscreen &&
      typeof app.requestFullscreen === "function"
    ) {
      fullscreenRequestedRef.current = true;
      syncEnvironment();
      try {
        const result = app.requestFullscreen();
        if (result && typeof result.then === "function") {
          void Promise.resolve(result).catch(fullscreenFailed);
        }
      } catch {
        fullscreenFailed();
      }
    }

    const delayedSyncs = [80, 320, 900].map((delay) =>
      window.setTimeout(syncEnvironment, delay),
    );
    setWebApp(app);
    setReady(true);

    cleanupRef.current = () => {
      delayedSyncs.forEach(window.clearTimeout);
      listeners.forEach(({ event, callback }) => {
        try {
          app.offEvent?.(event, callback);
        } catch {
          // Ignore stale bridge teardown errors.
        }
      });
      clearTelegramEnvironment();
    };
    return true;
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(initialize, 0);
    const interval = window.setInterval(() => {
      if (initialize()) window.clearInterval(interval);
    }, 100);
    const previewTimer = window.setTimeout(() => {
      if (!initializedRef.current) setReady(true);
      window.clearInterval(interval);
      window.clearTimeout(initialTimer);
    }, 1_500);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(previewTimer);
      cleanupRef.current?.();
    };
  }, [initialize]);

  const haptic = useCallback(
    (
      kind:
        | "light"
        | "medium"
        | "heavy"
        | "success"
        | "warning"
        | "error" = "light",
    ) => {
      try {
        if (kind === "success" || kind === "warning" || kind === "error") {
          webApp?.HapticFeedback?.notificationOccurred?.(kind);
        } else {
          webApp?.HapticFeedback?.impactOccurred?.(kind);
        }
      } catch {
        // Haptics are optional progressive enhancement.
      }
    },
    [webApp],
  );

  const openTelegramLink = useCallback(
    (url: string) => {
      try {
        if (/^https:\/\/t\.me\//i.test(url)) {
          webApp?.openTelegramLink?.(url);
          if (webApp?.openTelegramLink) return;
        }
        webApp?.openLink?.(url);
        if (webApp?.openLink) return;
      } catch {
        // Fall through to a normal browser target.
      }
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [webApp],
  );

  const value = useMemo<TelegramContextValue>(
    () => ({
      ready,
      // The official SDK also exposes a WebApp object in a normal browser.
      // Signed initData is the reliable signal that this page was launched by
      // Telegram; treating the bare object as a session breaks browser preview.
      isTelegram: Boolean(webApp?.initData),
      isFullscreen,
      initData: webApp?.initData ?? "",
      startParam: webApp?.initDataUnsafe?.start_param ?? "",
      user: webApp?.initDataUnsafe?.user ?? null,
      webApp,
      haptic,
      openTelegramLink,
    }),
    [haptic, isFullscreen, openTelegramLink, ready, webApp],
  );

  return (
    <TelegramContext.Provider value={value}>
      <Script
        id="telegram-web-app-sdk"
        src="https://telegram.org/js/telegram-web-app.js?63"
        strategy="afterInteractive"
        onReady={() => {
          initialize();
        }}
        onLoad={() => {
          initialize();
        }}
      />
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const value = useContext(TelegramContext);
  if (!value) {
    throw new Error("useTelegram TelegramProvider ichida ishlatilishi kerak");
  }
  return value;
}
