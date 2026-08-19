"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { clsx } from "clsx";
import {
  Check,
  Clipboard,
  Globe2,
  Link2,
  MapPin,
  MessageCircleMore,
  MessageSquareLock,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { ProductImage } from "@/src/components/ui/ProductImage";
import {
  BottomSheet,
  Button,
  FieldError,
  inputClass,
} from "@/src/components/ui/primitives";
import {
  useCreateReferral,
  useEnsureReferralStreamLink,
} from "@/src/hooks/useMarketerQueries";
import { apiErrorMessage, createIdempotencyKey } from "@/src/lib/api";
import { formatMoney } from "@/src/lib/format";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import type { MarketerProduct, MarketerReferral } from "@/src/types/marketer";

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .min(3, "Nom kamida 3 ta belgidan iborat bo'lsin")
    .max(80, "Nom 80 ta belgidan oshmasin")
    .required("Referal nomini kiriting"),
  destination: yup
    .mixed<"miniapp" | "web" | "form">()
    .oneOf(["miniapp", "web", "form"])
    .required(),
  formAuthentication: yup
    .mixed<"otp" | "none">()
    .oneOf(["otp", "none"])
    .required(),
  showAddressFields: yup.boolean().required(),
});

type ReferralForm = yup.InferType<typeof schema>;

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

function compactUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

