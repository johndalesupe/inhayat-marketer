"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { clsx } from "clsx";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  WalletCards,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as yup from "yup";
import {
  useRequestWithdrawal,
  useWallet,
  useWalletActivity,
} from "@/src/hooks/useMarketerQueries";
import { useInfiniteSentinel } from "@/src/hooks/useInfiniteSentinel";
import {
  apiErrorMessage,
  createIdempotencyKey,
} from "@/src/lib/api";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import type {
  MarketerWalletActivity,
  MarketerWithdrawalActivity,
  MarketerWithdrawalStatus,
} from "@/src/types/marketer";
import {
  BottomSheet,
  Button,
  EmptyState,
  ErrorState,
  FieldError,
  PageSkeleton,
  PageTitle,
  Panel,
  Skeleton,
  StatusChip,
  inputClass,
} from "@/src/components/ui/primitives";

const DEFAULT_MINIMUM_WITHDRAWAL = 5_000;

type ActivityFilter = "all" | "incoming" | "withdrawal";
type WithdrawalForm = {
  cardNumber: string;
  cardHolderName: string;
  amount: number;
  note: string;
};

const activityFilters: Array<{
  value: ActivityFilter;
  label: string;
}> = [
  { value: "all", label: "Barchasi" },
  { value: "incoming", label: "Kirimlar" },
  { value: "withdrawal", label: "Yechishlar" },
];

const statusConfig: Record<
  MarketerWithdrawalStatus,
  {
    label: string;
    tone: "warning" | "brand" | "success" | "danger";
    icon: typeof Clock3;
  }
> = {
  pending: { label: "Kutilmoqda", tone: "warning", icon: Clock3 },
  approved: { label: "Tasdiqlandi", tone: "brand", icon: CheckCircle2 },
  paid: { label: "To'landi", tone: "success", icon: BadgeCheck },
  canceled: { label: "Bekor qilindi", tone: "danger", icon: XCircle },
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardInput(value: string) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatMaskedCard(value?: string | null) {
  if (!value) return "Karta ko'rsatilmagan";
  if (/[•*xX]/.test(value)) return value;
  const digits = onlyDigits(value);
  if (digits.length !== 16) return value;
  return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
}

function safeProofUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function WalletHeading() {
  return (
    <PageTitle
      eyebrow="Moliya"
      title="Hamyon"
      description="Bonuslar, yechib olish so'rovlari va to'lovlar tarixi."
    />
  );
}

function BalanceMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <p className="truncate text-[9px] font-bold text-[var(--muted)]">
        {label}
      </p>
      <p
        className={clsx(
          "mt-0.5 truncate text-[12px] font-black tabular-nums",
          accent ? "text-[var(--brand)]" : "text-[var(--ink)]",
        )}
      >
        {formatMoney(value)}
      </p>
    </div>
  );
}

function WalletSummary({
  available,
  pending,
  pendingWithdrawal,
  totalPaid,
  minimum,
  canWithdraw,
  phoneVerified,
  onWithdraw,
}: {
  available: number;
  pending: number;
  pendingWithdrawal: number;
  totalPaid: number;
  minimum: number;
  canWithdraw: boolean;
  phoneVerified: boolean;
  onWithdraw: () => void;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted)]">
              <WalletCards className="h-3.5 w-3.5 text-[var(--muted)]" />
              Yechish mumkin
            </p>
            <p className="mt-1 truncate text-[26px] font-black tabular-nums tracking-[-0.045em] text-[var(--ink)]">
              {formatMoney(available)}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]">
            <Banknote className="h-4.5 w-4.5" />
          </span>
        </div>

        <Button
          className="mt-3 w-full"
          onClick={onWithdraw}
          disabled={!canWithdraw}
        >
          <ArrowUpRight className="h-4 w-4" />
          Pul yechish
        </Button>
        {!canWithdraw && (
          <p className="mt-2 text-center text-[10px] font-semibold leading-4 text-[var(--muted)]">
            {!phoneVerified
              ? "Pul yechish uchun telefon raqamingizni tasdiqlang"
              : available < minimum
                ? `So'rov yuborish uchun kamida ${formatMoney(minimum)} kerak`
                : "Hozir yangi so'rov yuborib bo'lmaydi"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--line)] border-t border-[var(--line)] bg-[var(--surface-raised)]">
        <BalanceMetric label="Kutilayotgan bonus" value={pending} />
        <BalanceMetric
          label="So'rovda"
          value={pendingWithdrawal}
          accent={pendingWithdrawal > 0}
        />
        <BalanceMetric label="Jami yechilgan" value={totalPaid} />
      </div>
    </Panel>
  );
}

