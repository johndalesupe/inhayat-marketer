"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { clsx } from "clsx";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleX,
  Clipboard,
  Images,
  Layers3,
  Link2,
  LoaderCircle,
  Megaphone,
  PackageCheck,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { ProductImage } from "@/src/components/ui/ProductImage";
import {
  BottomSheet,
  Button,
  EmptyState,
  ErrorState,
  FieldError,
  Panel,
  Skeleton,
  inputClass,
} from "@/src/components/ui/primitives";
import { useInfiniteSentinel } from "@/src/hooks/useInfiniteSentinel";
import {
  useBotChats,
  useBulkReferralPublication,
  useCreateReferral,
  useProductCategories,
  useProducts,
  useProfile,
  usePublicationBatch,
} from "@/src/hooks/useMarketerQueries";
import { apiErrorMessage, createIdempotencyKey } from "@/src/lib/api";
import { formatMoney } from "@/src/lib/format";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import type {
  BulkReferralSelection,
  MarketerCategory,
  MarketerProduct,
  MarketerReferral,
} from "@/src/types/marketer";

const referralSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(3, "Nom kamida 3 ta belgidan iborat bo'lsin")
    .max(80, "Nom 80 ta belgidan oshmasin")
    .required("Referal nomini kiriting"),
});
type ReferralForm = yup.InferType<typeof referralSchema>;

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function ProductCard({
  product,
  onCreate,
  canCreate = true,
  selectionMode = false,
  selected = false,
  onToggle,
}: {
  product: MarketerProduct;
  onCreate: (product: MarketerProduct) => void;
  canCreate?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggle?: (product: MarketerProduct) => void;
}) {
  const price =
    product.discountPrice != null && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  const selectionDisabled = !product.isAvailable || !canCreate;

  return (
    <article
      className={clsx(
        "min-w-0 overflow-hidden rounded-[12px] border bg-[var(--surface)] transition",
        selectionMode && selected
          ? "border-[var(--brand)] ring-2 ring-[var(--brand-ring)]"
          : "border-[var(--line)]",
      )}
    >
      <button
        type="button"
        className="relative block w-full overflow-hidden bg-[var(--surface-muted)] text-left disabled:cursor-not-allowed"
        disabled={!selectionMode || selectionDisabled}
        onClick={() => onToggle?.(product)}
        aria-label={
          selectionMode
            ? `${product.nameUz} mahsulotini ${
                selected ? "tanlovdan chiqarish" : "tanlash"
              }`
            : undefined
        }
      >
        <ProductImage
          src={product.thumbnailUrl}
          alt={product.nameUz}
          className="aspect-[4/5] w-full"
        />
        {selectionMode && (
          <span
            className={clsx(
              "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition",
              selected
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-white/80 bg-white/90 text-[var(--muted)]",
            )}
          >
            {selected ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-current opacity-50" />
            )}
          </span>
        )}
        {!product.isAvailable && (
          <span className="absolute inset-x-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-center text-[10px] font-bold text-white">
            Hozir mavjud emas
          </span>
        )}
      </button>

      <div className="p-2">
        <p className="line-clamp-2 min-h-[34px] text-[12px] font-bold leading-[17px] text-[var(--ink)]">
          {product.nameUz}
        </p>
        <p className="mt-1 text-xs font-extrabold text-[var(--ink)]">
          {formatMoney(price)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-1 rounded-lg border border-[var(--brand-line)] bg-[var(--brand-soft)] px-2 py-1.5">
          <p className="truncate text-[9px] font-semibold text-[var(--muted)]">
            Taxminiy bonus
          </p>
          <p className="shrink-0 text-[11px] font-extrabold text-[var(--brand)]">
            +{formatMoney(product.expectedBonus)}
          </p>
        </div>
        <Button
          variant="secondary"
          className={clsx(
            "mt-2 min-h-9 w-full rounded-[10px] px-2 text-[11px] font-extrabold",
            selectionMode && selected
              ? "border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]"
              : "text-[var(--brand)]",
          )}
          disabled={selectionDisabled}
          onClick={() =>
            selectionMode ? onToggle?.(product) : onCreate(product)
          }
        >
          {selectionMode ? (
            selected ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <span className="h-3.5 w-3.5 rounded border border-current" />
            )
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          {selectionMode
            ? selected
              ? "Tanlandi"
              : "Tanlash"
            : canCreate
              ? "Referal yaratish"
              : "Dastur to'xtatilgan"}
        </Button>
      </div>
    </article>
  );
}

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]"
        >
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <div className="space-y-1.5 p-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferralSheet({
  product,
  onClose,
}: {
  product: MarketerProduct;
  onClose: () => void;
}) {
  const mutation = useCreateReferral();
  const { haptic, openTelegramLink } = useTelegram();
  const [copied, setCopied] = useState(false);
  const form = useForm<ReferralForm>({
    resolver: yupResolver(referralSchema),
    defaultValues: { name: `${product.nameUz} uchun havola` },
  });

  const created = mutation.data as MarketerReferral | undefined;
  const close = () => {
    form.reset();
    mutation.reset();
    onClose();
  };

  return (
    <BottomSheet
      open
      onClose={close}
      title={created ? "Referal tayyor" : "Yangi referal"}
      description={
        created
          ? "Havolani nusxalang yoki Telegram orqali ulashing."
          : "Natijalarni keyin aynan shu nom orqali ajrata olasiz."
      }
    >
      {!created && (
        <>
          <div className="flex items-center gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-2.5">
            <ProductImage
              src={product.thumbnailUrl}
              alt={product.nameUz}
              className="h-14 w-11 shrink-0 rounded-lg border border-[var(--line)]"
              sizes="44px"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-bold leading-[17px] text-[var(--ink)]">
                {product.nameUz}
              </p>
              <p className="mt-1 text-[11px] font-extrabold text-[var(--brand)]">
                Har bir buyurtmadan taxminan{" "}
                {formatMoney(product.expectedBonus)}
              </p>
            </div>
          </div>
          <form
            className="mt-3.5"
            onSubmit={form.handleSubmit((values) => {
              mutation.mutate(
                {
                  name: values.name.trim(),
                  productId: product.id,
                  idempotencyKey: createIdempotencyKey(),
                },
                {
                  onSuccess: () => haptic("success"),
                  onError: () => haptic("error"),
                },
              );
            })}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[var(--ink)]">
                Referal nomi
              </span>
              <input
                {...form.register("name")}
                className={inputClass}
                placeholder="Masalan: Instagram — iyul"
                autoComplete="off"
              />
              <FieldError message={form.formState.errors.name?.message} />
            </label>
            {mutation.isError && (
              <p className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
                {apiErrorMessage(mutation.error, "Referal yaratilmadi")}
              </p>
            )}
            <Button
              type="submit"
              loading={mutation.isPending}
              className="mt-3.5 min-h-10 w-full"
            >
              <Sparkles className="h-4 w-4" />
              Havolani yaratish
            </Button>
          </form>
        </>
      )}

      {created && (
        <div>
          <div className="rounded-[14px] border border-[var(--success-line)] bg-[var(--success-soft)] p-3.5 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--success-line)] bg-[var(--surface)] text-[var(--success)]">
              <Check className="h-4.5 w-4.5" />
            </span>
            <p className="mt-2.5 text-sm font-extrabold text-[var(--ink)]">
              {created.name}
            </p>
            <p className="mt-1 break-all text-xs font-semibold leading-5 text-[var(--muted)]">
              {created.link}
            </p>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className="min-h-10"
              onClick={async () => {
                await copyText(created.link);
                setCopied(true);
                haptic("success");
              }}
            >
              <Clipboard className="h-4 w-4" />
              {copied ? "Nusxalandi" : "Nusxalash"}
            </Button>
            <Button
              className="min-h-10"
              onClick={() => {
                const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
                  created.link,
                )}&text=${encodeURIComponent(created.product.nameUz)}`;
                openTelegramLink(shareUrl);
                haptic("light");
              }}
            >
              <Send className="h-4 w-4" />
              Ulashish
            </Button>
          </div>
          <Button
            variant="ghost"
            className="mt-1.5 min-h-9 w-full text-xs"
            onClick={close}
          >
            Tayyor
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}

function CategoryStrip({
  categories,
  selectedId,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  categories: MarketerCategory[];
  selectedId: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div className="-mx-2.5 border-y border-[var(--line)] bg-[var(--surface)] py-1.5">
      <nav
        aria-label="Mahsulot toifalari"
        className="flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={() => onSelect("")}
          aria-pressed={!selectedId}
          className={clsx(
            "h-10 shrink-0 rounded-[10px] border px-3 text-[11px] font-extrabold transition active:scale-[0.98]",
            !selectedId
              ? "border-[var(--brand)] bg-[var(--brand)] text-white"
              : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
          )}
        >
          Barchasi
        </button>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-10 w-24 shrink-0 rounded-[10px]"
              />
            ))
          : categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => onSelect(category.id)}
                aria-pressed={selectedId === category.id}
                className={clsx(
                  "flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] border px-3 text-[11px] font-extrabold transition active:scale-[0.98]",
                  selectedId === category.id
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
                )}
              >
                <span>{category.name}</span>
                <span
                  className={clsx(
                    "rounded-md px-1.5 py-0.5 text-[9px]",
                    selectedId === category.id
                      ? "bg-white/18 text-white"
                      : "bg-[var(--surface-muted)] text-[var(--muted-light)]",
                  )}
                >
                  {category.productCount}
                </span>
              </button>
            ))}
      </nav>
      {error && (
        <div className="mx-1 mt-1.5 flex min-h-9 items-center justify-between gap-3 rounded-[9px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-2.5">
          <p className="text-[10px] font-bold text-[var(--danger)]">
            Toifalarni yuklab bo&apos;lmadi
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-8 shrink-0 px-1.5 text-[10px] font-extrabold text-[var(--danger)]"
          >
            Qayta urinish
          </button>
        </div>
      )}
    </div>
  );
}

function BulkPublishSheet({
  selection,
  selectionCount,
  category,
  programEnabled,
  onClose,
  onComplete,
}: {
  selection: BulkReferralSelection;
  selectionCount: number;
  category?: MarketerCategory;
  programEnabled: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const chatsQuery = useBotChats(true);
  const mutation = useBulkReferralPublication();
  const batchQuery = usePublicationBatch(
    mutation.data?.published.batchId ?? null,
  );
  const { haptic } = useTelegram();
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [namePrefix, setNamePrefix] = useState("");
  const [submittedPayload, setSubmittedPayload] = useState<
    | (BulkReferralSelection & {
        namePrefix?: string;
        chatIds: string[];
        createIdempotencyKey: string;
        publishIdempotencyKey: string;
      })
    | null
  >(null);
  const publishable = useMemo(
    () => chatsQuery.data?.filter((chat) => chat.canPublish) ?? [],
    [chatsQuery.data],
  );
  const selectedAll =
    publishable.length > 0 &&
    publishable.every((chat) => selectedChatIds.includes(chat.chatId));
  const prefixInvalid =
    namePrefix.trim().length > 0 && namePrefix.trim().length < 2;
  const batch = batchQuery.data;
  const terminal =
    batch?.status === "completed" ||
    batch?.status === "partial" ||
    batch?.status === "failed";
  const failed = batch?.status === "failed";
  const partial = batch?.status === "partial";
  const formLocked = mutation.isPending || submittedPayload !== null;

  const close = () => {
    if (mutation.isPending) return;
    if (mutation.isSuccess) onComplete();
    onClose();
  };

  return (
    <BottomSheet
      open
      onClose={close}
      title={mutation.isSuccess ? "Ommaviy yuborish" : "Referallarni yuborish"}
      description={
        mutation.isSuccess
          ? "Jarayon xavfsiz navbatda bajariladi."
          : `${selectionCount} ta mahsulot uchun referal yaratib, tanlangan chatlarga yuboring.`
      }
    >
      {mutation.isSuccess ? (
        <div className="pb-1 text-center">
          <span
            className={clsx(
              "mx-auto flex h-12 w-12 items-center justify-center rounded-full border",
              failed
                ? "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]"
                : partial
                  ? "border-[var(--warning-line)] bg-[var(--warning-soft)] text-[var(--warning)]"
                : "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]",
            )}
          >
            {failed ? (
              <CircleX className="h-6 w-6" />
            ) : terminal ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            )}
          </span>
          <h3 className="mt-3 text-base font-extrabold text-[var(--ink)]">
            {failed
              ? "Yuborish yakunlanmadi"
              : partial
                ? "Postlar qisman yuborildi"
              : terminal
                ? "Postlar yuborildi"
                : "Postlar tayyorlanmoqda"}
          </h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted)]">
            {mutation.data.created.createdCount > 0 &&
              `${mutation.data.created.createdCount} ta yangi referal yaratildi. `}
            {mutation.data.created.reusedCount > 0 &&
              `${mutation.data.created.reusedCount} ta mavjud referal qayta ishlatildi. `}
            {!batch &&
              `${mutation.data.published.targetDeliveries} ta yuborish navbatga qo'yildi.`}
          </p>

          {batch && (
            <div className="mt-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-left">
              <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
                <span className="text-[var(--muted)]">Yuborildi</span>
                <span className="text-[var(--ink)]">
                  {batch.sentCount}/{batch.totalDeliveries}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                <span
                  className="block h-full rounded-full bg-[var(--success)] transition-[width]"
                  style={{
                    width: `${
                      batch.totalDeliveries
                        ? Math.min(
                            100,
                            ((batch.sentCount + batch.failedCount) /
                              batch.totalDeliveries) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              {batch.failedCount > 0 && (
                <p className="mt-2 text-[10px] font-bold text-[var(--danger)]">
                  {batch.sentCount} ta yuborildi, {batch.failedCount} ta
                  yuborishda xatolik qayd etildi.
                </p>
              )}
            </div>
          )}

          {batchQuery.isError && (
            <p className="mt-3 rounded-xl border border-[var(--warning-line)] bg-[var(--warning-soft)] p-3 text-left text-xs font-semibold text-[var(--warning)]">
              Holatni hozir yangilab bo&apos;lmadi. Yuborish serverda davom
              etmoqda.
            </p>
          )}
          <Button className="mt-3.5 min-h-10 w-full" onClick={close}>
            {terminal ? "Tayyor" : "Orqa fonda davom etsin"}
          </Button>
        </div>
      ) : chatsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-[12px]" />
          ))}
        </div>
      ) : chatsQuery.isError ? (
        <ErrorState
          description={apiErrorMessage(chatsQuery.error)}
          retry={() => void chatsQuery.refetch()}
        />
      ) : !publishable.length ? (
        <EmptyState
          title="Yuborish mumkin bo'lgan chat yo'q"
          description="Mening botim bo'limida botni kanal yoki guruhga administrator qilib qo'shing."
          icon={Megaphone}
        />
      ) : (
        <>
          <Panel className="flex items-start gap-3 bg-[var(--surface-muted)] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
              <Images className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[var(--ink)]">
                Galereya avval, ma&apos;lumot keyin
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-[var(--muted)]">
                Rasm va videolar galereya bo&apos;lib, so&apos;ng o&apos;zbek va
                rus tilidagi nom, narx hamda toifa heshtegi yuboriladi.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-lg bg-[var(--success)] px-2 py-1 text-[9px] font-extrabold text-white">
                  Buyurtma berish
                </span>
                <span className="rounded-lg bg-[var(--success)] px-2 py-1 text-[9px] font-extrabold text-white">
                  Заказать
                </span>
              </div>
            </div>
          </Panel>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[11px] font-extrabold text-[var(--ink)]">
              Kampaniya nomi{" "}
              <span className="font-semibold text-[var(--muted-light)]">
                (ixtiyoriy)
              </span>
            </span>
            <input
              value={namePrefix}
              onChange={(event) => setNamePrefix(event.target.value)}
              className={inputClass}
              maxLength={50}
              disabled={formLocked}
              autoComplete="off"
              placeholder={
                category ? `${category.name} — iyul` : "Telegram — iyul"
              }
            />
            {prefixInvalid && (
              <FieldError message="Nom kamida 2 ta belgidan iborat bo'lsin" />
            )}
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-[var(--ink)]">
                Kanal va guruhlar
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
                {selectedChatIds.length}/{publishable.length} ta tanlandi
              </p>
            </div>
            <button
              type="button"
              disabled={formLocked}
              className="min-h-8 rounded-lg px-2 text-[10px] font-extrabold text-[var(--brand)] active:bg-[var(--brand-soft)]"
              onClick={() =>
                setSelectedChatIds(
                  selectedAll ? [] : publishable.map((chat) => chat.chatId),
                )
              }
            >
              {selectedAll ? "Tanlovni tozalash" : "Barchasini tanlash"}
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {publishable.map((chat) => {
              const active = selectedChatIds.includes(chat.chatId);
              return (
                <button
                  type="button"
                  key={chat.id}
                  disabled={formLocked}
                  onClick={() =>
                    setSelectedChatIds((current) =>
                      active
                        ? current.filter((id) => id !== chat.chatId)
                        : [...current, chat.chatId],
                    )
                  }
                  aria-pressed={active}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-[12px] border p-2.5 text-left transition",
                    active
                      ? "border-[var(--brand-line)] bg-[var(--brand-soft)]"
                      : "border-[var(--line)] bg-[var(--surface)]",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-md border",
                      active
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--line-strong)] bg-[var(--surface)]",
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-[var(--ink)]">
                      {chat.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-[var(--muted)]">
                      {chat.type === "channel" ? "Kanal" : "Guruh"} ·{" "}
                      {chat.role === "creator" ? "Egasi" : "Administrator"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {mutation.isError && (
            <p className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold leading-5 text-[var(--danger)]">
              {apiErrorMessage(mutation.error, "Postlar yuborilmadi")}
              <span className="mt-1 block font-medium">
                Qayta urinish xavfsiz: avval yaratilgan referallar
                takrorlanmaydi.
              </span>
            </p>
          )}
          {!programEnabled && (
            <p className="mt-3 rounded-xl border border-[var(--warning-line)] bg-[var(--warning-soft)] p-3 text-xs font-semibold leading-5 text-[var(--warning)]">
              Referal dasturi hozir faol emas. Dastur qayta yoqilgach yuborish
              mumkin.
            </p>
          )}
          <Button
            className="mt-3.5 min-h-11 w-full"
            disabled={
              !selectedChatIds.length || prefixInvalid || !programEnabled
            }
            loading={mutation.isPending}
            onClick={() => {
              const payload =
                submittedPayload ??
                ({
                  ...selection,
                  ...(namePrefix.trim()
                    ? { namePrefix: namePrefix.trim() }
                    : {}),
                  chatIds: selectedChatIds,
                  createIdempotencyKey: createIdempotencyKey(),
                  publishIdempotencyKey: createIdempotencyKey(),
                } as BulkReferralSelection & {
                  namePrefix?: string;
                  chatIds: string[];
                  createIdempotencyKey: string;
                  publishIdempotencyKey: string;
                });
              if (!submittedPayload) setSubmittedPayload(payload);
              mutation.mutate(
                payload,
                {
                  onSuccess: () => haptic("success"),
                  onError: () => haptic("error"),
                },
              );
            }}
          >
            <Send className="h-4 w-4" />
            {mutation.isError
              ? "Xavfsiz qayta urinish"
              : selectedChatIds.length
              ? `${selectionCount} ta referalni ${selectedChatIds.length} ta chatga yuborish`
              : "Chatlarni tanlang"}
          </Button>
        </>
      )}
    </BottomSheet>
  );
}

export function MarketScreen() {
  const [categoryId, setCategoryId] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<MarketerProduct | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [wholeCategory, setWholeCategory] = useState(false);
  const [bulkSheetOpen, setBulkSheetOpen] = useState(false);

  const profileQuery = useProfile();
  const categoriesQuery = useProductCategories();
  const productsQuery = useProducts({
    search: "",
    sort: "popular",
    categoryId,
    available: true,
  });
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );
  const availableProducts = useMemo(
    () => products.filter((product) => product.isAvailable),
    [products],
  );
  const selectedCategory = categoriesQuery.data?.find(
    (category) => category.id === categoryId,
  );
  const totalProducts =
    productsQuery.data?.pages[0]?.meta.total ??
    selectedCategory?.productCount ??
    0;
  const allLoadedSelected =
    availableProducts.length > 0 &&
    availableProducts.every((product) => selectedIds.has(product.id));
  const selectionCount = wholeCategory ? totalProducts : selectedIds.size;
  const canCreateReferral =
    profileQuery.isSuccess && profileQuery.data.program.enabled;

  const loadMore = useCallback(() => {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }, [productsQuery]);
  const sentinel = useInfiniteSentinel(
    Boolean(productsQuery.hasNextPage && !productsQuery.isFetchingNextPage),
    loadMore,
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setWholeCategory(false);
  }, []);

  const leaveBulkMode = useCallback(() => {
    setBulkMode(false);
    clearSelection();
  }, [clearSelection]);

  const handleCategorySelect = useCallback(
    (nextCategoryId: string) => {
      setCategoryId(nextCategoryId);
      clearSelection();
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [clearSelection],
  );

  const toggleProduct = useCallback((product: MarketerProduct) => {
    setWholeCategory(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(product.id)) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
  }, []);

  const bulkSelection = useMemo<BulkReferralSelection | null>(() => {
    if (wholeCategory && categoryId) {
      return { categoryId, allInCategory: true };
    }
    const productIds = Array.from(selectedIds);
    return productIds.length ? { productIds } : null;
  }, [categoryId, selectedIds, wholeCategory]);

  return (
    <div className="space-y-2">
      <CategoryStrip
        categories={categoriesQuery.data ?? []}
        selectedId={categoryId}
        loading={categoriesQuery.isLoading}
        error={categoriesQuery.isError}
        onRetry={() => void categoriesQuery.refetch()}
        onSelect={handleCategorySelect}
      />

      {profileQuery.isError && (
        <Panel className="border-[var(--danger-line)] bg-[var(--danger-soft)] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-[var(--ink)]">
                Referal dasturi holati aniqlanmadi
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
                Xavfsizlik uchun referal yaratish vaqtincha yopildi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void profileQuery.refetch()}
              className="min-h-9 shrink-0 rounded-[9px] border border-[var(--danger-line)] bg-white px-2.5 text-[10px] font-extrabold text-[var(--danger)]"
            >
              Qayta urinish
            </button>
          </div>
        </Panel>
      )}

      {profileQuery.isSuccess && !profileQuery.data.program.enabled && (
        <Panel className="border-[var(--warning-line)] bg-[var(--warning-soft)] p-3">
          <p className="text-sm font-extrabold text-[var(--ink)]">
            Referal dasturi vaqtincha to&apos;xtatilgan
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
            Mahsulotlarni ko&apos;rishingiz mumkin, yangi havola yaratish esa
            boshqaruv panelidan qayta yoqilganda ochiladi.
          </p>
        </Panel>
      )}

      <section className="-mx-2.5">
        <div className="flex min-h-9 items-center justify-between gap-3 px-1">
          <p className="text-[11px] font-extrabold text-[var(--muted)]">
            {productsQuery.isLoading
              ? "Mahsulotlar yuklanmoqda"
              : `${totalProducts} ta mahsulot`}
          </p>
          {!bulkMode ? (
            <button
              type="button"
              disabled={!canCreateReferral}
              className="flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[var(--brand-line)] bg-[var(--brand-soft)] px-2.5 text-[10px] font-extrabold text-[var(--brand)] disabled:opacity-50"
              onClick={() => setBulkMode(true)}
            >
              <Layers3 className="h-3.5 w-3.5" />
              Ko&apos;p tanlash
            </button>
          ) : (
            <button
              type="button"
              className="flex min-h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[10px] font-extrabold text-[var(--muted)] active:bg-[var(--surface-muted)]"
              onClick={leaveBulkMode}
            >
              <X className="h-3.5 w-3.5" />
              Bekor qilish
            </button>
          )}
        </div>

        {bulkMode && (
          <Panel className="mx-1 mb-1.5 mt-1 bg-[var(--surface)] p-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--brand-soft)] text-[var(--brand)]">
                <PackageCheck className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-[var(--ink)]">
                  {selectionCount
                    ? `${selectionCount} ta tanlandi`
                    : "Mahsulotlarni tanlang"}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-x-2">
                  <button
                    type="button"
                    disabled={!availableProducts.length}
                    className="text-[9px] font-extrabold text-[var(--brand)] disabled:opacity-50"
                    onClick={() => {
                      setWholeCategory(false);
                      setSelectedIds(
                        allLoadedSelected
                          ? new Set()
                          : new Set(
                              availableProducts.map((product) => product.id),
                            ),
                      );
                    }}
                  >
                    {allLoadedSelected
                      ? "Yuklanganlarni tozalash"
                      : "Yuklanganlarning barchasi"}
                  </button>
                  {categoryId && (
                    <button
                      type="button"
                      className="text-[9px] font-extrabold text-[var(--brand)]"
                      onClick={() => {
                        setWholeCategory((current) => !current);
                        setSelectedIds(new Set());
                      }}
                    >
                      {wholeCategory
                        ? "Butun toifani bekor qilish"
                        : "Butun toifani tanlash"}
                    </button>
                  )}
                </div>
              </div>
              <Button
                className="min-h-9 shrink-0 rounded-[10px] px-3 text-[11px]"
                disabled={!bulkSelection || !selectionCount}
                onClick={() => setBulkSheetOpen(true)}
              >
                Davom etish
              </Button>
            </div>
          </Panel>
        )}

        <div className="mt-1">
          {productsQuery.isLoading && !products.length ? (
            <ProductGridSkeleton />
          ) : productsQuery.isError && !products.length ? (
            <ErrorState
              description={apiErrorMessage(productsQuery.error)}
              retry={() => void productsQuery.refetch()}
            />
          ) : products.length ? (
            <>
              <div className="grid grid-cols-2 gap-1">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onCreate={setSelectedProduct}
                    canCreate={canCreateReferral}
                    selectionMode={bulkMode}
                    selected={wholeCategory || selectedIds.has(product.id)}
                    onToggle={toggleProduct}
                  />
                ))}
              </div>

              <div
                ref={sentinel}
                className="mt-2 flex min-h-12 items-center justify-center px-1"
                aria-live="polite"
              >
                {productsQuery.isFetchNextPageError ? (
                  <button
                    type="button"
                    onClick={() => void productsQuery.fetchNextPage()}
                    className="min-h-10 rounded-[10px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 text-[10px] font-extrabold text-[var(--danger)]"
                  >
                    Davomini yuklab bo&apos;lmadi · Qayta urinish
                  </button>
                ) : productsQuery.hasNextPage ? (
                  <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[10px] font-bold text-[var(--muted)]">
                    {productsQuery.isFetchingNextPage ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-[var(--brand)]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[var(--brand)]" />
                    )}
                    {productsQuery.isFetchingNextPage
                      ? "Yana mahsulotlar yuklanmoqda"
                      : "Davomini yuklash uchun pastga tushing"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted-light)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    Barcha mahsulotlar ko&apos;rsatildi
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              title="Bu toifada mahsulot yo'q"
              description="Boshqa toifani tanlab ko'ring."
              icon={PackageCheck}
            />
          )}
        </div>
      </section>

      {selectedProduct && (
        <ReferralSheet
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {bulkSheetOpen && bulkSelection && (
        <BulkPublishSheet
          selection={bulkSelection}
          selectionCount={selectionCount}
          category={selectedCategory}
          programEnabled={canCreateReferral}
          onClose={() => setBulkSheetOpen(false)}
          onComplete={leaveBulkMode}
        />
      )}
    </div>
  );
}
