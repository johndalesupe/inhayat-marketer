import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type {
  ApiEnvelope,
  BulkReferralCreateResult,
  BulkReferralPublishResult,
  BulkReferralSelection,
  DashboardRange,
  MarketerBot,
  MarketerBotChat,
  MarketerCategory,
  MarketerDashboard,
  MarketerOrder,
  MarketerPublicationBatch,
  MarketerProduct,
  MarketerProfile,
  MarketerPublicationJob,
  MarketerReferral,
  OtpRequestResponse,
  PaginatedData,
  ReferralStatus,
  TelegramAuthResponse,
} from "@/src/types/marketer";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_MARKETER_API_URL ?? "http://localhost:3012"
).replace(/\/+$/, "");

let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

async function request<T>(config: AxiosRequestConfig) {
  const response = await apiClient.request<ApiEnvelope<T> | T>(config);
  return unwrap(response.data);
}

export function apiErrorMessage(
  error: unknown,
  fallback = "So'rovni bajarib bo'lmadi",
) {
  if (axios.isAxiosError(error)) {
    const payload = (error as AxiosError<{ message?: string | string[] }>)
      .response?.data;
    if (typeof payload?.message === "string") return payload.message;
    if (Array.isArray(payload?.message) && payload.message[0]) {
      return payload.message[0];
    }
    if (error.code === "ECONNABORTED") {
      return "Server javobi kutilganidan uzoq davom etdi";
    }
    if (!error.response)
      return "Internet aloqasini tekshirib qayta urinib ko'ring";
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type PageQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  sort?: string;
  available?: boolean;
};

export const marketerApi = {
  authenticate: (initData: string, startParam?: string) =>
    request<TelegramAuthResponse>({
      url: "/api/v1/marketer/auth/telegram",
      method: "POST",
      data: { initData, ...(startParam ? { startParam } : {}) },
    }),

  profile: () =>
    request<MarketerProfile>({
      url: "/api/v1/marketer/profile",
    }),

  dashboard: (range: DashboardRange) =>
    request<MarketerDashboard>({
      url: "/api/v1/marketer/dashboard",
      params: { range },
    }),

  products: (params: PageQuery) =>
    request<PaginatedData<MarketerProduct>>({
      url: "/api/v1/marketer/products",
      params,
    }),

  topProducts: () =>
    request<MarketerProduct[]>({
      url: "/api/v1/marketer/products/top",
      params: { limit: 4 },
    }),

  productCategories: () =>
    request<MarketerCategory[]>({
      url: "/api/v1/marketer/products/categories",
    }),

  referrals: (params: PageQuery & { status?: ReferralStatus | "all" }) =>
    request<PaginatedData<MarketerReferral>>({
      url: "/api/v1/marketer/referrals",
      params: {
        ...params,
        status: params.status === "all" ? undefined : params.status,
      },
    }),

  createReferral: (payload: {
    name: string;
    productId: string;
    idempotencyKey: string;
  }) =>
    request<MarketerReferral>({
      url: "/api/v1/marketer/referrals",
      method: "POST",
      data: payload,
      headers: { "Idempotency-Key": payload.idempotencyKey },
    }),

  bulkCreateReferrals: (
    payload: BulkReferralSelection & {
      namePrefix?: string;
      idempotencyKey: string;
    },
  ) =>
    request<BulkReferralCreateResult>({
      url: "/api/v1/marketer/referrals/bulk",
      method: "POST",
      data: payload,
      headers: { "Idempotency-Key": payload.idempotencyKey },
    }),

  bulkPublishReferrals: (payload: {
    referralIds: string[];
    chatIds: string[];
    languages: Array<"uz" | "ru">;
    idempotencyKey: string;
  }) =>
    request<BulkReferralPublishResult>({
      url: "/api/v1/marketer/referrals/bulk/publish",
      method: "POST",
      data: payload,
      headers: { "Idempotency-Key": payload.idempotencyKey },
    }),

  updateReferral: (
    referralId: string,
    payload: { name?: string; status?: ReferralStatus },
  ) =>
    request<MarketerReferral>({
      url: `/api/v1/marketer/referrals/${encodeURIComponent(referralId)}`,
      method: "PATCH",
      data: payload,
    }),

  publishReferral: (
    referralId: string,
    payload: { chatIds: string[]; language: "uz" | "ru" },
  ) =>
    request<{ queued: number; jobId?: string }>({
      url: `/api/v1/marketer/referrals/${encodeURIComponent(referralId)}/publish`,
      method: "POST",
      data: payload,
    }),

  publicationJob: (jobId: string) =>
    request<MarketerPublicationJob>({
      url: `/api/v1/marketer/publications/${encodeURIComponent(jobId)}`,
    }),

  publicationBatch: (batchId: string) =>
    request<MarketerPublicationBatch>({
      url: `/api/v1/marketer/publications/batches/${encodeURIComponent(batchId)}`,
    }),

  requestPhoneOtp: (phoneNumber: string) =>
    request<OtpRequestResponse>({
      url: "/api/v1/marketer/auth/phone/request-otp",
      method: "POST",
      data: { phoneNumber },
    }),

  verifyPhoneOtp: (phoneNumber: string, code: string) =>
    request<MarketerProfile>({
      url: "/api/v1/marketer/auth/phone/verify-otp",
      method: "POST",
      data: { phoneNumber, code },
    }),

  bot: () =>
    request<MarketerBot | null>({
      url: "/api/v1/marketer/bot",
    }),

  connectBot: (token: string, label?: string) =>
    request<MarketerBot>({
      url: "/api/v1/marketer/bot/connect",
      method: "POST",
      data: { token, ...(label ? { label } : {}) },
    }),

  updateBot: (payload: { label?: string; token?: string }) =>
    request<MarketerBot>({
      url: "/api/v1/marketer/bot",
      method: "PATCH",
      data: payload,
    }),

  botAction: (action: "start" | "stop" | "restart" | "retry") =>
    request<MarketerBot>({
      url: `/api/v1/marketer/bot/${action}`,
      method: "POST",
    }),

  removeBot: () =>
    request<{ removed: true }>({
      url: "/api/v1/marketer/bot",
      method: "DELETE",
    }),

  botChats: () =>
    request<MarketerBotChat[]>({
      url: "/api/v1/marketer/bot/chats",
    }),

  orders: (params: PageQuery) =>
    request<PaginatedData<MarketerOrder>>({
      url: "/api/v1/marketer/orders",
      params,
    }),
};
