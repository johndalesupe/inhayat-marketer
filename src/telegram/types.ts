export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export type TelegramInset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TelegramBackButton = {
  isVisible?: boolean;
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
};

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    query_id?: string;
  };
  version?: string;
  platform?: string;
  colorScheme?: "light" | "dark";
  isFullscreen?: boolean;
  safeAreaInset?: Partial<TelegramInset>;
  contentSafeAreaInset?: Partial<TelegramInset>;
  ready: () => void;
  expand: () => void;
  requestFullscreen?: () => void | PromiseLike<void>;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  isVersionAtLeast?: (version: string) => boolean;
  onEvent?: (event: string, callback: (...args: unknown[]) => void) => void;
  offEvent?: (event: string, callback: (...args: unknown[]) => void) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  BackButton?: TelegramBackButton;
  HapticFeedback?: {
    impactOccurred?: (
      style: "light" | "medium" | "heavy" | "rigid" | "soft",
    ) => void;
    notificationOccurred?: (
      type: "error" | "success" | "warning",
    ) => void;
    selectionChanged?: () => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

