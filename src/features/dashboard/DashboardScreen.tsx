"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  Eye,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { clsx } from "clsx";
import { useDashboard } from "@/src/hooks/useMarketerQueries";
import {
  formatCompact,
  formatDateTime,
  formatMoney,
  formatPercent,
} from "@/src/lib/format";
import { apiErrorMessage } from "@/src/lib/api";
import type {
  DashboardMetric,
  DashboardRange,
  MarketerDashboard,
} from "@/src/types/marketer";
import {
  ErrorState,
  PageSkeleton,
  PageTitle,
  Panel,
  SectionHeading,
} from "@/src/components/ui/primitives";
import { ProductImage } from "@/src/components/ui/ProductImage";

const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "7 kun" },
  { value: "30d", label: "30 kun" },
  { value: "90d", label: "90 kun" },
];

function ScreenHeading({
  eyebrow,
  title,
  description,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <PageTitle
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={
        accent ? (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]"
        >
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        ) : undefined
      }
    />
  );
}

function CompactHeading({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  return <SectionHeading title={title} caption={caption} />;
}

function MetricCard({
  icon,
  label,
  metric,
  formatter = formatCompact,
}: {
  icon: ReactNode;
  label: string;
  metric: DashboardMetric;
  formatter?: (value: number) => string;
}) {
  const change = metric.changePercent;
  const rising = (change ?? 0) >= 0;
  return (
    <Panel className="min-w-0 rounded-2xl p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
          {icon}
        </span>
        {change != null && (
          <span
            className={clsx(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold",
              rising ? "text-[var(--success)]" : "text-[var(--danger)]",
            )}
          >
            {rising ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {formatPercent(Math.abs(change))}
          </span>
        )}
      </div>
      <p className="mt-2.5 truncate text-[10px] font-bold text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[17px] font-black tracking-[-0.03em] text-[var(--ink)]">
        {formatter(metric.value)}
      </p>
    </Panel>
  );
}

function WalletCard({ data }: { data: MarketerDashboard }) {
  return (
    <Panel className="overflow-hidden rounded-2xl border-[var(--brand-line)]">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[var(--muted)]">
              Ishlatish mumkin bo’lgan balans
            </p>
            <p className="mt-1 text-[26px] font-black tracking-[-0.045em] text-[var(--ink)]">
              {formatMoney(data.wallet.availableBalance)}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
            <Banknote className="h-4.5 w-4.5" />
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 divide-x divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
          <div className="px-3 py-2.5">
            <p className="text-[9px] font-bold leading-4 text-[var(--muted)]">
              Tasdiqlanishi kutilmoqda
            </p>
            <p className="mt-0.5 truncate text-xs font-extrabold text-[var(--ink)]">
              {formatMoney(data.wallet.pendingBalance)}
            </p>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[9px] font-bold leading-4 text-[var(--muted)]">
              Jami topildi
            </p>
            <p className="mt-0.5 truncate text-xs font-extrabold text-[var(--ink)]">
              {formatMoney(data.wallet.totalEarned)}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function TrendChart({ data }: { data: MarketerDashboard["trend"] }) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-center text-xs font-semibold text-[var(--muted)]">
        Tanlangan davr uchun trend ma’lumoti hali yo’q
      </div>
    );
  }

  return (
    <div
      className="mt-3 h-40 w-full"
      role="img"
      aria-label="Savdo va bonus trendi"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#e4e7ec"
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={22}
            tick={{ fill: "#98a2b3", fontSize: 10, fontWeight: 700 }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("uz-UZ", {
                day: "2-digit",
                month: "short",
              })
            }
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e4e7ec",
              borderRadius: 10,
              background: "#ffffff",
              color: "#101828",
              fontSize: 12,
              boxShadow: "none",
            }}
            cursor={{ stroke: "#d0d5dd", strokeDasharray: "3 3" }}
            formatter={(value, name) => [
              formatMoney(Number(value ?? 0)),
              name === "salesAmount" ? "Savdo" : "Bonus",
            ]}
          />
          <Line
            type="monotone"
            dataKey="salesAmount"
            stroke="#2563eb"
            strokeWidth={2.25}
            dot={false}
            activeDot={{ r: 3.5, fill: "#2563eb", stroke: "#ffffff" }}
          />
          <Line
            type="monotone"
            dataKey="bonusAmount"
            stroke="#94a3b8"
            strokeWidth={1.75}
            dot={false}
            activeDot={{ r: 3.5, fill: "#64748b", stroke: "#ffffff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Funnel({ data }: { data: MarketerDashboard["funnel"] }) {
  const rows = [
    { label: "Ko'rishlar", value: data.views, icon: Eye },
    { label: "Tashrifchilar", value: data.visitors, icon: UsersRound },
    {
      label: "Noyob mijozlar",
      value: data.uniqueCustomers,
      icon: Target,
    },
    { label: "Buyurtmalar", value: data.orders, icon: ShoppingBag },
    {
      label: "Yetkazilgan",
      value: data.deliveredOrders,
      icon: PackageCheck,
    },
  ];
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="mt-3 space-y-2.5">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-2 font-bold text-[var(--muted)]">
                <Icon className="h-3.5 w-3.5 text-[var(--brand)]" />
                {row.label}
              </span>
              <span className="font-black tabular-nums text-[var(--ink)]">
                {formatCompact(row.value)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--brand)]"
                style={{
                  width: `${Math.max((row.value / max) * 100, row.value ? 4 : 0)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityList({
  items,
}: {
  items: MarketerDashboard["recentActivity"];
}) {
  if (!items.length) {
    return (
      <p className="py-4 text-center text-xs font-semibold text-[var(--muted)]">
        Faollik paydo bo’lganda shu yerda ko’rinadi
      </p>
    );
  }
  return (
    <div className="mt-1.5 divide-y divide-[var(--line)]">
      {items.slice(0, 6).map((item) => (
        <div key={item.id} className="flex items-center gap-2.5 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
            {item.type === "bonus" || item.type === "payout" ? (
              <BadgeDollarSign className="h-3.5 w-3.5" />
            ) : (
              <ReceiptText className="h-3.5 w-3.5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold text-[var(--ink)]">
              {item.title}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--muted)]">
              {item.detail || formatDateTime(item.createdAt)}
            </p>
          </div>
          {item.amount != null && (
            <span
              className={clsx(
                "shrink-0 text-xs font-black",
                item.type === "reversal" || item.amount < 0
                  ? "text-[var(--danger)]"
                  : "text-[var(--brand)]",
              )}
            >
              {item.type === "reversal" || item.amount < 0 ? "−" : "+"}
              {formatMoney(Math.abs(item.amount))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function DashboardScreen() {
  const [range, setRange] = useState<DashboardRange>("7d");
  const query = useDashboard(range);
  const data = query.data;

  if (query.isLoading) return <PageSkeleton />;
  if (query.isError || !data) {
    return (
      <div className="space-y-3">
        <ScreenHeading
          eyebrow="Marketer paneli"
          title="Natijalar markazi"
          description="Savdo, auditoriya va bonuslarni bir joyda boshqaring."
        />
        <ErrorState
          description={apiErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      </div>
    );
  }

  const firstName = data.profile.firstName?.trim() || "Marketer";
  return (
    <div className="space-y-3">
      <ScreenHeading
        eyebrow="Bugungi holat"
        title={`Salom, ${firstName}`}
        description="Havolalaringiz natijasi va olinadigan bonuslar."
        accent
      />

      {!data.program.enabled && (
        <Panel className="rounded-2xl border-[var(--warning-line)] bg-[var(--warning-soft)] p-3">
          <p className="text-[13px] font-black text-[var(--ink)]">
            Referal dasturi vaqtincha to&apos;xtatilgan
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted)]">
            Mavjud statistika saqlanadi, ammo yangi referal yaratib
            bo&apos;lmaydi.
          </p>
        </Panel>
      )}

      <WalletCard data={data} />

      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Bugungi savdo"
          metric={data.today.sales}
          formatter={formatMoney}
        />
        <MetricCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Buyurtmalar"
          metric={data.today.orders}
        />
        <MetricCard
          icon={<BadgeDollarSign className="h-4 w-4" />}
          label="Bugungi bonus"
          metric={data.today.bonus}
          formatter={formatMoney}
        />
        <MetricCard
          icon={<Target className="h-4 w-4" />}
          label="Konversiya"
          metric={data.today.conversion}
          formatter={formatPercent}
        />
      </div>

      <Panel className="rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <CompactHeading
            title="Savdo dinamikasi"
            caption="Savdo va hisoblangan bonus"
          />
          <div className="flex shrink-0 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-0.5">
            {ranges.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setRange(item.value)}
                aria-pressed={range === item.value}
                className={clsx(
                  "h-7 rounded-md border px-2 text-[9px] font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]",
                  range === item.value
                    ? "border-[var(--brand-line)] bg-[var(--surface)] text-[var(--brand)]"
                    : "border-transparent text-[var(--muted)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <TrendChart data={data.trend} />
        <div className="mt-1 flex items-center justify-center gap-4 text-[10px] font-bold text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
            Savdo
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Bonus
          </span>
        </div>
      </Panel>

      <Panel className="rounded-2xl p-4">
        <CompactHeading
          title="Natijalar voronkasi"
          caption="Ko'rishdan yetkazib berishgacha"
        />
        <Funnel data={data.funnel} />
      </Panel>

      {data.topProducts.length > 0 && (
        <Panel className="rounded-2xl p-4">
          <CompactHeading
            title="Yaxshi ishlayotgan mahsulotlar"
            caption="Tanlangan davr natijasi"
          />
          <div className="mt-1.5 divide-y divide-[var(--line)]">
            {data.topProducts.slice(0, 4).map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-2.5 py-2.5 first:pt-1"
              >
                <span className="w-5 text-center text-xs font-black text-[var(--muted)]">
                  {index + 1}
                </span>
                <ProductImage
                  src={product.thumbnailUrl}
                  alt={product.nameUz}
                  className="h-11 w-9 shrink-0 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)]"
                  sizes="40px"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-extrabold text-[var(--ink)]">
                    {product.nameUz}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
                    #{product.numericId}
                  </p>
                </div>
                <span className="inline-flex min-h-6 shrink-0 items-center rounded-full border border-[var(--success-line)] bg-[var(--success-soft)] px-2 text-[10px] font-extrabold text-[var(--success)]">
                  +{formatMoney(product.expectedBonus)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {!data.recentActivity.length && !data.topProducts.length ? (
        <Panel className="rounded-2xl px-5 py-7 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
            <ShoppingBag className="h-4.5 w-4.5" />
          </span>
          <h2 className="mt-3 text-[15px] font-extrabold text-[var(--ink)]">
            Birinchi referalingizni yarating
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-5 text-[var(--muted)]">
            Bozor bo&apos;limidan mahsulot tanlab, auditoriyangiz bilan
            ulashing.
          </p>
        </Panel>
      ) : (
        <Panel className="rounded-2xl p-4">
          <CompactHeading title="So'nggi faollik" />
          <ActivityList items={data.recentActivity} />
        </Panel>
      )}
    </div>
  );
}