function NoteBox({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <p
      className={clsx(
        "mt-2 rounded-lg border px-2.5 py-2 text-[10px] font-semibold leading-4",
        tone === "danger"
          ? "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]"
          : "border-[var(--line)] bg-[var(--surface-raised)] text-[var(--muted)]",
      )}
    >
      {children}
    </p>
  );
}

function WithdrawalDetails({
  withdrawal,
}: {
  withdrawal: MarketerWithdrawalActivity;
}) {
  const current = statusConfig[withdrawal.status];
  const CurrentIcon = current.icon;
  const currentNoteCovered = withdrawal.currentNote
    ? withdrawal.statusHistory.some(
        (event) =>
          event.status === withdrawal.status &&
          event.note === withdrawal.currentNote,
      )
    : true;
  const proofUrl = safeProofUrl(withdrawal.proofImageUrl);

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-[var(--muted)]">
        <span className="font-extrabold text-[var(--ink)]">
          {formatMaskedCard(withdrawal.cardMasked)}
        </span>
        <span aria-hidden="true">·</span>
        <span className="truncate">{withdrawal.cardHolderName}</span>
      </div>

      {(withdrawal.statusHistory.length > 0 || withdrawal.currentNote) && (
        <div className="mt-2 border-t border-[var(--line)] pt-2">
          <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--muted)]">
            <CurrentIcon className="h-3 w-3" />
            So‘rov jarayoni
          </p>
          <div className="mt-1.5 space-y-1.5">
            {withdrawal.statusHistory.map((event, index) => {
              const eventConfig = statusConfig[event.status];
              const actorLabel =
                event.actorType === "admin"
                  ? "Administrator"
                  : event.actorType === "system"
                    ? "Tizim"
                    : "Marketer";
              return (
                <div
                  key={`${event.status}-${event.at}-${index}`}
                  className="grid grid-cols-[8px_minmax(0,1fr)_auto] items-start gap-2"
                >
                  <span
                    className={clsx(
                      "mt-1.5 h-1.5 w-1.5 rounded-full",
                      event.status === "paid"
                        ? "bg-[var(--success)]"
                        : event.status === "canceled"
                          ? "bg-[var(--danger)]"
                          : event.status === "approved"
                            ? "bg-[var(--brand)]"
                            : "bg-[var(--warning)]",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-[var(--ink)]">
                      {eventConfig.label}
                      <span className="ml-1 font-semibold text-[var(--muted-light)]">
                        · {actorLabel}
                      </span>
                    </p>
                    {event.note && (
                      <p className="mt-0.5 text-[10px] font-medium leading-4 text-[var(--muted)]">
                        {event.note}
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-[8px] font-semibold text-[var(--muted-light)]">
                    {formatDateTime(event.at)}
                  </span>
                </div>
              );
            })}
            {withdrawal.currentNote && !currentNoteCovered && (
              <NoteBox
                tone={
                  withdrawal.status === "canceled" ? "danger" : "neutral"
                }
              >
                {withdrawal.currentNote}
              </NoteBox>
            )}
          </div>
        </div>
      )}

      {proofUrl && (
        <a
          href={proofUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--success-line)] bg-[var(--success-soft)] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--success-line)] bg-white text-[var(--success)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proofUrl}
              alt="To'lov dalili"
              className="h-full w-full object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-extrabold text-[var(--success)]">
              To‘lov dalili biriktirilgan
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold text-[var(--muted)]">
              To‘liq rasmni ochish
            </span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-[var(--success)]" />
        </a>
      )}
    </>
  );
}

