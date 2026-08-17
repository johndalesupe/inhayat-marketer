"use client";

import {
  Check,
  Filter,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { clsx } from "clsx";
import { useOrders } from "@/src/hooks/useMarketerQueries";
import { useInfiniteSentinel } from "@/src/hooks/useInfiniteSentinel";
import { apiErrorMessage } from "@/src/lib/api";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import type { MarketerOrder } from "@/src/types/marketer";
import { ProductImage } from "@/src/components/ui/ProductImage";
import {
  BottomSheet,
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

const orderFilters = [
  { value: "all", label: "Barchasi" },
  { value: "new", label: "Yangi" },
  { value: "confirmed", label: "Tasdiqlangan" },
  { value: "processing", label: "Jarayonda" },
  { value: "shipped", label: "Yo'lda" },
  { value: "delivered", label: "Yetkazilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
  { value: "returned", label: "Qaytarilgan" },
  { value: "none", label: "Holati belgilanmagan" },
];

function statusPresentation(status: MarketerOrder["status"]) {
  const map: Record<
    MarketerOrder["status"],
    {
      label: string;
      tone: "brand" | "neutral" | "warning" | "danger" | "success";
    }
  > = {
    new: { label: "Yangi", tone: "brand" },
    confirmed: { label: "Tasdiqlangan", tone: "brand" },
    processing: { label: "Jarayonda", tone: "warning" },
    shipped: { label: "Yo'lda", tone: "warning" },
    delivered: { label: "Yetkazilgan", tone: "success" },
    cancelled: { label: "Bekor qilingan", tone: "danger" },
    returned: { label: "Qaytarilgan", tone: "danger" },
    none: { label: "Holati belgilanmagan", tone: "neutral" },
  };
  return map[status];
}

function bonusPresentation(status: MarketerOrder["bonusStatus"]) {
  if (status === "none") return "Bonus belgilanmagan";
  if (status === "available") return "Balansga tushdi";
  if (status === "paid") return "To'lab berildi";
  if (status === "reversed") return "Bekor qilindi";
  return "Kutilmoqda";
}

function OrderCard({ order }: { order: MarketerOrder }) {
  const status = statusPresentation(order.status);
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3.5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-black tabular-nums tracking-[-0.01em] text-[var(--ink)]">
            #{order.orderNumber}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>

      <div className="divide-y divide-[var(--line)] px-3.5">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 py-2.5">
            <ProductImage
              src={item.thumbnailUrl}
              alt={item.nameUz}
              className="h-[52px] w-10 shrink-0 rounded-lg"
              sizes="40px"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[11px] font-extrabold leading-4 text-[var(--ink)]">
                {item.nameUz}
              </p>
              <p className="mt-1 text-[9px] font-semibold text-[var(--muted)]">
                #{item.numericId} · {item.quantity} dona
              </p>
            </div>
            <span className="max-w-[36%] shrink-0 text-right text-[11px] font-black tabular-nums text-[var(--ink)]">
              {formatMoney(item.lineTotal)}
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="py-2 text-center text-[10px] font-bold text-[var(--muted)]">
            Yana {order.items.length - 3} xil mahsulot
          </p>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-[var(--line)] bg-[var(--surface-raised)] px-3.5 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[10px] font-bold text-[var(--muted)]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
            {order.region}, {order.city}
          </p>
          <p className="mt-1 truncate text-[9px] font-semibold text-[var(--muted)]">
            {order.itemCount} dona · Mahsulotlar{" "}
            {formatMoney(order.productSubtotal)}
          </p>
        </div>
        <div className="min-w-[104px] border-l border-[var(--line)] pl-3 text-right">
          <p className="text-[9px] font-bold text-[var(--muted)]">
            Sizning bonusingiz
          </p>
          <p
            className={clsx(
              "mt-0.5 text-[13px] font-black tabular-nums",
              order.bonusStatus === "reversed"
                ? "text-[var(--danger)]"
                : "text-[var(--brand)]",
            )}
          >
            {order.bonusStatus === "reversed" ? "" : "+"}
            {formatMoney(order.bonusAmount)}
          </p>
          <p className="mt-0.5 text-[8px] font-bold text-[var(--muted)]">
            {bonusPresentation(order.bonusStatus)}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <Panel key={index} className="overflow-hidden">
          <div className="flex justify-between border-b border-[var(--line)] px-3.5 py-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mx-3.5 flex gap-2.5 py-2.5">
            <Skeleton className="h-[52px] w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="border-t border-[var(--line)] bg-[var(--surface-raised)] px-3.5 py-3">
            <Skeleton className="h-11 w-full" />
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function OrdersScreen() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [status, setStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const query = useOrders({ search: deferredSearch, status });
  const orders = useMemo(
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
    <div className="space-y-3 pb-1">
      <PageTitle
        eyebrow="Hisob · Buyurtmalar"
        title="Buyurtmalarim"
        description="Sizning referal sessiyalaringizdan kelgan buyurtmalar."
      />

      <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <p className="pt-0.5 text-[11px] font-semibold leading-[18px] text-[var(--muted)]">
          Mijoz maxfiyligi himoyalangan: ism va telefon ko’rsatilmaydi. Faqat
          hudud, mahsulot, soni va bonus holati mavjud.
        </p>
      </div>

      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={clsx(inputClass, "pl-9")}
            placeholder="Buyurtma yoki mahsulot ID"
            enterKeyHint="search"
          />
        </label>
        <IconButton
          label="Buyurtma holati"
          className={clsx(
            "relative h-12 w-12",
            status !== "all" &&
              "border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]",
          )}
          onClick={() => setFilterOpen(true)}
        >
          <Filter className="h-4.5 w-4.5" />
          {status !== "all" && (
            <span
              aria-hidden
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--brand)] ring-2 ring-[var(--brand-soft)]"
            />
          )}
        </IconButton>
      </div>

      <section>
        <SectionHeading
          title="Referal buyurtmalari"
          caption={
            query.data?.pages[0]
              ? `${query.data.pages[0].meta.total} ta buyurtma`
              : undefined
          }
        />
        <div className="mt-2.5">
          {query.isLoading ? (
            <OrdersSkeleton />
          ) : query.isError ? (
            <ErrorState
              description={apiErrorMessage(query.error)}
              retry={() => void query.refetch()}
            />
          ) : orders.length ? (
            <div className="space-y-2.5">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              <div ref={sentinel} className="h-3" />
              {query.isFetchingNextPage && <OrdersSkeleton />}
            </div>
          ) : (
            <EmptyState
              title="Buyurtmalar topilmadi"
              description={
                deferredSearch || status !== "all"
                  ? "Qidiruv yoki holat filtrini o'zgartiring."
                  : "Referal orqali buyurtma kelganda shu yerda ko'rinadi."
              }
              icon={ShoppingBag}
            />
          )}
        </div>
      </section>

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Buyurtma holati"
      >
        <div className="space-y-2">
          {orderFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={status === item.value}
              onClick={() => {
                setStatus(item.value);
                setFilterOpen(false);
              }}
              className={clsx(
                "flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-[13px] font-extrabold transition active:bg-[var(--surface-muted)]",
                status === item.value
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
              )}
            >
              <span className="flex items-center gap-2">
                {item.value === "delivered" ? (
                  <PackageCheck className="h-4 w-4" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                {item.label}
              </span>
              {status === item.value && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
