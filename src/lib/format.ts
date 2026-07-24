const numberFormatter = new Intl.NumberFormat("uz-UZ");
const compactFormatter = new Intl.NumberFormat("uz-UZ", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMoney(value?: number | null) {
  return `${numberFormatter.format(Math.round(value ?? 0))} so'm`;
}

export function formatCompact(value?: number | null) {
  return compactFormatter.format(value ?? 0);
}

export function formatPercent(value?: number | null) {
  return `${numberFormatter.format(Number((value ?? 0).toFixed(1)))}%`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export function initials(firstName?: string, lastName?: string | null) {
  return [firstName, lastName]
    .filter(Boolean)
    .map((part) => part?.trim()[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export function classNames(
  ...values: Array<string | false | null | undefined>
) {
  return values.filter(Boolean).join(" ");
}

