"use client";

import {
  Check,
  CheckCircle2,
  Clipboard,
  Eye,
  Filter,
  Megaphone,
  MousePointerClick,
  Pause,
  Play,
  Search,
  Send,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { clsx } from "clsx";
import {
  useBotChats,
  usePublishReferral,
  useReferrals,
  useUpdateReferral,
} from "@/src/hooks/useMarketerQueries";
import { useInfiniteSentinel } from "@/src/hooks/useInfiniteSentinel";
import { apiErrorMessage } from "@/src/lib/api";
import {
  formatCompact,
  formatDate,
  formatMoney,
  formatPercent,
} from "@/src/lib/format";
import type {
  MarketerReferral,
  ReferralStatus,
} from "@/src/types/marketer";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import { ProductImage } from "@/src/components/ui/ProductImage";
import {
  BottomSheet,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  PageTitle,
  Panel,
  SectionHeading,
  Skeleton,
  StatusChip,
  inputClass,
} from "@/src/components/ui/primitives";

const statusFilters: Array<{
  value: ReferralStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Barchasi" },
  { value: "active", label: "Faol" },
  { value: "paused", label: "To'xtatilgan" },
  { value: "archived", label: "Arxiv" },
];

function statusLabel(status: ReferralStatus) {
  if (status === "active") return "Faol";
  if (status === "paused") return "To'xtatilgan";
  return "Arxivlangan";
}

function ReferralSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <Panel key={index} className="p-3.5">
          <div className="flex gap-3">
            <Skeleton className="h-16 w-12 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-3 h-16 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </Panel>
      ))}
    </div>
  );
}

async function copyLink(link: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
    return;
  }
  const element = document.createElement("textarea");
  element.value = link;
  element.style.position = "fixed";
  element.style.opacity = "0";
  document.body.appendChild(element);
  element.select();
  document.execCommand("copy");
  element.remove();
}

