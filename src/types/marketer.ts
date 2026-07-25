export type DashboardRange = "7d" | "30d" | "90d";
export type ReferralStatus = "active" | "paused" | "archived";
export type MarketerBotStatus =
  | "not_connected"
  | "connecting"
  | "running"
  | "stopped"
  | "error";

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

export type PaginatedData<T> = {
  items: T[];
  meta: PageMeta;
};

export type WalletSummary = {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
};

export type MarketerWithdrawalStatus =
  | "pending"
  | "approved"
  | "paid"
  | "canceled";

export type MarketerWithdrawalStatusEvent = {
  status: MarketerWithdrawalStatus;
  note?: string | null;
  at: string;
  actorType: "marketer" | "admin" | "system";
};

export type MarketerWithdrawalActivity = {
  id: string;
  kind: "withdrawal";
  amount: number;
  status: MarketerWithdrawalStatus;
  cardMasked: string;
  cardLastFour: string;
  cardHolderName: string;
  currentNote?: string | null;
  proofImageUrl?: string | null;
  statusHistory: MarketerWithdrawalStatusEvent[];
  requestedAt: string;
  updatedAt: string;
};

export type WalletActivityType =
  | "commission"
  | "reversal"
  | "adjustment"
  | "withdrawal";

export type MarketerWalletTransactionActivity = {
  id: string;
  kind: "transaction";
  type: WalletActivityType;
  direction: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  note?: string | null;
  createdAt: string;
};

export type MarketerWalletActivity =
  | MarketerWalletTransactionActivity
  | MarketerWithdrawalActivity;

export type MarketerWalletOverview = {
  currency: "UZS";
  availableBalance: number;
  pendingBalance: number;
  heldBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  minimumWithdrawalAmount: number;
  canWithdraw: boolean;
  phoneVerified: boolean;
};

export type MarketerWithdrawalRequestResult = {
  withdrawal: MarketerWithdrawalActivity;
  reused: boolean;
  wallet: {
    availableBalance: number;
    heldBalance: number;
  };
};

export type MarketerProfile = {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  joinedAt: string;
  wallet: WalletSummary;
  program: {
    enabled: boolean;
    defaultBonusPercent: number;
    attributionWindowHours: number;
  };
};

export type DashboardMetric = {
  value: number;
  changePercent?: number | null;
};

export type DashboardTrendPoint = {
  date: string;
  orders: number;
  salesAmount: number;
  bonusAmount: number;
};

export type DashboardFunnel = {
  views: number;
  visitors: number;
  uniqueCustomers: number;
  orders: number;
  deliveredOrders: number;
};

export type ProductSnapshot = {
  id: string;
  numericId: number;
  nameUz: string;
  nameRu?: string | null;
  thumbnailUrl?: string | null;
  price: number;
  discountPrice?: number | null;
};

export type MarketerProduct = ProductSnapshot & {
  categoryId?: string | null;
  categoryName?: string | null;
  isAvailable: boolean;
  isTop: boolean;
  rank?: number | null;
  expectedBonus: number;
  bonusPercent: number;
  orderCount?: number;
};

export type MarketerCategory = {
  id: string;
  name: string;
  productCount: number;
};

export type DashboardActivity = {
  id: string;
  type: "view" | "order" | "bonus" | "reversal" | "payout" | "referral";
  title: string;
  detail?: string | null;
  amount?: number | null;
  createdAt: string;
};

export type MarketerDashboard = {
  profile: MarketerProfile;
  wallet: WalletSummary;
  today: {
    sales: DashboardMetric;
    orders: DashboardMetric;
    bonus: DashboardMetric;
    conversion: DashboardMetric;
  };
  funnel: DashboardFunnel;
  trend: DashboardTrendPoint[];
  topProducts: MarketerProduct[];
  recentActivity: DashboardActivity[];
  program: {
    enabled: boolean;
    defaultBonusPercent: number;
    attributionWindowHours: number;
  };
  generatedAt: string;
};

export type ReferralStats = {
  views: number;
  visitors: number;
  uniqueCustomers: number;
  orders: number;
  deliveredOrders: number;
  revenue: number;
  bonus: number;
  conversionPercent: number;
};

export type MarketerReferral = {
  id: string;
  name: string;
  code: string;
  link: string;
  status: ReferralStatus;
  product: ProductSnapshot;
  expectedBonus: number;
  bonusPercent: number;
  stats: ReferralStats;
  createdAt: string;
  updatedAt: string;
};

export type BulkReferralSelection =
  | {
      productIds: string[];
      categoryId?: never;
      allInCategory?: false;
    }
  | {
      productIds?: never;
      categoryId: string;
      allInCategory: true;
    };

export type BulkReferralCreateResult = {
  referrals: MarketerReferral[];
  createdCount: number;
  reusedCount: number;
};

export type BulkReferralPublishResult = {
  queued: number;
  targetDeliveries: number;
  batchId: string;
  jobIds: string[];
};

export type PublicationJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type MarketerPublicationJob = {
  jobId: string;
  status: PublicationJobStatus;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  results: Array<{
    chatId: number;
    ok: boolean;
    messageId?: number;
    error?: string;
  }>;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

export type MarketerPublicationBatch = {
  batchId: string;
  status: PublicationJobStatus | "partial";
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalDeliveries: number;
  sentCount: number;
  failedCount: number;
  jobs: Array<{
    jobId: string;
    status: PublicationJobStatus;
    totalCount: number;
    sentCount: number;
    failedCount: number;
    error?: string | null;
  }>;
  createdAt: string;
  completedAt: string | null;
};

export type BotPermissionSet = {
  canPostMessages: boolean;
  canEditMessages: boolean;
  canDeleteMessages: boolean;
  canInviteUsers: boolean;
};

export type MarketerBotChat = {
  id: string;
  chatId: string;
  title: string;
  username?: string | null;
  type: "group" | "supergroup" | "channel";
  role: "creator" | "administrator" | "member" | "unknown";
  permissions: BotPermissionSet;
  canPublish: boolean;
  lastCheckedAt?: string | null;
};

export type MarketerBot = {
  id: string;
  username: string;
  displayName: string;
  label?: string | null;
  status: MarketerBotStatus;
  isRunning: boolean;
  lastError?: string | null;
  lastHeartbeatAt?: string | null;
  connectedChatsCount: number;
  publishableChatsCount: number;
  updatedAt: string;
};

export type MarketerOrderItem = {
  id: string;
  numericId: number;
  nameUz: string;
  thumbnailUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type MarketerOrder = {
  id: string;
  orderNumber: string;
  status:
    | "new"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned"
    | "none";
  region: string;
  city: string;
  items: MarketerOrderItem[];
  itemCount: number;
  productSubtotal: number;
  bonusAmount: number;
  bonusStatus: "none" | "pending" | "available" | "paid" | "reversed";
  createdAt: string;
};

export type TelegramAuthResponse = {
  accessToken: string;
  marketer: MarketerProfile;
  isNewMarketer?: boolean;
};

export type OtpRequestResponse = {
  phoneNumber: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string | string[];
};
