"use client";

import {
  BarChart3,
  Copy,
  Eye,
  Megaphone,
  MousePointerClick,
  Pause,
  Play,
  ShoppingBag,
} from "lucide-react";
import { clsx } from "clsx";
import { useUpdateReferral } from "@/src/hooks/useMarketerQueries";
import {
  formatCompact,
  formatDate,
  formatMoney,
  formatPercent,
} from "@/src/lib/format";
import type { MarketerReferral } from "@/src/types/marketer";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import { ProductImage } from "@/src/components/ui/ProductImage";
import {
  Button,
  IconButton,
  Panel,
  StatusChip,
} from "@/src/components/ui/primitives";

function statusLabel(status: MarketerReferral["status"]) {
  if (status === "active") return "Faol";
  if (status === "paused") return "To'xtatilgan";
  return "Arxivlangan";
}

export function ReferralCard({
  referral,
  onOpenLinks,
  onPublish,
}: {
  referral: MarketerReferral;
  onOpenLinks: () => void;
  onPublish: () => void;
}) {
  const update = useUpdateReferral();
  const { haptic } = useTelegram();
  const toggleStatus = referral.status === "active" ? "paused" : "active";
  const metrics = [
    { label: "Ko'rish", value: referral.stats.views, icon: Eye },
    {
      label: "Tashrif",
      value: referral.stats.visitors,
      icon: MousePointerClick,
    },
    { label: "Buyurtma", value: referral.stats.orders, icon: ShoppingBag },
    {
      label: "Konversiya",
      value: formatPercent(referral.stats.conversionPercent),
      icon: BarChart3,
      formatted: true,
    },
  ];

  return (
    <Panel className="overflow-hidden p-0">
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <ProductImage
            src={referral.product.thumbnailUrl}
            alt={referral.product.nameUz}
            className="h-[76px] w-[58px] shrink-0 rounded-[6px] border border-[var(--line)] bg-[var(--surface-muted)]"
            sizes="58px"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-1 text-[14px] font-extrabold leading-5 tracking-[-0.015em] text-[var(--ink)]">
                  {referral.name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-4 text-[var(--muted)]">
                  {referral.product.nameUz}
                </p>
              </div>
              <StatusChip
                tone={
                  referral.status === "active"
                    ? "success"
                    : referral.status === "paused"
                      ? "warning"
                      : "neutral"
                }
              >
                {statusLabel(referral.status)}
              </StatusChip>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)]">
              <span>#{referral.product.numericId}</span>
              <span className="text-[var(--line-strong)]">•</span>
              <span>{formatDate(referral.createdAt)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted)]">
                {referral.formAuthentication === "otp"
                  ? "SMS tasdiqli"
                  : "SMSsiz"}
              </span>
              <span className="border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted)]">
                {referral.showAddressFields
                  ? "Manzil va yetkazish bor"
                  : "Faqat ism va telefon"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2.5">
          <div>
            <p className="text-[10px] font-bold text-[var(--muted)]">
              Topilgan foyda
            </p>
            <p className="mt-0.5 text-[19px] font-black tabular-nums tracking-[-0.035em] text-[var(--brand)]">
              {formatMoney(referral.stats.bonus)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold text-[var(--muted)]">
              1 ta yetkazilganda
            </p>
            <p className="mt-0.5 text-xs font-extrabold tabular-nums text-[var(--ink)]">
              +{formatMoney(referral.expectedBonus)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-[var(--line)] border-y border-[var(--line)] bg-[var(--surface-muted)] py-2.5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="min-w-0 px-1.5 text-center">
              <Icon className="mx-auto h-3.5 w-3.5 text-[var(--muted)]" />
              <p className="mt-1 truncate text-xs font-extrabold tabular-nums text-[var(--ink)]">
                {metric.formatted
                  ? metric.value
                  : formatCompact(metric.value as number)}
              </p>
              <p className="mt-0.5 truncate text-[9px] font-semibold text-[var(--muted)]">
                {metric.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] gap-2">
          <Button
            variant="secondary"
            className="min-h-10 rounded-[11px] px-2 text-[11px]"
            onClick={onOpenLinks}
          >
            <Copy className="h-3.5 w-3.5" />
            Havolani olish
          </Button>
          <Button
            className="min-h-10 rounded-[11px] px-2 text-[11px]"
            onClick={onPublish}
            disabled={referral.status !== "active"}
            title={
              referral.status === "active"
                ? "Kanal va guruhlarga yuborish"
                : "Yuborish uchun referal faol bo'lishi kerak"
            }
          >
            <Megaphone className="h-3.5 w-3.5" />
            Yuborish
          </Button>
          {referral.status !== "archived" ? (
            <IconButton
              label={
                referral.status === "active"
                  ? "Referalni to'xtatish"
                  : "Referalni faollashtirish"
              }
              className={clsx(
                "h-10 w-10 rounded-[11px]",
                referral.status === "active" && "text-[var(--muted)]",
              )}
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  { referralId: referral.id, status: toggleStatus },
                  {
                    onSuccess: () => haptic("success"),
                    onError: () => haptic("error"),
                  },
                )
              }
            >
              {referral.status === "active" ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </IconButton>
          ) : (
            <span />
          )}
        </div>
      </div>
    </Panel>
  );
}
