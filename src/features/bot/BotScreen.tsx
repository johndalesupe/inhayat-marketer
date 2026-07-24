"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertTriangle,
  Bot,
  Check,
  CircleStop,
  KeyRound,
  Megaphone,
  Pencil,
  Play,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import {
  useBot,
  useBotAction,
  useBotChats,
  useConnectBot,
  useRemoveBot,
  useUpdateBot,
} from "@/src/hooks/useMarketerQueries";
import { apiErrorMessage } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/format";
import type {
  MarketerBot,
  MarketerBotChat,
  MarketerBotStatus,
} from "@/src/types/marketer";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import {
  BottomSheet,
  Button,
  EmptyState,
  ErrorState,
  FieldError,
  PageSkeleton,
  PageTitle,
  Panel,
  SectionHeading,
  Skeleton,
  StatusChip,
  inputClass,
} from "@/src/components/ui/primitives";

const tokenRule = /^\d{6,14}:[A-Za-z0-9_-]{30,}$/;
const connectSchema = yup.object({
  token: yup
    .string()
    .trim()
    .required("Bot tokenini kiriting")
    .matches(tokenRule, "BotFather bergan token formatini tekshiring"),
  label: yup
    .string()
    .trim()
    .max(50, "Nom 50 ta belgidan oshmasin")
    .default(""),
});
const updateSchema = yup.object({
  label: yup
    .string()
    .trim()
    .max(50, "Nom 50 ta belgidan oshmasin")
    .required("Ichki nomni kiriting"),
  token: yup
    .string()
    .trim()
    .test(
      "token-format",
      "Yangi token formatini tekshiring",
      (value) => !value || tokenRule.test(value),
    )
    .default(""),
});
type ConnectForm = yup.InferType<typeof connectSchema>;
type UpdateForm = yup.InferType<typeof updateSchema>;

function botStatus(status: MarketerBotStatus) {
  const map: Record<
    MarketerBotStatus,
    { label: string; tone: "neutral" | "warning" | "danger" | "success" }
  > = {
    not_connected: { label: "Ulanmagan", tone: "neutral" },
    connecting: { label: "Ulanmoqda", tone: "warning" },
    running: { label: "Ishlamoqda", tone: "success" },
    stopped: { label: "To'xtatilgan", tone: "neutral" },
    error: { label: "Xatolik", tone: "danger" },
  };
  return map[status];
}

function ConnectBotForm() {
  const mutation = useConnectBot();
  const { haptic } = useTelegram();
  const form = useForm<ConnectForm>({
    resolver: yupResolver(connectSchema),
    defaultValues: { token: "", label: "" },
  });
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-[var(--line)] bg-[var(--surface-raised)] p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-line)] bg-[var(--surface)] text-[var(--brand)]">
          <Bot className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-black tracking-[-0.01em] text-[var(--ink)]">
            Shaxsiy botni ulang
          </h2>
          <p className="mt-1 text-[11px] font-medium leading-[18px] text-[var(--muted)]">
            @BotFather tokeni serverda shifrlanadi. Token qayta ko’rsatilmaydi
            va har bir marketer faqat bitta bot ulashi mumkin.
          </p>
        </div>
      </div>
      <form
        className="space-y-3.5 p-4"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(
            {
              token: values.token.trim(),
              label: values.label?.trim() || undefined,
            },
            {
              onSuccess: () => {
                form.reset({ token: "", label: "" });
                haptic("success");
              },
              onError: () => haptic("error"),
            },
          ),
        )}
      >
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-extrabold text-[var(--ink)]">
            Bot tokeni
          </span>
          <input
            {...form.register("token")}
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            className={inputClass}
            placeholder="123456789:AA..."
          />
          <FieldError message={form.formState.errors.token?.message} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-extrabold text-[var(--ink)]">
            Ichki nom{" "}
            <span className="font-semibold text-[var(--muted-light)]">
              (ixtiyoriy)
            </span>
          </span>
          <input
            {...form.register("label")}
            className={inputClass}
            autoComplete="off"
            placeholder="Masalan: Asosiy savdo botim"
          />
          <FieldError message={form.formState.errors.label?.message} />
        </label>
        {mutation.isError && (
          <p className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
            {apiErrorMessage(mutation.error, "Botni ulab bo'lmadi")}
          </p>
        )}
        <Button
          type="submit"
          className="w-full text-[13px]"
          loading={mutation.isPending}
        >
          <KeyRound className="h-4 w-4" />
          Tokenni tekshirish va ulash
        </Button>
      </form>
    </Panel>
  );
}

