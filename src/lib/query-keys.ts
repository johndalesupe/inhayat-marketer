import type { DashboardRange, ReferralStatus } from "@/src/types/marketer";

export const marketerKeys = {
  all: ["marketer"] as const,
  profile: ["marketer", "profile"] as const,
  dashboard: (range: DashboardRange) =>
    ["marketer", "dashboard", range] as const,
  products: (filters: Record<string, unknown>) =>
    ["marketer", "products", filters] as const,
  product: (productId: string) =>
    ["marketer", "products", "detail", productId] as const,
  topProducts: ["marketer", "products", "top"] as const,
  productCategories: ["marketer", "products", "categories"] as const,
  referralsRoot: ["marketer", "referrals"] as const,
  referrals: (filters: { search: string; status: ReferralStatus | "all" }) =>
    ["marketer", "referrals", filters] as const,
  publication: (jobId: string) => ["marketer", "publications", jobId] as const,
  publicationBatch: (batchId: string) =>
    ["marketer", "publications", "batches", batchId] as const,
  bot: ["marketer", "bot"] as const,
  botChats: ["marketer", "bot", "chats"] as const,
  orders: (filters: { status: string; search: string }) =>
    ["marketer", "orders", filters] as const,
  wallet: ["marketer", "wallet"] as const,
  walletActivityRoot: ["marketer", "wallet", "activity"] as const,
  walletActivity: ["marketer", "wallet", "activity"] as const,
};
