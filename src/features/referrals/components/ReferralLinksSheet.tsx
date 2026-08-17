"use client";

import { AlertCircle, Check, Copy, Globe2, Link2, Workflow } from "lucide-react";
import { useState } from "react";
import { useEnsureReferralStreamLink } from "@/src/hooks/useMarketerQueries";
import { apiErrorMessage } from "@/src/lib/api";
import { formatMoney } from "@/src/lib/format";
import type { MarketerReferral } from "@/src/types/marketer";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import {
  BottomSheet,
  Button,
  IconButton,
} from "@/src/components/ui/primitives";

type LinkKind = "miniapp" | "web" | "stream";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const element = document.createElement("textarea");
  element.value = value;
  element.style.position = "fixed";
  element.style.opacity = "0";
  document.body.appendChild(element);
  element.select();
  document.execCommand("copy");
  element.remove();
}

function urlPreview(value: string) {
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

export function ReferralLinksSheet({
  referral,
  onClose,
}: {
  referral: MarketerReferral;
  onClose: () => void;
}) {
  const ensureStream = useEnsureReferralStreamLink();
  const { haptic } = useTelegram();
  const [copied, setCopied] = useState<LinkKind | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const current = ensureStream.data ?? referral;
  const linksDisabled = current.status !== "active";
  const streamLink = current.links.stream ?? current.links.form ?? null;
  const rows: Array<{
    kind: LinkKind;
    title: string;
    description: string;
    value: string | null;
    icon: typeof Link2;
  }> = [
    {
      kind: "miniapp",
      title: "Telegram Mini App",
      description: "Telegram ichida mahsulotni ochadi",
      value: current.links.miniapp,
      icon: Link2,
    },
    {
      kind: "web",
      title: "Web sahifa",
      description: "Brauzerda mahsulot sahifasini ochadi",
      value: current.links.web,
      icon: Globe2,
    },
    {
      kind: "stream",
      title: "Oqim sahifasi",
      description: current.showAddressFields
        ? "Lead formasi manzil maydonlari bilan"
        : "Ixcham ism va telefon formasi",
      value: streamLink,
      icon: Workflow,
    },
  ];

  const handleCopy = async (kind: LinkKind, value: string) => {
    setCopyError(null);
    try {
      await copyText(value);
      setCopied(kind);
      haptic("success");
      window.setTimeout(
        () => setCopied((active) => (active === kind ? null : active)),
        1_800,
      );
    } catch {
      setCopyError("Havolani nusxalab bo'lmadi. Qayta urinib ko'ring.");
      haptic("error");
    }
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Referal havolalari"
      description="Kerakli kanalni tanlang. Har bir havola shu referal statistikasi bilan kuzatiladi."
    >
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--line)]">
        <div className="bg-[var(--surface-raised)] p-3">
          <p className="text-[10px] font-bold text-[var(--muted)]">
            Topilgan foyda
          </p>
          <p className="mt-1 text-base font-black tabular-nums text-[var(--brand)]">
            {formatMoney(current.stats.bonus)}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-3">
          <p className="text-[10px] font-bold text-[var(--muted)]">
            Har bir savdodan
          </p>
          <p className="mt-1 text-base font-black tabular-nums text-[var(--ink)]">
            +{formatMoney(current.expectedBonus)}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.kind}
              className="flex min-w-0 items-center gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[var(--surface-muted)] text-[var(--ink)]">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-extrabold text-[var(--ink)]">
                  {row.title}
                </p>
                <p className="mt-0.5 text-[10px] font-medium leading-4 text-[var(--muted)]">
                  {row.description}
                </p>
                {row.value && (
                  <p className="mt-1 truncate text-[9px] font-semibold text-[var(--muted-light)]">
                    {urlPreview(row.value)}
                  </p>
                )}
              </div>
              {row.value ? (
                <IconButton
                  label={`${row.title} havolasini nusxalash`}
                  className="h-10 w-10 rounded-[11px]"
                  disabled={linksDisabled}
                  onClick={() => void handleCopy(row.kind, row.value as string)}
                >
                  {copied === row.kind ? (
                    <Check className="h-4 w-4 text-[var(--brand)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </IconButton>
              ) : (
                <Button
                  className="min-h-9 shrink-0 rounded-[10px] px-3 text-[10px]"
                  disabled={linksDisabled}
                  loading={ensureStream.isPending}
                  onClick={() =>
                    ensureStream.mutate(current.id, {
                      onSuccess: () => haptic("success"),
                      onError: () => haptic("error"),
                    })
                  }
                >
                  Tayyorlash
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {(copyError || ensureStream.isError) && (
        <p className="mt-3 rounded-[12px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-2.5 text-xs font-semibold text-[var(--danger)]">
          {copyError ??
            apiErrorMessage(
              ensureStream.error,
              "Oqim havolasini tayyorlab bo'lmadi",
            )}
        </p>
      )}
      {linksDisabled && (
        <p className="mt-3 flex items-start gap-2 rounded-[12px] border border-[var(--warning-line)] bg-[var(--warning-soft)] px-3 py-2.5 text-[10px] font-semibold leading-4 text-[var(--warning)]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Havolalarni nusxalash uchun referalni avval faollashtiring.
        </p>
      )}
      <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-[var(--surface-muted)] px-3 py-2.5 text-[10px] font-medium leading-4 text-[var(--muted)]">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
        Foyda faqat buyurtma yetkazilgandan keyin balansga qo‘shiladi.
      </p>
    </BottomSheet>
  );
}