function BotOverview({
  bot,
  onEdit,
  onRemove,
}: {
  bot: MarketerBot;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const action = useBotAction();
  const { haptic } = useTelegram();
  const status = botStatus(bot.status);
  const runAction = (name: "start" | "stop" | "restart" | "retry") => {
    action.mutate(name, {
      onSuccess: () => haptic("success"),
      onError: () => haptic("error"),
    });
  };
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[var(--line)] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
            <Bot className="h-[19px] w-[19px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black tracking-[-0.01em] text-[var(--ink)]">
                  {bot.displayName}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--brand)]">
                  @{bot.username}
                </p>
              </div>
              <StatusChip tone={status.tone}>{status.label}</StatusChip>
            </div>
            {bot.label && (
              <p className="mt-2 inline-flex max-w-full truncate rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)]">
                {bot.label}
              </p>
            )}
          </div>
        </div>

        {bot.lastError && (
          <div className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[var(--danger)]">
                  Oxirgi xatolik
                </p>
                <p className="mt-1 break-words text-[11px] font-medium leading-5 text-[var(--muted)]">
                  {bot.lastError}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-3 min-h-10 w-full px-3 text-xs"
              loading={action.isPending}
              onClick={() => runAction("retry")}
            >
              <RotateCcw className="h-4 w-4" />
              Ulanishni qayta tekshirish
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x divide-[var(--line)] border-b border-[var(--line)] bg-[var(--surface-raised)]">
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold text-[var(--muted)]">
            Ulangan chatlar
          </p>
          <p className="mt-0.5 text-lg font-black tabular-nums tracking-[-0.02em] text-[var(--ink)]">
            {bot.connectedChatsCount}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold text-[var(--muted)]">
            Post yuborish mumkin
          </p>
          <p className="mt-0.5 text-lg font-black tabular-nums tracking-[-0.02em] text-[var(--brand)]">
            {bot.publishableChatsCount}
          </p>
        </div>
      </div>

      <div className="p-3">
        <p className="mb-2.5 px-0.5 text-[10px] font-semibold text-[var(--muted)]">
          Oxirgi aloqa: {formatDateTime(bot.lastHeartbeatAt)}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {bot.isRunning ? (
            <Button
              variant="secondary"
              className="min-h-10 px-2 text-xs"
              loading={action.isPending && action.variables === "stop"}
              onClick={() => runAction("stop")}
            >
              <CircleStop className="h-4 w-4" />
              To’xtatish
            </Button>
          ) : (
            <Button
              className="min-h-10 px-2 text-xs"
              loading={action.isPending && action.variables === "start"}
              onClick={() => runAction("start")}
            >
              <Play className="h-4 w-4" />
              Ishga tushirish
            </Button>
          )}
          <Button
            variant="secondary"
            className="min-h-10 px-2 text-xs"
            loading={action.isPending && action.variables === "restart"}
            onClick={() => runAction("restart")}
          >
            <RefreshCcw className="h-4 w-4" />
            Qayta boshlash
          </Button>
          <Button
            variant="secondary"
            className="min-h-10 px-2 text-xs"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
            Sozlash
          </Button>
          <Button
            variant="danger"
            className="min-h-10 px-2 text-xs"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
            Olib tashlash
          </Button>
        </div>
        {action.isError && (
          <p className="mt-2 text-xs font-semibold text-[var(--danger)]">
            {apiErrorMessage(action.error, "Bot amali bajarilmadi")}
          </p>
        )}
      </div>
    </Panel>
  );
}

function permissionSummary(chat: MarketerBotChat) {
  const labels = [
    chat.permissions.canPostMessages && "Post",
    chat.permissions.canEditMessages && "Tahrir",
    chat.permissions.canDeleteMessages && "O'chirish",
  ].filter(Boolean);
  return labels.length ? labels.join(" · ") : "Yetarli ruxsat yo'q";
}

