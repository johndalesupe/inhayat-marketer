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
  EmptyState,
  ErrorState,
  PageSkeleton,
  PageTitle,
  Panel,
  SectionHeading,
  StatusChip,
} from "@/src/components/ui/primitives";
import { ProductImage } from "@/src/components/ui/ProductImage";

const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "7 kun" },
  { value: "30d", label: "30 kun" },
  { value: "90d", label: "90 kun" },
];

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
    <Panel className="min-w-0 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--brand)]">
          {icon}
        </span>
        {change != null && (
          <span
            className={clsx(
              "flex items-center gap-0.5 text-[10px] font-extrabold",
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
      <p className="mt-3 truncate text-[11px] font-bold text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-lg font-black tracking-[-0.025em] text-[var(--ink)]">
        {formatter(metric.value)}
      </p>
    </Panel>
  );
}

function WalletCard({ data }: { data: MarketerDashboard }) {
  return (
    <Panel className="overflow-hidden border-[var(--brand-line)] bg-[var(--brand)] text-white">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white/72">
              Ishlatish mumkin bo’lgan balans
            </p>
            <p className="mt-1 text-[28px] font-black tracking-[-0.04em]">
              {formatMoney(data.wallet.availableBalance)}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <Banknote className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 divide-x divide-white/15 rounded-xl border border-white/15 bg-black/10">
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-bold text-white/65">
              Tasdiqlanishi kutilmoqda
            </p>
            <p className="mt-0.5 truncate text-sm font-extrabold">
              {formatMoney(data.wallet.pendingBalance)}
            </p>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-bold text-white/65">Jami topildi</p>
            <p className="mt-0.5 truncate text-sm font-extrabold">
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
      <div className="flex h-44 items-center justify-center text-center text-xs font-semibold text-[var(--muted)]">
        Tanlangan davr uchun trend ma’lumoti hali yo’q
      </div>
    );
  }

  return (
    <div className="mt-3 h-44 w-full" aria-label="Savdo va bonus trendi">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--line)"
            strokeDasharray="3 4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={22}
            tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 700 }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("uz-UZ", {
                day: "2-digit",
                month: "short",
              })
            }
          />
          <Tooltip
            contentStyle={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              background: "var(--surface)",
              color: "var(--ink)",
              fontSize: 12,
            }}
            formatter={(value, name) => [
              formatMoney(Number(value ?? 0)),
              name === "salesAmount" ? "Savdo" : "Bonus",
            ]}
          />
          <Line
            type="monotone"
            dataKey="salesAmount"
            stroke="var(--brand)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "var(--brand)" }}
          />
          <Line
            type="monotone"
            dataKey="bonusAmount"
            stroke="var(--warning)"
            strokeWidth={2}
            dot={false}
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
    <div className="mt-3 space-y-3">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
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

function ActivityList({ items }: { items: MarketerDashboard["recentActivity"] }) {
  if (!items.length) {
    return (
      <p className="py-5 text-center text-xs font-semibold text-[var(--muted)]">
        Faollik paydo bo’lganda shu yerda ko’rinadi
      </p>
    );
  }
  return (
    <div className="mt-2 divide-y divide-[var(--line)]">
      {items.slice(0, 6).map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
            {item.type === "bonus" || item.type === "payout" ? (
              <BadgeDollarSign className="h-4 w-4" />
            ) : (
              <ReceiptText className="h-4 w-4" />
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
      <div className="space-y-4">
        <PageTitle
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
    <div className="space-y-4">
      <PageTitle
        eyebrow="Bugungi holat"
        title={`Salom, ${firstName}`}
        description="Havolalaringiz natijasi va olinadigan bonuslar."
        action={
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]">
            <Sparkles className="h-5 w-5" />
          </span>
        }
      />

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

      <Panel className="p-4">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            title="Savdo dinamikasi"
            caption="Savdo va hisoblangan bonus"
          />
          <div className="flex rounded-xl bg-[var(--surface-muted)] p-1">
            {ranges.map((item) => (
              <button
                key={item.value}
                onClick={() => setRange(item.value)}
                className={clsx(
                  "h-8 rounded-lg px-2.5 text-[10px] font-extrabold transition",
                  range === item.value
                    ? "bg-[var(--surface)] text-[var(--brand)]"
                    : "text-[var(--muted)]",
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
            <i className="h-2 w-2 rounded-full bg-[var(--brand)]" />
            Savdo
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-[var(--warning)]" />
            Bonus
          </span>
        </div>
      </Panel>

      <Panel className="p-4">
        <SectionHeading
          title="Natijalar voronkasi"
          caption="Ko'rishdan yetkazib berishgacha"
        />
        <Funnel data={data.funnel} />
      </Panel>

      {data.topProducts.length > 0 && (
        <Panel className="p-4">
          <SectionHeading
            title="Yaxshi ishlayotgan mahsulotlar"
            caption="Tanlangan davr natijasi"
          />
          <div className="mt-2 divide-y divide-[var(--line)]">
            {data.topProducts.slice(0, 4).map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-3 py-3 first:pt-1"
              >
                <span className="w-5 text-center text-xs font-black text-[var(--muted)]">
                  {index + 1}
                </span>
                <ProductImage
                  src={product.thumbnailUrl}
                  alt={product.nameUz}
                  className="h-12 w-10 shrink-0 rounded-lg"
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
                <StatusChip tone="success">
                  +{formatMoney(product.expectedBonus)}
                </StatusChip>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {!data.recentActivity.length && !data.topProducts.length ? (
        <EmptyState
          title="Birinchi referalingizni yarating"
          description="Bozor bo'limidan mahsulot tanlab, auditoriyangiz bilan ulashing."
        />
      ) : (
        <Panel className="p-4">
          <SectionHeading title="So'nggi faollik" />
          <ActivityList items={data.recentActivity} />
        </Panel>
      )}
    </div>
  );
}
