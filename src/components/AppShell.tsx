"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  Bot,
  CircleUserRound,
  ExternalLink,
  Link2,
  Store,
} from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { useAppSelector } from "@/src/store/hooks";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import { useTelegramBackButton } from "@/src/telegram/useTelegramBackButton";
import { Button, PageSkeleton, Panel } from "./ui/primitives";

const navItems = [
  { href: "/", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/market", label: "Market", icon: Store },
  { href: "/referrals", label: "Referallar", icon: Link2 },
  { href: "/account", label: "Hisob", icon: CircleUserRound },
];

function AuthFailure({ message }: { message: string }) {
  const { openTelegramLink } = useTelegram();
  const botUsername = (
    process.env.NEXT_PUBLIC_MARKETER_BOT_USERNAME ?? ""
  ).replace(/^@/, "");
  const botUrl = botUsername ? `https://t.me/${botUsername}` : "";

  return (
    <div className="flex min-h-[calc(100dvh-var(--app-safe-top)-var(--app-safe-bottom))] items-center py-8">
      <Panel className="w-full px-5 py-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
          <Bot className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-[-0.025em] text-[var(--ink)]">
          Ilovani bot orqali oching
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-[var(--muted)]">
          {message}
        </p>
        {botUrl && (
          <Button
            className="mt-5 w-full"
            onClick={() => openTelegramLink(botUrl)}
          >
            Marketer botiga o’tish
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </Panel>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const status = useAppSelector((state) => state.session.status);
  const sessionError = useAppSelector((state) => state.session.error);
  const nestedRoute =
    pathname.startsWith("/account/") ||
    (pathname !== "/" &&
      !navItems.some((item) => item.href === pathname));
  useTelegramBackButton(nestedRoute);

  if (status === "booting") {
    return (
      <main className="app-shell mx-auto min-h-[100dvh] max-w-[560px] pb-[calc(88px+var(--app-safe-bottom))] pt-[calc(10px+var(--app-safe-top))]">
        <PageSkeleton />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="app-shell mx-auto min-h-[100dvh] max-w-[560px] pt-[var(--app-safe-top)]">
        <AuthFailure
          message={
            sessionError ??
            "Xavfsiz Telegram sessiyasini aniqlab bo'lmadi."
          }
        />
      </main>
    );
  }

  return (
    <main className="app-shell mx-auto min-h-[100dvh] max-w-[560px] pb-[calc(88px+var(--app-safe-bottom))] pt-[calc(10px+var(--app-safe-top))]">
      {status === "preview" && (
        <div className="mb-3 flex items-center gap-2 rounded-[14px] border border-[var(--warning-line)] bg-[var(--warning-soft)] px-3 py-2 text-[11px] font-bold text-[var(--warning)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          Brauzer ko’rish rejimi — kirish Telegram ichida tasdiqlanadi
        </div>
      )}
      <div className="min-w-0">{children}</div>

      <nav
        className="bottom-nav-frame fixed bottom-0 z-50 rounded-t-[22px] border-x border-t border-[var(--line)] bg-[color:var(--surface-glass)] px-2 pt-1 backdrop-blur-xl"
        aria-label="Asosiy bo'limlar"
      >
        <div className="grid grid-cols-4 gap-1 pb-[calc(6px+var(--app-safe-bottom))]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-[62px] flex-col items-center justify-center gap-0.5 rounded-[15px] text-[10px] font-bold transition active:scale-[0.98]",
                  active
                    ? "text-[var(--brand)]"
                    : "text-[var(--muted)] active:bg-[var(--surface-muted)]",
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 min-w-11 items-center justify-center rounded-full px-3 transition",
                    active && "bg-[var(--brand-soft)]",
                  )}
                >
                  <Icon
                    className={clsx("h-[19px] w-[19px]", active && "stroke-[2.4]")}
                  />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
