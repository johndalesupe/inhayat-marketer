"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  BadgeCheck,
  Bot,
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  PackageSearch,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PhoneInput from "react-phone-number-input";
import OtpInput from "react-otp-input";
import * as yup from "yup";
import { marketerApi, apiErrorMessage } from "@/src/lib/api";
import { marketerKeys } from "@/src/lib/query-keys";
import { useProfile } from "@/src/hooks/useMarketerQueries";
import { formatDate, formatMoney, initials } from "@/src/lib/format";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setProfile } from "@/src/store/session-slice";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import {
  BottomSheet,
  Button,
  ErrorState,
  FieldError,
  PageSkeleton,
  PageTitle,
  Panel,
  StatusChip,
} from "@/src/components/ui/primitives";

const phoneSchema = yup.object({
  phoneNumber: yup
    .string()
    .required("Telefon raqamini kiriting")
    .matches(/^\+998\d{9}$/, "O'zbekiston raqamini to'liq kiriting"),
});
const otpSchema = yup.object({
  code: yup
    .string()
    .required("Tasdiqlash kodini kiriting")
    .matches(/^\d{4,8}$/, "Kod 4–8 ta raqamdan iborat"),
});
type PhoneForm = yup.InferType<typeof phoneSchema>;
type OtpForm = yup.InferType<typeof otpSchema>;

function AccountHeading() {
  return (
    <PageTitle
      eyebrow="Shaxsiy kabinet"
      title="Hisob"
      description="Profil, hamyon va marketer vositalarini boshqaring."
    />
  );
}

function maskedPhone(value: string) {
  if (value.includes("*")) return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `+${digits.slice(0, 3)} ** *** ** ${digits.slice(-2)}`;
}

function PhoneVerificationSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { haptic } = useTelegram();
  const [phase, setPhase] = useState<"phone" | "otp" | "done">("phone");
  const [submittedPhoneNumber, setSubmittedPhoneNumber] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const phoneForm = useForm<PhoneForm>({
    resolver: yupResolver(phoneSchema),
    defaultValues: { phoneNumber: "+998" },
  });
  const otpForm = useForm<OtpForm>({
    resolver: yupResolver(otpSchema),
    defaultValues: { code: "" },
  });
  const requestOtp = useMutation({
    mutationFn: marketerApi.requestPhoneOtp,
    onSuccess: (response, submittedPhone) => {
      setSubmittedPhoneNumber(submittedPhone);
      setPhoneDisplay(maskedPhone(response.phoneNumber || submittedPhone));
      setResendIn(response.resendAfterSeconds);
      setPhase("otp");
      haptic("success");
    },
    onError: () => haptic("error"),
  });
  const verifyOtp = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      marketerApi.verifyPhoneOtp(phone, code),
    onSuccess: (profile) => {
      dispatch(setProfile(profile));
      queryClient.setQueryData(marketerKeys.profile, profile);
      setPhase("done");
      haptic("success");
    },
    onError: () => haptic("error"),
  });

  useEffect(() => {
    if (!open || resendIn <= 0) return;
    const timer = window.setInterval(
      () => setResendIn((value) => Math.max(0, value - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [open, resendIn]);

  const close = () => {
    setPhase("phone");
    setSubmittedPhoneNumber("");
    setPhoneDisplay("");
    setResendIn(0);
    requestOtp.reset();
    verifyOtp.reset();
    phoneForm.reset({ phoneNumber: "+998" });
    otpForm.reset({ code: "" });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={
        phase === "done"
          ? "Raqam tasdiqlandi"
          : phase === "otp"
            ? "SMS kodni kiriting"
            : "Telefon raqamini tasdiqlash"
      }
      description={
        phase === "phone"
          ? "Hamyon amaliyotlari va xavfsizlik xabarlari uchun kerak."
          : phase === "otp"
            ? `${phoneDisplay} raqamiga yuborilgan kodni kiriting.`
            : undefined
      }
    >
      {phase === "phone" && (
        <form
          onSubmit={phoneForm.handleSubmit((values) =>
            requestOtp.mutate(values.phoneNumber),
          )}
        >
          <Controller
            control={phoneForm.control}
            name="phoneNumber"
            render={({ field }) => (
              <PhoneInput
                international
                defaultCountry="UZ"
                countryCallingCodeEditable={false}
                className="rounded-xl border-[var(--line-strong)] bg-white focus-within:border-[var(--brand)]"
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
                onBlur={field.onBlur}
                placeholder="+998 90 123 45 67"
              />
            )}
          />
          <FieldError message={phoneForm.formState.errors.phoneNumber?.message} />
          {requestOtp.isError && (
            <p className="mt-3 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] p-2.5 text-xs font-semibold text-[var(--danger)]">
              {apiErrorMessage(requestOtp.error, "SMS kod yuborilmadi")}
            </p>
          )}
          <Button
            type="submit"
            className="mt-4 w-full"
            loading={requestOtp.isPending}
          >
            <Send className="h-4 w-4" />
            Tasdiqlash kodini olish
          </Button>
        </form>
      )}

      {phase === "otp" && (
        <form
          onSubmit={otpForm.handleSubmit((values) =>
            verifyOtp.mutate({
              phone: submittedPhoneNumber,
              code: values.code,
            }),
          )}
        >
          <Controller
            control={otpForm.control}
            name="code"
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                numInputs={6}
                inputType="tel"
                shouldAutoFocus
                containerStyle="grid grid-cols-6 gap-2"
                inputStyle={{
                  width: "100%",
                  height: "46px",
                  border: "1px solid #d0d5dd",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "#101828",
                  fontSize: "17px",
                  fontWeight: 800,
                  outline: "none",
                }}
                renderInput={(props) => (
                  <input
                    {...props}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    aria-label="SMS kod raqami"
                  />
                )}
              />
            )}
          />
          <FieldError message={otpForm.formState.errors.code?.message} />
          {verifyOtp.isError && (
            <p className="mt-3 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] p-2.5 text-xs font-semibold text-[var(--danger)]">
              {apiErrorMessage(verifyOtp.error, "Kod tasdiqlanmadi")}
            </p>
          )}
          <Button
            type="submit"
            className="mt-4 w-full"
            loading={verifyOtp.isPending}
          >
            <ShieldCheck className="h-4 w-4" />
            Raqamni tasdiqlash
          </Button>
          <button
            type="button"
            disabled={resendIn > 0 || requestOtp.isPending}
            onClick={() => requestOtp.mutate(submittedPhoneNumber)}
            className="mt-2 h-10 w-full text-xs font-extrabold text-[var(--brand)] disabled:text-[var(--muted)]"
          >
            {resendIn > 0
              ? `Qayta yuborish ${resendIn} soniyadan keyin`
              : "Kodni qayta yuborish"}
          </button>
        </form>
      )}

      {phase === "done" && (
        <div className="py-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]">
            <BadgeCheck className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[var(--muted)]">
            {phoneDisplay}
          </p>
          <Button className="mt-5 w-full" onClick={close}>
            Tayyor
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}

function AccountLink({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: typeof Bot;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 border-b border-[var(--line)] px-3 py-3 last:border-0 active:bg-[var(--surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13px] font-extrabold text-[var(--ink)]">
          {title}
          {badge && <StatusChip tone="warning">{badge}</StatusChip>}
        </span>
        <span className="mt-0.5 block text-[10px] font-medium leading-4 text-[var(--muted)]">
          {description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-light)]" />
    </Link>
  );
}

export function AccountScreen() {
  const [phoneOpen, setPhoneOpen] = useState(false);
  const sessionProfile = useAppSelector((state) => state.session.profile);
  const query = useProfile();
  const { openTelegramLink } = useTelegram();
  const profile = query.data ?? sessionProfile;
  const supportUrl =
    process.env.NEXT_PUBLIC_MARKETER_SUPPORT_URL ?? "https://t.me/inhayat";

  if (query.isLoading && !profile) return <PageSkeleton />;
  if (query.isError && !profile) {
    return (
      <div className="space-y-3">
        <AccountHeading />
        <ErrorState
          description={apiErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="space-y-3">
      <AccountHeading />

      <Panel className="rounded-2xl p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-sm font-black text-[var(--brand)]">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.firstName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(profile.firstName, profile.lastName) || (
                <UserRound className="h-5 w-5" />
              )
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-black text-[var(--ink)]">
              {profile.firstName} {profile.lastName ?? ""}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[var(--muted)]">
              {profile.username ? `@${profile.username}` : "Telegram marketer"}
            </p>
            <div className="mt-1">
              <span className="inline-flex min-h-5 items-center rounded-full border border-[var(--brand-line)] bg-[var(--brand-soft)] px-2 text-[9px] font-extrabold text-[var(--brand)]">
                {formatDate(profile.joinedAt)} dan beri
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden rounded-2xl border-[var(--brand-line)]">
        <div className="flex items-start justify-between gap-3 p-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--muted)]">
              <WalletCards className="h-3.5 w-3.5 text-[var(--brand)]" />
              Marketer hamyoni
            </div>
            <p className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[var(--ink)]">
              {formatMoney(profile.wallet.availableBalance)}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
            <WalletCards className="h-4 w-4" />
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-[var(--line)] border-t border-[var(--line)] bg-[var(--surface-raised)]">
          <div className="px-3 py-2.5">
            <p className="text-[9px] font-bold text-[var(--muted)]">
              Kutilayotgan bonus
            </p>
            <p className="mt-0.5 text-xs font-black text-[var(--ink)]">
              {formatMoney(profile.wallet.pendingBalance)}
            </p>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[9px] font-bold text-[var(--muted)]">
              Jami yechilgan
            </p>
            <p className="mt-0.5 text-xs font-black text-[var(--ink)]">
              {formatMoney(profile.wallet.totalPaid)}
            </p>
          </div>
        </div>
      </Panel>

      {!profile.phoneVerified && (
        <button
          type="button"
          onClick={() => setPhoneOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-2xl border border-[var(--warning-line)] bg-[var(--warning-soft)] p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--warning-line)] bg-[var(--surface)] text-[var(--warning)]">
            <Phone className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-extrabold text-[var(--ink)]">
              Telefon raqamini tasdiqlang
            </span>
            <span className="mt-0.5 block text-[10px] font-medium leading-4 text-[var(--muted)]">
              Hamyon xavfsizligi va muhim xabarlar uchun
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-[var(--warning)]" />
        </button>
      )}

      <Panel className="overflow-hidden rounded-2xl">
        <AccountLink
          href="/account/bot"
          icon={Bot}
          title="Mening botim"
          description="Bot, kanal va guruh ulanishlarini boshqarish"
        />
        <AccountLink
          href="/account/orders"
          icon={PackageSearch}
          title="Buyurtmalarim"
          description="Referallardan kelgan maxfiylikka mos buyurtmalar"
        />
      </Panel>

      <Panel className="overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => openTelegramLink(supportUrl)}
          className="flex w-full items-center gap-2.5 border-b border-[var(--line)] px-3 py-3 text-left active:bg-[var(--surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]">
            <CircleHelp className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-extrabold text-[var(--ink)]">
              Yordam markazi
            </span>
            <span className="mt-0.5 block text-[10px] font-medium leading-4 text-[var(--muted)]">
              Operator bilan Telegram orqali bog’lanish
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-[var(--muted-light)]" />
        </button>
        <div className="flex items-center gap-2.5 px-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]">
            <LockKeyhole className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-extrabold text-[var(--ink)]">
              Xavfsiz sessiya
            </p>
            <p className="mt-0.5 text-[10px] font-medium leading-4 text-[var(--muted)]">
              Hisob faqat tasdiqlangan Telegram sessiyasida ishlaydi
            </p>
          </div>
        </div>
      </Panel>

      <PhoneVerificationSheet
        open={phoneOpen}
        onClose={() => setPhoneOpen(false)}
      />
    </div>
  );
}
