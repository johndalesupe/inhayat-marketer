"use client";

import { clsx } from "clsx";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Hash,
  Link2,
  PackageCheck,
  Share2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Button,
  ErrorState,
  IconButton,
  Panel,
  Skeleton,
  StatusChip,
} from "@/src/components/ui/primitives";
import { useProduct, useProfile } from "@/src/hooks/useMarketerQueries";
import { formatDate, formatMoney } from "@/src/lib/format";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import { CreateReferralSheet } from "./components/CreateReferralSheet";
import { ProductMediaCarousel } from "./components/ProductMediaCarousel";

function toPlainText(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function DetailsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-11 w-11 rounded-[14px]" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-11 w-11 rounded-[14px]" />
      </div>
      <Skeleton className="aspect-[4/5] w-full rounded-[22px]" />
      <div className="space-y-2 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export function ProductDetailsScreen({ productId }: { productId: string }) {
  const router = useRouter();
  const { haptic } = useTelegram();
  const productQuery = useProduct(productId);
  const profileQuery = useProfile();
  const [language, setLanguage] = useState<"uz" | "ru">("uz");
  const [referralOpen, setReferralOpen] = useState(false);
  const product = productQuery.data;

  const display = useMemo(() => {
    if (!product) return null;
    const useRussian = language === "ru";
    const longDescription = useRussian
      ? product.descriptionRu || product.descriptionUz
      : product.descriptionUz;
    const shortDescription = useRussian
      ? product.shortDescriptionRu || product.shortDescriptionUz
      : product.shortDescriptionUz;
    return {
      title: (useRussian ? product.nameRu : product.nameUz) ?? product.nameUz,
      description: toPlainText(longDescription || shortDescription),
    };
  }, [language, product]);

  if (productQuery.isLoading) return <DetailsSkeleton />;

  if (productQuery.isError || !product || !display) {
    return (
      <div className="space-y-4">
        <IconButton label="Orqaga" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <ErrorState
          title="Mahsulot topilmadi"
          description="Mahsulot o'chirilgan, yashirilgan yoki havola eskirgan bo'lishi mumkin."
          retry={() => void productQuery.refetch()}
        />
      </div>
    );
  }

  const effectivePrice =
    product.discountPrice != null && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  const discountPercent =
    effectivePrice < product.price && product.price > 0
      ? Math.round(((product.price - effectivePrice) / product.price) * 100)
      : 0;
  const hasRussian = Boolean(
    product.nameRu || product.descriptionRu || product.shortDescriptionRu,
  );
  const activeVariants = (product.variants ?? []).filter(
    (variant) => variant.isActive,
  );
  const displayedStock = activeVariants.length
    ? activeVariants.reduce(
        (total, variant) => total + Math.max(0, variant.stock),
        0,
      )
    : Math.max(0, product.stock ?? 0);
  const canCreate =
    product.isAvailable &&
    profileQuery.isSuccess &&
    profileQuery.data.program.enabled;

  return (
    <div className="space-y-3">
      <div className="relative">
        <ProductMediaCarousel
          images={product.images ?? []}
          thumbnailUrl={product.thumbnailUrl}
          videoUrl={product.videoUrl}
          title={display.title}
        />
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 -mx-3 flex items-center justify-between gap-3 px-3 pt-3">
          <IconButton
            label="Orqaga"
            onClick={() => router.back()}
            className="pointer-events-auto h-10 w-10 rounded-[6px] border-white/70 bg-white/90 backdrop-blur"
          >
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
          <span className="inline-flex min-h-8 items-center gap-1.5 border border-white/70 bg-white/90 px-2.5 text-[10px] font-extrabold text-[var(--ink)] backdrop-blur">
            <Hash className="h-3.5 w-3.5" />
            {product.numericId}
          </span>
          <IconButton
            label="Referal orqali ulashish"
            disabled={!canCreate}
            onClick={() => {
              setReferralOpen(true);
              haptic("light");
            }}
            className="pointer-events-auto h-10 w-10 rounded-[6px] border-white/70 bg-white/90 backdrop-blur"
          >
            <Share2 className="h-5 w-5" />
          </IconButton>
        </header>
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.categoryName && (
            <StatusChip>{product.categoryName}</StatusChip>
          )}
          {product.isTop && (
            <StatusChip tone="brand">
              TOP {product.rank ? `#${product.rank}` : ""}
            </StatusChip>
          )}
          <StatusChip tone={product.isAvailable ? "success" : "warning"}>
            {product.isAvailable ? "Sotuvda mavjud" : "Hozir mavjud emas"}
          </StatusChip>
        </div>

        <h1 className="mt-3 text-[21px] font-extrabold leading-[1.28] tracking-[-0.03em] text-[var(--ink)]">
          {display.title}
        </h1>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[var(--line)] pt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Sotuv narxi
            </p>
            <p className="mt-1 text-[21px] font-black tracking-[-0.025em] text-[var(--ink)]">
              {formatMoney(effectivePrice)}
            </p>
            {discountPercent > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted-light)] line-through">
                  {formatMoney(product.price)}
                </span>
                <span className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--muted)]">
                  −{discountPercent}%
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0 rounded-[6px] border border-[var(--brand-line)] bg-[var(--brand-soft)] px-3 py-2.5 text-right">
            <p className="text-[9px] font-bold text-[var(--muted)]">
              Kutilayotgan foyda
            </p>
            <p className="mt-0.5 text-sm font-black text-[var(--brand)]">
              +{formatMoney(product.expectedBonus)}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Sotilgan",
            value: product.orderCount ?? 0,
            icon: ChartNoAxesColumnIncreasing,
          },
          {
            label: "Omborda",
            value: displayedStock,
            icon: Boxes,
          },
          {
            label: "Ko'rilgan",
            value: Math.max(0, product.viewCount ?? 0),
            icon: BadgeCheck,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Panel key={label} className="min-w-0 px-3 py-3">
            <Icon className="h-4 w-4 text-[var(--muted)]" />
            <p className="mt-2 text-base font-black tabular-nums text-[var(--ink)]">
              {value.toLocaleString("uz-UZ")}
            </p>
            <p className="mt-0.5 truncate text-[9px] font-bold text-[var(--muted)]">
              {label}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-extrabold text-[var(--ink)]">
              Mahsulot haqida
            </h2>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">
              Xaridorga tushunarli asosiy ma&apos;lumotlar
            </p>
          </div>
          {hasRussian && (
            <div className="flex rounded-[10px] border border-[var(--line)] bg-[var(--surface-muted)] p-0.5">
              {(["uz", "ru"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={language === value}
                  onClick={() => setLanguage(value)}
                  className={clsx(
                    "min-h-8 rounded-lg px-2.5 text-[10px] font-extrabold transition",
                    language === value
                      ? "bg-[var(--surface)] text-[var(--brand)]"
                      : "text-[var(--muted)]",
                  )}
                >
                  {value === "uz" ? "O'z" : "Ру"}
                </button>
              ))}
            </div>
          )}
        </div>
        {display.description ? (
          <p className="mt-3 whitespace-pre-line text-[13px] font-medium leading-6 text-[var(--muted)]">
            {display.description}
          </p>
        ) : (
          <p className="mt-3 rounded-xl bg-[var(--surface-muted)] px-3 py-4 text-center text-xs font-medium text-[var(--muted)]">
            Mahsulot tavsifi hali kiritilmagan.
          </p>
        )}
      </Panel>

      {activeVariants.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div>
              <h2 className="text-[15px] font-extrabold text-[var(--ink)]">
                Variantlar
              </h2>
              <p className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">
                {activeVariants.length} ta tanlov mavjud
              </p>
            </div>
            <PackageCheck className="h-5 w-5 text-[var(--muted)]" />
          </div>
          <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {activeVariants.map((variant) => {
              const variantName =
                language === "ru" && variant.nameRu
                  ? variant.nameRu
                  : variant.nameUz;
              const variantPrice =
                variant.discountPrice != null &&
                variant.price != null &&
                variant.discountPrice < variant.price
                  ? variant.discountPrice
                  : variant.price;
              return (
                <div
                  key={variant.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-[var(--ink)]">
                      {variantName}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">
                      {variant.stock > 0
                        ? `${variant.stock.toLocaleString("uz-UZ")} dona mavjud`
                        : "Tugagan"}
                    </p>
                  </div>
                  {variantPrice != null && (
                    <span className="shrink-0 text-xs font-extrabold text-[var(--ink)]">
                      {formatMoney(variantPrice)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink)]">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[var(--ink)]">
              Sotishga tayyormisiz?
            </p>
            <p className="mt-1 text-[11px] font-medium leading-4 text-[var(--muted)]">
              Kuzatuvli havola yarating. Bonus faqat yetkazilgan buyurtmalar
              uchun hisoblanadi.
            </p>
          </div>
        </div>
        {!canCreate && (
          <div className="mt-3 rounded-xl border border-[var(--warning-line)] bg-[var(--warning-soft)] px-3 py-2.5 text-[10px] font-bold text-[var(--warning)]">
            {!product.isAvailable
              ? "Mahsulot mavjud bo'lgach referal yaratish mumkin."
              : profileQuery.isLoading
                ? "Marketer dasturi holati tekshirilmoqda."
                : profileQuery.isError
                  ? "Marketer dasturi holatini tekshirib bo'lmadi."
                  : "Marketer dasturi hozir vaqtincha to'xtatilgan."}
            {profileQuery.isError && (
              <button
                type="button"
                onClick={() => void profileQuery.refetch()}
                className="ml-2 underline underline-offset-2"
              >
                Qayta urinish
              </button>
            )}
          </div>
        )}
        <Button
          className="mt-3 w-full"
          disabled={!canCreate}
          loading={profileQuery.isLoading}
          onClick={() => {
            setReferralOpen(true);
            haptic("light");
          }}
        >
          <Link2 className="h-4 w-4" />
          Referal yaratish va ulashish
        </Button>
        {product.createdAt && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-[var(--muted-light)]">
            <CalendarDays className="h-3.5 w-3.5" />
            Marketga {formatDate(product.createdAt)} kuni qo&apos;shilgan
          </p>
        )}
      </Panel>

      <CreateReferralSheet
        key={referralOpen ? product.id : "closed"}
        product={referralOpen ? product : null}
        onClose={() => setReferralOpen(false)}
      />
    </div>
  );
}
