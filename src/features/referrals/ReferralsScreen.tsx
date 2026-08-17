"use client";

import {
  Check,
  CheckCircle2,
  CircleX,
  Filter,
  Megaphone,
  Search,
  Send,
} from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  useBotChats,
  usePublicationJob,
  usePublishReferral,
  useReferrals,
} from "@/src/hooks/useMarketerQueries";
import { useInfiniteSentinel } from "@/src/hooks/useInfiniteSentinel";
import { apiErrorMessage } from "@/src/lib/api";
import type { MarketerReferral, ReferralStatus } from "@/src/types/marketer";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import { ReferralCard } from "@/src/features/referrals/components/ReferralCard";
import { ReferralLinksSheet } from "@/src/features/referrals/components/ReferralLinksSheet";
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

function ReferralSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <Panel key={index} className="overflow-hidden p-0">
          <div className="p-3.5">
            <div className="flex gap-3">
              <Skeleton className="h-[76px] w-[58px] shrink-0 rounded-[13px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="mt-3 h-14 w-full rounded-[13px]" />
          </div>
          <Skeleton className="h-[58px] w-full rounded-none border-y border-[var(--line)]" />
          <div className="p-2.5">
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        </Panel>
      ))}
    </div>
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
  const jobQuery = usePublicationJob(publish.data?.jobId);
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
        <div className="py-3 text-center">
          <span
            className={clsx(
              "mx-auto flex h-11 w-11 items-center justify-center rounded-full border",
              jobQuery.data?.status === "failed"
                ? "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]"
                : "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]",
            )}
          >
            {jobQuery.data?.status === "failed" ? (
              <CircleX className="h-6 w-6" />
            ) : (
              <CheckCircle2 className="h-6 w-6" />
            )}
          </span>
          <h3 className="mt-2.5 text-base font-extrabold text-[var(--ink)]">
            {jobQuery.data?.status === "completed"
              ? "Xabarlar yuborildi"
              : jobQuery.data?.status === "failed"
                ? "Yuborish yakunlanmadi"
                : "Xabarlar yuborilmoqda"}
          </h3>
          <p className="mt-1 text-sm font-medium text-[var(--muted)]">
            {jobQuery.data
              ? `${jobQuery.data.sentCount}/${jobQuery.data.totalCount} ta chatga yuborildi${
                  jobQuery.data.failedCount
                    ? `, ${jobQuery.data.failedCount} ta xatolik`
                    : ""
                }.`
              : `${publish.data.queued} ta chat uchun xavfsiz yuborish vazifasi yaratildi.`}
          </p>
          {jobQuery.data?.error && (
            <p className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-left text-xs font-semibold text-[var(--danger)]">
              {jobQuery.data.error}
            </p>
          )}
          <Button className="mt-3.5 min-h-10 w-full" onClick={onClose}>
            {jobQuery.data?.status === "queued" ||
            jobQuery.data?.status === "running"
              ? "Orqa fonda davom etsin"
              : "Tayyor"}
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
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-1">
            {[
              { value: "uz" as const, label: "O'zbekcha" },
              { value: "ru" as const, label: "Ruscha" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setLanguage(item.value)}
                aria-pressed={language === item.value}
                className={clsx(
                  "h-9 rounded-lg border text-xs font-bold",
                  language === item.value
                    ? "border-[var(--line)] bg-[var(--surface)] text-[var(--brand)]"
                    : "border-transparent text-[var(--muted)]",
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
                  aria-pressed={active}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-[12px] border bg-[var(--surface)] p-2.5 text-left",
                    active
                      ? "border-[var(--brand-line)] bg-[var(--brand-soft)]"
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
            className="mt-3.5 min-h-10 w-full"
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
  const [linkReferral, setLinkReferral] =
    useState<MarketerReferral | null>(null);
  const [publishReferral, setPublishReferral] =
    useState<MarketerReferral | null>(null);
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
            aria-label="Referal qidirish"
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

      <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
        {statusFilters.map((item) => (
          <button
            key={item.value}
            onClick={() => setStatus(item.value)}
            aria-pressed={status === item.value}
            className={clsx(
              "h-8 shrink-0 rounded-[10px] border px-3 text-[11px] font-bold",
              status === item.value
                ? "border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]"
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
            <div className="space-y-2">
              {referrals.map((referral) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  onOpenLinks={() => setLinkReferral(referral)}
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
              aria-pressed={status === item.value}
              className={clsx(
                "flex min-h-10 w-full items-center justify-between rounded-[10px] border bg-[var(--surface)] px-3 text-sm font-bold",
                status === item.value
                  ? "border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--line)] text-[var(--ink)]",
              )}
            >
              {item.label}
              {status === item.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {linkReferral && (
        <ReferralLinksSheet
          key={linkReferral.id}
          referral={linkReferral}
          onClose={() => setLinkReferral(null)}
        />
      )}

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