function ReferralCard({
  referral,
  copied,
  onCopy,
  onShare,
  onPublish,
}: {
  referral: MarketerReferral;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onPublish: () => void;
}) {
  const update = useUpdateReferral();
  const { haptic } = useTelegram();
  const toggleStatus = referral.status === "active" ? "paused" : "active";
  return (
    <Panel className="p-3.5">
      <div className="flex items-start gap-3">
        <ProductImage
          src={referral.product.thumbnailUrl}
          alt={referral.product.nameUz}
          className="h-[68px] w-[52px] shrink-0 rounded-xl"
          sizes="52px"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[var(--ink)]">
                {referral.name}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-[var(--muted)]">
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
          <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-[var(--muted)]">
            <span>#{referral.product.numericId}</span>
            <span>•</span>
            <span>{formatDate(referral.createdAt)}</span>
            <span>•</span>
            <span className="text-[var(--brand)]">
              +{formatMoney(referral.expectedBonus)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 divide-x divide-[var(--line)] rounded-xl bg-[var(--surface-muted)] py-2.5">
        {[
          {
            label: "Ko'rish",
            value: referral.stats.views,
            icon: Eye,
          },
          {
            label: "Tashrif",
            value: referral.stats.visitors,
            icon: MousePointerClick,
          },
          {
            label: "Mijoz",
            value: referral.stats.uniqueCustomers,
            icon: UsersRound,
          },
          {
            label: "Buyurtma",
            value: referral.stats.orders,
            icon: ShoppingBag,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="min-w-0 px-1 text-center">
              <Icon className="mx-auto h-3.5 w-3.5 text-[var(--brand)]" />
              <p className="mt-1 truncate text-xs font-black text-[var(--ink)]">
                {formatCompact(metric.value)}
              </p>
              <p className="mt-0.5 truncate text-[8px] font-bold text-[var(--muted)]">
                {metric.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-bold text-[var(--muted)]">Konversiya</p>
          <p className="text-xs font-black text-[var(--ink)]">
            {formatPercent(referral.stats.conversionPercent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-[var(--muted)]">
            Topilgan bonus
          </p>
          <p className="text-xs font-black text-[var(--brand)]">
            {formatMoney(referral.stats.bonus)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
        <Button variant="secondary" className="min-h-10 px-2" onClick={onCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-[var(--success)]" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
          {copied ? "Nusxalandi" : "Nusxalash"}
        </Button>
        <Button
          className="min-h-10 px-2"
          onClick={onPublish}
          disabled={referral.status !== "active"}
          title={
            referral.status === "active"
              ? "Kanal va guruhlarga yuborish"
              : "Yuborish uchun referal faol bo'lishi kerak"
          }
        >
          <Megaphone className="h-4 w-4" />
          {referral.status === "active" ? "Kanallarga" : "Faol emas"}
        </Button>
        <IconButton label="Telegram orqali ulashish" onClick={onShare}>
          <Send className="h-4 w-4" />
        </IconButton>
      </div>

      {referral.status !== "archived" && (
        <button
          onClick={() =>
            update.mutate(
              { referralId: referral.id, status: toggleStatus },
              {
                onSuccess: () => haptic("success"),
                onError: () => haptic("error"),
              },
            )
          }
          disabled={update.isPending}
          className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-extrabold text-[var(--muted)] active:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          {referral.status === "active" ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {referral.status === "active"
            ? "Referalni vaqtincha to'xtatish"
            : "Referalni qayta faollashtirish"}
        </button>
      )}
    </Panel>
  );
}

function PublishSheet({
  referral,
  onClose,
}: {
  referral: MarketerReferral;
  onClose: () => void;
}) {
  const chatsQuery = useBotChats(Boolean(referral));
  const publish = usePublishReferral();
  const { haptic } = useTelegram();
  const [selected, setSelected] = useState<string[]>([]);
  const [language, setLanguage] = useState<"uz" | "ru">("uz");

  const publishable = chatsQuery.data?.filter((chat) => chat.canPublish) ?? [];
  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Telegramga yuborish"
      description="Bot administrator bo'lgan guruh va kanallarni tanlang."
    >
      {publish.isSuccess ? (
        <div className="py-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-base font-black text-[var(--ink)]">
            Yuborish navbatga qo’shildi
          </h3>
          <p className="mt-1 text-sm font-medium text-[var(--muted)]">
            {publish.data.queued} ta chat uchun xavfsiz yuborish vazifasi
            yaratildi.
          </p>
          <Button className="mt-4 w-full" onClick={onClose}>
            Tayyor
          </Button>
        </div>
      ) : chatsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
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
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-muted)] p-1">
            {[
              { value: "uz" as const, label: "O'zbekcha" },
              { value: "ru" as const, label: "Ruscha" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setLanguage(item.value)}
                className={clsx(
                  "h-10 rounded-lg text-xs font-extrabold",
                  language === item.value
                    ? "bg-[var(--surface)] text-[var(--brand)]"
                    : "text-[var(--muted)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {publishable.map((chat) => {
              const active = selected.includes(chat.chatId);
              return (
                <button
                  key={chat.id}
                  onClick={() =>
                    setSelected((current) =>
                      active
                        ? current.filter((id) => id !== chat.chatId)
                        : [...current, chat.chatId],
                    )
                  }
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left",
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-[var(--line)]",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-md border",
                      active
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--line-strong)]",
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
          {publish.isError && (
            <p className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
              {apiErrorMessage(publish.error, "Post yuborilmadi")}
            </p>
          )}
          <Button
            className="mt-4 w-full"
            disabled={!selected.length}
            loading={publish.isPending}
            onClick={() => {
              publish.mutate(
                {
                  referralId: referral.id,
                  chatIds: selected,
                  language,
                },
                {
                  onSuccess: () => haptic("success"),
                  onError: () => haptic("error"),
                },
              );
            }}
          >
            <Send className="h-4 w-4" />
            {selected.length
              ? `${selected.length} ta chatga yuborish`
              : "Chatlarni tanlang"}
          </Button>
        </>
      )}
    </BottomSheet>
  );
}

export function ReferralsScreen() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [status, setStatus] = useState<ReferralStatus | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishReferral, setPublishReferral] =
    useState<MarketerReferral | null>(null);
  const { haptic, openTelegramLink } = useTelegram();
  const query = useReferrals({ search: deferredSearch, status });
  const referrals = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);
  const sentinel = useInfiniteSentinel(
    Boolean(query.hasNextPage && !query.isFetchingNextPage),
    loadMore,
  );

  return (
    <div className="space-y-4">
      <PageTitle
        eyebrow="Kuzatiladigan havolalar"
        title="Referallarim"
        description="Har bir havolaning auditoriyasi, buyurtmasi va bonusini kuzating."
      />

      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={clsx(inputClass, "pl-9")}
            placeholder="Referal yoki mahsulot nomi"
            enterKeyHint="search"
          />
        </label>
        <IconButton
          label="Holat filtri"
          className="h-12 w-12"
          onClick={() => setFilterOpen(true)}
        >
          <Filter className="h-4.5 w-4.5" />
        </IconButton>
      </div>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
        {statusFilters.map((item) => (
          <button
            key={item.value}
            onClick={() => setStatus(item.value)}
            className={clsx(
              "h-9 shrink-0 rounded-full border px-3 text-[11px] font-extrabold",
              status === item.value
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section>
        <SectionHeading
          title="Havolalar"
          caption={
            query.data?.pages[0]
              ? `${query.data.pages[0].meta.total} ta referal`
              : undefined
          }
        />
        <div className="mt-2.5">
          {query.isLoading ? (
            <ReferralSkeleton />
          ) : query.isError ? (
            <ErrorState
              description={apiErrorMessage(query.error)}
              retry={() => void query.refetch()}
            />
          ) : referrals.length ? (
            <div className="space-y-2.5">
              {referrals.map((referral) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  copied={copiedId === referral.id}
                  onCopy={async () => {
                    await copyLink(referral.link);
                    setCopiedId(referral.id);
                    haptic("success");
                    window.setTimeout(
                      () =>
                        setCopiedId((current) =>
                          current === referral.id ? null : current,
                        ),
                      1_800,
                    );
                  }}
                  onShare={() => {
                    openTelegramLink(
                      `https://t.me/share/url?url=${encodeURIComponent(
                        referral.link,
                      )}&text=${encodeURIComponent(referral.product.nameUz)}`,
                    );
                    haptic("light");
                  }}
                  onPublish={() => {
                    if (referral.status === "active") {
                      setPublishReferral(referral);
                    }
                  }}
                />
              ))}
              <div ref={sentinel} className="h-3" />
              {query.isFetchingNextPage && <ReferralSkeleton />}
            </div>
          ) : (
            <EmptyState
              title="Referal topilmadi"
              description={
                deferredSearch || status !== "all"
                  ? "Qidiruv yoki holat filtrini o'zgartirib ko'ring."
                  : "Bozor bo'limidan birinchi mahsulot havolangizni yarating."
              }
              icon={Megaphone}
            />
          )}
        </div>
      </section>

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Referal holati"
      >
        <div className="space-y-2">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setStatus(item.value);
                setFilterOpen(false);
              }}
              className={clsx(
                "flex min-h-12 w-full items-center justify-between rounded-xl border px-3 text-sm font-extrabold",
                status === item.value
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--line)] text-[var(--ink)]",
              )}
            >
              {item.label}
              {status === item.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {publishReferral && (
        <PublishSheet
          key={publishReferral.id}
          referral={publishReferral}
          onClose={() => setPublishReferral(null)}
        />
      )}
    </div>
  );
}