function ChatsPanel({ bot }: { bot: MarketerBot }) {
  const query = useBotChats(Boolean(bot));
  return (
    <section>
      <SectionHeading
        title="Kanal va guruhlar"
        caption="Bot administrator sifatida aniqlagan chatlar"
        action={
          <button
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 text-[10px] font-extrabold text-[var(--brand)] transition active:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`}
            />
            Yangilash
          </button>
        }
      />
      <div className="mt-2.5">
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[76px] w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            description={apiErrorMessage(query.error)}
            retry={() => void query.refetch()}
          />
        ) : query.data?.length ? (
          <Panel className="divide-y divide-[var(--line)] overflow-hidden">
            {query.data.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center gap-3 p-3 transition active:bg-[var(--surface-raised)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--brand)]">
                  {chat.type === "channel" ? (
                    <Megaphone className="h-4 w-4" />
                  ) : (
                    <UsersRound className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-extrabold text-[var(--ink)]">
                      {chat.title}
                    </p>
                    {chat.canPublish && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--muted)]">
                    {chat.type === "channel" ? "Kanal" : "Guruh"} ·{" "}
                    {chat.role === "creator"
                      ? "Egasi"
                      : chat.role === "administrator"
                        ? "Administrator"
                        : "A'zo"}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-bold text-[var(--muted)]">
                    {permissionSummary(chat)}
                  </p>
                </div>
                <StatusChip tone={chat.canPublish ? "success" : "warning"}>
                  {chat.canPublish ? "Tayyor" : "Ruxsat kerak"}
                </StatusChip>
              </div>
            ))}
          </Panel>
        ) : (
          <EmptyState
            title="Chatlar hali aniqlanmadi"
            description="Botni kanal yoki guruhga administrator qilib qo'shing. Telegram yangilanishi kelgach chat avtomatik ko'rinadi."
            icon={UsersRound}
          />
        )}
      </div>
    </section>
  );
}

function UpdateBotSheet({
  bot,
  open,
  onClose,
}: {
  bot: MarketerBot;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useUpdateBot();
  const { haptic } = useTelegram();
  const form = useForm<UpdateForm>({
    resolver: yupResolver(updateSchema),
    defaultValues: { label: bot.label ?? bot.displayName, token: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ label: bot.label ?? bot.displayName, token: "" });
      mutation.reset();
    }
    // Opening the sheet creates a fresh token field by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bot.id]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Bot sozlamalari"
      description="Tokenni bo'sh qoldirsangiz mavjud shifrlangan token saqlanadi."
    >
      <form
        className="space-y-3.5"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(
            {
              label: values.label.trim(),
              ...(values.token?.trim() ? { token: values.token.trim() } : {}),
            },
            {
              onSuccess: () => {
                form.setValue("token", "");
                haptic("success");
                onClose();
              },
              onError: () => haptic("error"),
            },
          ),
        )}
      >
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-extrabold text-[var(--ink)]">
            Ichki nom
          </span>
          <input {...form.register("label")} className={inputClass} />
          <FieldError message={form.formState.errors.label?.message} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-extrabold text-[var(--ink)]">
            Yangi token{" "}
            <span className="font-semibold text-[var(--muted-light)]">
              (ixtiyoriy)
            </span>
          </span>
          <input
            {...form.register("token")}
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            className={inputClass}
            placeholder="Faqat almashtirish kerak bo'lsa kiriting"
          />
          <FieldError message={form.formState.errors.token?.message} />
        </label>
        {mutation.isError && (
          <p className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
            {apiErrorMessage(mutation.error, "Bot yangilanmadi")}
          </p>
        )}
        <Button
          type="submit"
          className="w-full text-[13px]"
          loading={mutation.isPending}
        >
          <ShieldCheck className="h-4 w-4" />
          Xavfsiz saqlash
        </Button>
      </form>
    </BottomSheet>
  );
}

function RemoveBotSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useRemoveBot();
  const { haptic } = useTelegram();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Botni olib tashlaysizmi?"
      description="Bot jarayoni to'xtatiladi va saqlangan token o'chiriladi. Oldingi referal statistikasi saqlanib qoladi."
    >
      <div className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold leading-5 text-[var(--danger)]">
        Bu amal bot orqali yangi post yuborishni to’xtatadi.
      </div>
      {mutation.isError && (
        <p className="mt-3 text-xs font-semibold text-[var(--danger)]">
          {apiErrorMessage(mutation.error, "Bot olib tashlanmadi")}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="text-[13px]" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button
          variant="danger"
          loading={mutation.isPending}
          onClick={() =>
            mutation.mutate(undefined, {
              onSuccess: () => {
                haptic("success");
                onClose();
              },
              onError: () => haptic("error"),
            })
          }
        >
          <Trash2 className="h-4 w-4" />
          Olib tashlash
        </Button>
      </div>
    </BottomSheet>
  );
}

export function BotScreen() {
  const query = useBot();
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  if (query.isLoading) return <PageSkeleton />;
  return (
    <div className="space-y-5 pb-1">
      <PageTitle
        eyebrow="Hisob · Mening botim"
        title="Mening botim"
        description="Referal postlarini o'z Telegram auditoriyangizga xavfsiz yuboring."
      />

      {query.isError ? (
        <ErrorState
          description={apiErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : query.data ? (
        <>
          <BotOverview
            bot={query.data}
            onEdit={() => setEditOpen(true)}
            onRemove={() => setRemoveOpen(true)}
          />
          <ChatsPanel bot={query.data} />
          <UpdateBotSheet
            bot={query.data}
            open={editOpen}
            onClose={() => setEditOpen(false)}
          />
          <RemoveBotSheet
            open={removeOpen}
            onClose={() => setRemoveOpen(false)}
          />
        </>
      ) : (
        <ConnectBotForm />
      )}
    </div>
  );
}