export function CreateReferralSheet({
  product,
  onClose,
}: {
  product: MarketerProduct | null;
  onClose: () => void;
}) {
  const createMutation = useCreateReferral();
  const streamMutation = useEnsureReferralStreamLink();
  const { haptic, openTelegramLink } = useTelegram();
  const [referral, setReferral] = useState<MarketerReferral | null>(null);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState("");
  const [idempotencyKey] = useState(createIdempotencyKey);
  const form = useForm<ReferralForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: product ? `${product.nameUz} uchun havola` : "",
      destination: "miniapp",
      formAuthentication: "otp",
      showAddressFields: true,
    },
  });
  const destination = useWatch({ control: form.control, name: "destination" });
  const authentication = useWatch({
    control: form.control,
    name: "formAuthentication",
  });
  const showAddressFields = useWatch({
    control: form.control,
    name: "showAddressFields",
  });

  const links = useMemo(() => {
    if (!referral) return [];
    return [
      {
        key: "miniapp",
        label: "Mini App",
        caption: "Telegram ichida ochiladi",
        icon: Send,
        url: referral.links.miniapp,
      },
      {
        key: "web",
        label: "Web sayt",
        caption: "Istalgan brauzerda ochiladi",
        icon: Globe2,
        url: referral.links.web,
      },
      {
        key: "stream",
        label: "Tezkor forma",
        caption: "Lead yig'ish uchun qisqa yo'l",
        icon: Workflow,
        url: referral.links.stream ?? referral.links.form ?? "",
      },
    ];
  }, [referral]);

  if (!product) return null;

  const close = () => {
    form.reset();
    createMutation.reset();
    streamMutation.reset();
    setReferral(null);
    setSelectedUrl("");
    setCopiedUrl("");
    onClose();
  };

  const handleCopy = async (url: string) => {
    try {
      await copyText(url);
      setCopiedUrl(url);
      setSelectedUrl(url);
      haptic("success");
    } catch {
      haptic("error");
    }
  };

  return (
    <BottomSheet
      open
      onClose={close}
      title={referral ? "Referal tayyor" : "Referal yaratish"}
      description={
        referral
          ? "Kanalga mos havolani tanlang, nusxalang yoki Telegram orqali ulashing."
          : "Har bir kanalni alohida nomlang — natijalarni solishtirish oson bo'ladi."
      }
    >
      {!referral ? (
        <>
          <div className="flex items-center gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-raised)] p-3">
            <ProductImage
              src={product.thumbnailUrl}
              alt={product.nameUz}
              className="h-[72px] w-14 shrink-0 rounded-[6px] border border-[var(--line)]"
              sizes="56px"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-extrabold leading-[18px] text-[var(--ink)]">
                {product.nameUz}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-[var(--muted)]">
                  Yetkazilgan buyurtmadan
                </span>
                <strong className="shrink-0 text-xs text-[var(--brand)]">
                  +{formatMoney(product.expectedBonus)}
                </strong>
              </div>
            </div>
          </div>

          <form
            className="mt-4"
            onSubmit={form.handleSubmit((values) => {
              createMutation.mutate(
                {
                  name: values.name.trim(),
                  productId: product.id,
                  idempotencyKey,
                  destination: values.destination,
                  formAuthentication: values.formAuthentication,
                  showAddressFields: values.showAddressFields,
                },
                {
                  onSuccess: (created) => {
                    setReferral(created);
                    setSelectedUrl(created.link);
                    haptic("success");
                  },
                  onError: () => haptic("error"),
                },
              );
            })}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[var(--ink)]">
                Kampaniya nomi
              </span>
              <input
                {...form.register("name")}
                className={inputClass}
                placeholder="Masalan: Telegram — avgust"
                autoComplete="off"
              />
              <FieldError message={form.formState.errors.name?.message} />
            </label>

            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-bold text-[var(--ink)]">
                Asosiy havola
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["miniapp", "Mini App", Send],
                    ["web", "Web sayt", Globe2],
                    ["form", "Tezkor", Workflow],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={destination === value}
                    onClick={() => form.setValue("destination", value)}
                    className={clsx(
                      "flex min-h-[66px] flex-col items-center justify-center gap-1.5 rounded-[7px] border px-2 text-[10px] font-extrabold transition",
                      destination === value
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
              <legend className="sr-only">Oqim formasi sozlamalari</legend>
              <div className="flex items-start gap-2.5 border-b border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
                <div>
                  <p className="text-[11px] font-extrabold text-[var(--ink)]">
                    Oqim formasi
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium leading-4 text-[var(--muted)]">
                    Bu sozlamalar Oqim havolasida darhol qo&apos;llanadi.
                  </p>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-start gap-2.5">
                  <MessageSquareLock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold text-[var(--ink)]">
                      Telefonni tasdiqlash
                    </p>
                    <p className="mt-0.5 text-[9px] leading-4 text-[var(--muted)]">
                      SMS yoqilsa, buyurtma faqat 6 xonali koddan keyin
                      tasdiqlanadi.
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ["otp", "SMS bilan"],
                      ["none", "SMSsiz"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={authentication === value}
                      onClick={() =>
                        form.setValue("formAuthentication", value, {
                          shouldDirty: true,
                        })
                      }
                      className={clsx(
                        "min-h-10 rounded-[6px] border px-2 text-[10px] font-extrabold transition",
                        authentication === value
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "border-[var(--line)] text-[var(--muted)]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--line)] p-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold text-[var(--ink)]">
                      Manzil va yetkazish tanlovi
                    </p>
                    <p className="mt-0.5 text-[9px] leading-4 text-[var(--muted)]">
                      O&apos;chirilsa, manzil, hudud va yetkazish usuli umuman
                      ko&apos;rinmaydi.
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(
                    [
                      [true, "Ko'rsatish"],
                      [false, "Yashirish"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={showAddressFields === value}
                      onClick={() =>
                        form.setValue("showAddressFields", value, {
                          shouldDirty: true,
                        })
                      }
                      className={clsx(
                        "min-h-10 rounded-[6px] border px-2 text-[10px] font-extrabold transition",
                        showAddressFields === value
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "border-[var(--line)] text-[var(--muted)]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            {createMutation.isError && (
              <p className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
                {apiErrorMessage(
                  createMutation.error,
                  "Referalni yaratib bo'lmadi",
                )}
              </p>
            )}

            <Button
              type="submit"
              loading={createMutation.isPending}
              className="mt-4 w-full"
            >
              <Sparkles className="h-4 w-4" />
              Referalni yaratish
            </Button>
          </form>
        </>
      ) : (
        <div>
          <div className="rounded-[16px] border border-[var(--brand-line)] bg-[var(--brand-soft)] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white">
                <Check className="h-4 w-4 stroke-[3]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[var(--ink)]">
                  {referral.name}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-[var(--muted)]">
                  Foyda buyurtma yetkazilgach balansga tushadi.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3 border-t border-[var(--brand-line)] pt-3">
              <span className="text-[10px] font-bold text-[var(--muted)]">
                Kutilayotgan foyda
              </span>
              <strong className="text-base text-[var(--brand)]">
                +{formatMoney(referral.expectedBonus)}
              </strong>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {links.map(({ key, label, caption, icon: Icon, url }) => (
              <div
                key={key}
                className={clsx(
                  "flex items-center gap-1.5 rounded-[14px] border p-1.5 transition",
                  url && selectedUrl === url
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-[var(--line)] bg-[var(--surface)]",
                )}
              >
                <button
                  type="button"
                  disabled={
                    (!url && key !== "stream") ||
                    (key === "stream" && streamMutation.isPending)
                  }
                  aria-pressed={Boolean(url && selectedUrl === url)}
                  onClick={() => {
                    if (url) {
                      setSelectedUrl(url);
                      haptic("light");
                      return;
                    }
                    if (key === "stream") {
                      streamMutation.mutate(referral.id, {
                        onSuccess: (updated) => {
                          const streamUrl =
                            updated.links.stream ?? updated.links.form ?? "";
                          setReferral(updated);
                          setSelectedUrl(streamUrl);
                          haptic("success");
                        },
                        onError: () => haptic("error"),
                      });
                    }
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-[10px] p-1.5 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold text-[var(--ink)]">
                      {label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] font-medium text-[var(--muted)]">
                      {url ? compactUrl(url) : caption}
                    </span>
                  </span>
                  {!url && (
                    <span className="shrink-0 text-[10px] font-extrabold text-[var(--brand)]">
                      {streamMutation.isPending
                        ? "Tayyorlanmoqda"
                        : "Tayyorlash"}
                    </span>
                  )}
                </button>
                {url ? (
                  <button
                    type="button"
                    aria-label={`${label} havolasini nusxalash`}
                    onClick={() => void handleCopy(url)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                  >
                    {copiedUrl === url ? (
                      <Check className="h-4 w-4 text-[var(--brand)]" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {streamMutation.isError && (
            <p className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
              {apiErrorMessage(
                streamMutation.error,
                "Tezkor havolani tayyorlab bo'lmadi",
              )}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={!selectedUrl}
              onClick={() => void handleCopy(selectedUrl)}
            >
              <Link2 className="h-4 w-4" />
              Nusxalash
            </Button>
            <Button
              disabled={!selectedUrl}
              onClick={() => {
                openTelegramLink(
                  `https://t.me/share/url?url=${encodeURIComponent(
                    selectedUrl,
                  )}&text=${encodeURIComponent(product.nameUz)}`,
                );
                haptic("light");
              }}
            >
              <MessageCircleMore className="h-4 w-4" />
              Ulashish
            </Button>
          </div>
          <Button variant="ghost" className="mt-2 w-full" onClick={close}>
            Tayyor
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