function ActivityCard({ activity }: { activity: MarketerWalletActivity }) {
  const isWithdrawal = activity.kind === "withdrawal";
  const isCredit =
    activity.kind === "transaction" && activity.direction === "credit";
  const status = isWithdrawal
    ? statusConfig[activity.status]
    : null;
  const Icon = isWithdrawal
    ? ArrowUpRight
    : isCredit
      ? ArrowDownToLine
      : RotateCcw;

  const title = isWithdrawal
    ? "Pul yechish so'rovi"
    : activity.type === "commission"
      ? "Yetkazilgan buyurtma bonusi"
      : activity.type === "reversal"
        ? "Bonus qaytarildi"
        : activity.type === "withdrawal"
          ? "Yechish operatsiyasi"
          : "Balans tuzatishi";
  const createdAt = isWithdrawal
    ? activity.requestedAt
    : activity.createdAt;

  return (
    <Panel className="p-3.5">
      <div className="flex items-start gap-2.5">
        <span
          className={clsx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            isWithdrawal
              ? "border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]"
              : isCredit
                ? "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]"
                : "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-extrabold text-[var(--ink)]">
                {title}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold text-[var(--muted)]">
                {formatDateTime(createdAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={clsx(
                  "text-[13px] font-black tabular-nums",
                  isWithdrawal || !isCredit
                    ? "text-[var(--ink)]"
                    : "text-[var(--success)]",
                )}
              >
                {isCredit ? "+" : "−"}
                {formatMoney(activity.amount)}
              </p>
              {status && (
                <div className="mt-1 flex justify-end">
                  <StatusChip tone={status.tone}>{status.label}</StatusChip>
                </div>
              )}
            </div>
          </div>
          {activity.kind === "transaction" && activity.note && (
            <NoteBox
              tone={activity.type === "reversal" ? "danger" : "neutral"}
            >
              {activity.note}
            </NoteBox>
          )}
          {isWithdrawal && <WithdrawalDetails withdrawal={activity} />}
        </div>
      </div>
    </Panel>
  );
}

function WithdrawalSheet({
  open,
  onClose,
  availableBalance,
  minimumAmount,
}: {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
  minimumAmount: number;
}) {
  const { haptic } = useTelegram();
  const request = useRequestWithdrawal();
  const [completed, setCompleted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{
    signature: string;
    idempotencyKey: string;
  } | null>(null);
  const schema = useMemo(
    () =>
      yup.object({
        cardNumber: yup
          .string()
          .required("Karta raqamini kiriting")
          .matches(/^\d{16}$/, "Karta raqami 16 ta raqamdan iborat bo'lishi kerak"),
        cardHolderName: yup
          .string()
          .trim()
          .required("Karta egasining ism-sharifini kiriting")
          .min(2, "Ism-sharif kamida 2 ta belgidan iborat bo'lishi kerak")
          .max(80, "Ism-sharif 80 ta belgidan oshmasligi kerak")
          .matches(
            /^[\p{L}\s'ʻʼ‘’.-]+$/u,
            "Ism-sharifda faqat harflar ishlatilishi mumkin",
          ),
        amount: yup
          .number()
          .typeError("Yechish summasini kiriting")
          .integer("Summa butun son bo'lishi kerak")
          .required("Yechish summasini kiriting")
          .min(
            minimumAmount,
            `Minimal summa ${formatMoney(minimumAmount)}`,
          )
          .max(
            availableBalance,
            "Summa yechish mumkin bo'lgan balansdan oshmasligi kerak",
          ),
        note: yup
          .string()
          .trim()
          .max(500, "Izoh 500 ta belgidan oshmasligi kerak")
          .defined(),
      }),
    [availableBalance, minimumAmount],
  );
  const form = useForm<WithdrawalForm>({
    resolver: yupResolver(schema),
    mode: "onBlur",
    defaultValues: {
      cardNumber: "",
      cardHolderName: "",
      amount: minimumAmount,
      note: "",
    },
  });
  const amount = useWatch({
    control: form.control,
    name: "amount",
  });

  const resetAndClose = () => {
    if (request.isPending) return;
    request.reset();
    setCompleted(false);
    setLastSubmission(null);
    form.reset({
      cardNumber: "",
      cardHolderName: "",
      amount: minimumAmount,
      note: "",
    });
    onClose();
  };

  const submit = (values: WithdrawalForm) => {
    const normalized = {
      amount: Math.round(values.amount),
      cardNumber: onlyDigits(values.cardNumber),
      cardHolderName: values.cardHolderName.trim().replace(/\s+/g, " "),
      ...(values.note.trim() ? { note: values.note.trim() } : {}),
    };
    const signature = JSON.stringify(normalized);
    const submission =
      lastSubmission?.signature === signature
        ? lastSubmission
        : {
            signature,
            idempotencyKey: createIdempotencyKey(),
          };
    if (lastSubmission !== submission) {
      setLastSubmission(submission);
    }
    request.mutate(
      {
        ...normalized,
        idempotencyKey: submission.idempotencyKey,
      },
      {
        onSuccess: () => {
          haptic("success");
          setCompleted(true);
          setLastSubmission(null);
        },
        onError: () => haptic("error"),
      },
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={resetAndClose}
      title={completed ? "So'rov yuborildi" : "Pul yechish"}
      description={
        completed
          ? "So'rov holatini hamyon tarixida kuzatishingiz mumkin."
          : `Mavjud balans: ${formatMoney(availableBalance)}`
      }
    >
      {completed ? (
        <div className="pb-1 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]">
            <BadgeCheck className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-[15px] font-extrabold text-[var(--ink)]">
            So‘rov qabul qilindi
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-5 text-[var(--muted)]">
            Operator so‘rovni tekshiradi. Har bir o‘zgarish va operator izohi
            tarixda ko‘rinadi.
          </p>
          <Button className="mt-5 w-full" onClick={resetAndClose}>
            Tayyor
          </Button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <div>
            <label
              htmlFor="withdrawal-card"
              className="text-[11px] font-extrabold text-[var(--ink)]"
            >
              Karta raqami
            </label>
            <Controller
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <div className="relative mt-1.5">
                  <input
                    id="withdrawal-card"
                    ref={field.ref}
                    name={field.name}
                    value={formatCardInput(field.value)}
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      field.onChange(onlyDigits(event.target.value).slice(0, 16))
                    }
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="8600 0000 0000 0000"
                    aria-invalid={Boolean(form.formState.errors.cardNumber)}
                    className={clsx(inputClass, "pr-10 tabular-nums")}
                  />
                  <ShieldCheck className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-light)]" />
                </div>
              )}
            />
            <FieldError message={form.formState.errors.cardNumber?.message} />
            <p className="mt-1.5 text-[9px] font-medium leading-4 text-[var(--muted)]">
              16 raqamni kiriting. Tarixda karta raqami xavfsiz maskalanadi.
            </p>
          </div>

          <div className="mt-3.5">
            <label
              htmlFor="withdrawal-owner"
              className="text-[11px] font-extrabold text-[var(--ink)]"
            >
              Karta egasining ism-sharifi
            </label>
            <input
              id="withdrawal-owner"
              autoComplete="cc-name"
              placeholder="ALIYEV ALISHER"
              aria-invalid={Boolean(form.formState.errors.cardHolderName)}
              className={clsx(inputClass, "mt-1.5 uppercase")}
              {...form.register("cardHolderName")}
            />
            <FieldError
              message={form.formState.errors.cardHolderName?.message}
            />
          </div>

          <div className="mt-3.5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="withdrawal-amount"
                className="text-[11px] font-extrabold text-[var(--ink)]"
              >
                Yechish summasi
              </label>
              <span className="text-[9px] font-semibold text-[var(--muted)]">
                Min. {formatMoney(minimumAmount)}
              </span>
            </div>
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <div className="relative mt-1.5">
                  <input
                    id="withdrawal-amount"
                    ref={field.ref}
                    name={field.name}
                    value={field.value ? String(field.value) : ""}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      const value = onlyDigits(event.target.value).slice(0, 12);
                      field.onChange(value ? Number(value) : 0);
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={String(minimumAmount)}
                    aria-invalid={Boolean(form.formState.errors.amount)}
                    className={clsx(
                      inputClass,
                      "pr-16 text-lg font-black tabular-nums",
                    )}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[var(--muted)]">
                    so‘m
                  </span>
                </div>
              )}
            />
            <FieldError message={form.formState.errors.amount?.message} />
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  form.setValue("amount", minimumAmount, {
                    shouldValidate: true,
                  })
                }
                className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] text-[10px] font-extrabold text-[var(--muted)] active:bg-[var(--surface-muted)]"
              >
                Minimal
              </button>
              <button
                type="button"
                onClick={() =>
                  form.setValue(
                    "amount",
                    Math.max(
                      minimumAmount,
                      Math.floor(availableBalance / 2),
                    ),
                    { shouldValidate: true },
                  )
                }
                className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] text-[10px] font-extrabold text-[var(--muted)] active:bg-[var(--surface-muted)]"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() =>
                  form.setValue("amount", availableBalance, {
                    shouldValidate: true,
                  })
                }
                className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] text-[10px] font-extrabold text-[var(--brand)] active:bg-[var(--brand-soft)]"
              >
                Hammasi
              </button>
            </div>
          </div>

          <div className="mt-3.5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="withdrawal-note"
                className="text-[11px] font-extrabold text-[var(--ink)]"
              >
                So‘rov izohi
              </label>
              <span className="text-[9px] font-semibold text-[var(--muted)]">
                Ixtiyoriy
              </span>
            </div>
            <textarea
              id="withdrawal-note"
              rows={3}
              maxLength={500}
              placeholder="Operator uchun zarur izohni yozing"
              aria-invalid={Boolean(form.formState.errors.note)}
              className={clsx(
                inputClass,
                "mt-1.5 h-auto min-h-20 resize-none py-2.5 leading-5",
              )}
              {...form.register("note")}
            />
            <FieldError message={form.formState.errors.note?.message} />
          </div>

          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold text-[var(--muted)]">
                Yechish summasi
              </span>
              <span className="text-[13px] font-black tabular-nums text-[var(--ink)]">
                {formatMoney(Number(amount) || 0)}
              </span>
            </div>
            <p className="mt-2 border-t border-[var(--line)] pt-2 text-[9px] font-medium leading-4 text-[var(--muted)]">
              Tasdiqlangach mablag‘ operator tekshiruvi uchun band qilinadi.
              Karta ma’lumotlarini yuborishdan oldin tekshiring.
            </p>
          </div>

          {request.isError && (
            <NoteBox tone="danger">
              {apiErrorMessage(
                request.error,
                "Pul yechish so'rovi yuborilmadi",
              )}
            </NoteBox>
          )}

          <Button
            type="submit"
            className="mt-4 w-full"
            loading={request.isPending}
          >
            <ReceiptText className="h-4 w-4" />
            So‘rov yuborish
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Panel key={index} className="flex gap-2.5 p-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function WalletScreen() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const walletQuery = useWallet();
  const activityQuery = useWalletActivity();
  const allActivities = useMemo(
    () => activityQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activityQuery.data],
  );
  const activities = useMemo(
    () =>
      allActivities.filter((activity) => {
        if (filter === "all") return true;
        if (filter === "withdrawal") return activity.kind === "withdrawal";
        return (
          activity.kind === "transaction" &&
          activity.direction === "credit"
        );
      }),
    [allActivities, filter],
  );
  const loadMore = useCallback(() => {
    if (activityQuery.hasNextPage && !activityQuery.isFetchingNextPage) {
      void activityQuery.fetchNextPage();
    }
  }, [activityQuery]);
  const sentinelRef = useInfiniteSentinel(
    Boolean(activityQuery.hasNextPage) &&
      !activityQuery.isFetchingNextPage,
    loadMore,
  );

  if (walletQuery.isLoading) return <PageSkeleton />;
  if (walletQuery.isError || !walletQuery.data) {
    return (
      <div className="space-y-3">
        <WalletHeading />
        <ErrorState
          description={apiErrorMessage(walletQuery.error)}
          retry={() => void walletQuery.refetch()}
        />
      </div>
    );
  }

  const wallet = walletQuery.data;
  const minimum = Math.max(
    DEFAULT_MINIMUM_WITHDRAWAL,
    wallet.minimumWithdrawalAmount || 0,
  );

  return (
    <div className="space-y-3">
      <WalletHeading />
      <WalletSummary
        available={wallet.availableBalance}
        pending={wallet.pendingBalance}
        pendingWithdrawal={wallet.heldBalance}
        totalPaid={wallet.totalWithdrawn}
        minimum={minimum}
        canWithdraw={wallet.canWithdraw}
        phoneVerified={wallet.phoneVerified}
        onWithdraw={() => setWithdrawalOpen(true)}
      />

      {!wallet.phoneVerified && (
        <Panel className="border-[var(--warning-line)] bg-[var(--warning-soft)] p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--warning-line)] bg-white text-[var(--warning)]">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-extrabold text-[var(--ink)]">
                Telefon raqamini tasdiqlang
              </p>
              <p className="mt-0.5 text-[9px] font-medium leading-4 text-[var(--muted)]">
                Pul yechish so‘rovi faqat tasdiqlangan hisobdan yuboriladi.
              </p>
            </div>
            <Link
              href="/account"
              className="shrink-0 rounded-lg border border-[var(--warning-line)] bg-white px-2.5 py-2 text-[10px] font-extrabold text-[var(--warning)]"
            >
              Tasdiqlash
            </Link>
          </div>
        </Panel>
      )}

      <section>
        <div className="mb-2 flex items-end justify-between gap-3 px-0.5">
          <div>
            <h2 className="text-[15px] font-extrabold text-[var(--ink)]">
              Amaliyotlar
            </h2>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">
              Kirimlar va yechish so‘rovlari
            </p>
          </div>
          <ImageIcon className="h-4 w-4 text-[var(--muted-light)]" />
        </div>

        <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-1">
          {activityFilters.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={clsx(
                "h-8 rounded-lg border text-[10px] font-extrabold transition",
                filter === item.value
                  ? "border-[var(--line)] bg-white text-[var(--ink)]"
                  : "border-transparent text-[var(--muted)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {activityQuery.isLoading ? (
          <ActivitySkeleton />
        ) : activityQuery.isError ? (
          <ErrorState
            description={apiErrorMessage(activityQuery.error)}
            retry={() => void activityQuery.refetch()}
          />
        ) : activities.length ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityCard
                key={`${activity.kind}-${activity.id}`}
                activity={activity}
              />
            ))}
            <div ref={sentinelRef} className="flex min-h-10 justify-center py-2">
              {activityQuery.isFetchingNextPage && (
                <span className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted)]">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Tarix yuklanmoqda
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <EmptyState
              icon={ReceiptText}
              title="Amaliyotlar hali yo'q"
              description="Yetkazilgan buyurtmalar bonusi va pul yechish so'rovlari shu yerda ko'rinadi."
            />
            <div
              ref={sentinelRef}
              className="flex min-h-10 justify-center py-2"
            >
              {activityQuery.isFetchingNextPage && (
                <LoaderCircle className="h-4 w-4 animate-spin text-[var(--muted)]" />
              )}
            </div>
          </div>
        )}
      </section>

      <WithdrawalSheet
        open={withdrawalOpen}
        onClose={() => setWithdrawalOpen(false)}
        availableBalance={wallet.availableBalance}
        minimumAmount={minimum}
      />
    </div>
  );
}
