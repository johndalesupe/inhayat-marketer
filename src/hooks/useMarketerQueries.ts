"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { marketerApi } from "@/src/lib/api";
import { marketerKeys } from "@/src/lib/query-keys";
import { useAppSelector } from "@/src/store/hooks";
import type {
  BulkReferralSelection,
  DashboardRange,
  MarketerWalletOverview,
  ReferralStatus,
} from "@/src/types/marketer";

function useApiEnabled() {
  const status = useAppSelector((state) => state.session.status);
  return status === "authenticated" || status === "preview";
}

export function useProfile() {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.profile,
    queryFn: marketerApi.profile,
    enabled,
    retry: false,
  });
}

export function useDashboard(range: DashboardRange) {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.dashboard(range),
    queryFn: () => marketerApi.dashboard(range),
    enabled,
    staleTime: 45_000,
  });
}

export function useTopProducts() {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.topProducts,
    queryFn: marketerApi.topProducts,
    enabled,
    staleTime: 2 * 60_000,
  });
}

export function useProductCategories() {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.productCategories,
    queryFn: marketerApi.productCategories,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useProducts(filters: {
  search: string;
  categoryId: string;
  sort: string;
  available: boolean | null;
}) {
  const enabled = useApiEnabled();
  return useInfiniteQuery({
    queryKey: marketerKeys.products(filters),
    queryFn: ({ pageParam }) =>
      marketerApi.products({
        page: pageParam,
        limit: 20,
        search: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
        sort: filters.sort,
        available: filters.available ?? undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled,
  });
}

export function useProduct(productId: string) {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.product(productId),
    queryFn: () => marketerApi.product(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 2 * 60_000,
  });
}

export function useReferrals(filters: {
  search: string;
  status: ReferralStatus | "all";
}) {
  const enabled = useApiEnabled();
  return useInfiniteQuery({
    queryKey: marketerKeys.referrals(filters),
    queryFn: ({ pageParam }) =>
      marketerApi.referrals({
        page: pageParam,
        limit: 15,
        search: filters.search || undefined,
        status: filters.status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled,
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketerApi.createReferral,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: marketerKeys.referralsRoot,
      });
      void queryClient.invalidateQueries({
        queryKey: ["marketer", "dashboard"],
      });
    },
  });
}

export function useBulkReferralPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: BulkReferralSelection & {
        namePrefix?: string;
        chatIds: string[];
        createIdempotencyKey: string;
        publishIdempotencyKey: string;
      },
    ) => {
      const created = await marketerApi.bulkCreateReferrals({
        ...(payload.productIds
          ? { productIds: payload.productIds }
          : {
              categoryId: payload.categoryId,
              allInCategory: true as const,
            }),
        ...(payload.namePrefix ? { namePrefix: payload.namePrefix } : {}),
        idempotencyKey: payload.createIdempotencyKey,
      });
      const published = await marketerApi.bulkPublishReferrals({
        referralIds: created.referrals.map((referral) => referral.id),
        chatIds: payload.chatIds,
        languages: ["uz", "ru"],
        idempotencyKey: payload.publishIdempotencyKey,
      });
      return { created, published };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: marketerKeys.referralsRoot,
      });
      void queryClient.invalidateQueries({
        queryKey: ["marketer", "dashboard"],
      });
    },
  });
}

export function useUpdateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      referralId,
      status,
      formAuthentication,
      showAddressFields,
    }: {
      referralId: string;
      status?: ReferralStatus;
      formAuthentication?: "otp" | "none";
      showAddressFields?: boolean;
    }) =>
      marketerApi.updateReferral(referralId, {
        ...(status ? { status } : {}),
        ...(formAuthentication ? { formAuthentication } : {}),
        ...(typeof showAddressFields === "boolean"
          ? { showAddressFields }
          : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: marketerKeys.referralsRoot,
      });
    },
  });
}

export function useEnsureReferralStreamLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketerApi.ensureReferralStreamLink,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: marketerKeys.referralsRoot,
      });
    },
  });
}

export function usePublishReferral() {
  return useMutation({
    mutationFn: ({
      referralId,
      chatIds,
      language,
    }: {
      referralId: string;
      chatIds: string[];
      language: "uz" | "ru";
    }) => marketerApi.publishReferral(referralId, { chatIds, language }),
  });
}

export function usePublicationJob(jobId?: string | null) {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.publication(jobId ?? ""),
    queryFn: () => marketerApi.publicationJob(jobId ?? ""),
    enabled: enabled && Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 1_500;
    },
  });
}

export function usePublicationBatch(batchId?: string | null) {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.publicationBatch(batchId ?? ""),
    queryFn: () => marketerApi.publicationBatch(batchId ?? ""),
    enabled: enabled && Boolean(batchId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" ||
        status === "partial" ||
        status === "failed"
        ? false
        : 1_500;
    },
  });
}

export function useBot() {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.bot,
    queryFn: marketerApi.bot,
    enabled,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "connecting" ? 3_000 : 20_000;
    },
  });
}

export function useBotChats(enabledByBot = true) {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.botChats,
    queryFn: marketerApi.botChats,
    enabled: enabled && enabledByBot,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useConnectBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, label }: { token: string; label?: string }) =>
      marketerApi.connectBot(token, label),
    onSuccess: (bot) => {
      queryClient.setQueryData(marketerKeys.bot, bot);
      void queryClient.invalidateQueries({ queryKey: marketerKeys.botChats });
    },
  });
}

export function useUpdateBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketerApi.updateBot,
    onSuccess: (bot) => queryClient.setQueryData(marketerKeys.bot, bot),
  });
}

export function useBotAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketerApi.botAction,
    onSuccess: (bot) => {
      queryClient.setQueryData(marketerKeys.bot, bot);
      void queryClient.invalidateQueries({ queryKey: marketerKeys.botChats });
    },
  });
}

export function useRemoveBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketerApi.removeBot,
    onSuccess: () => {
      queryClient.setQueryData(marketerKeys.bot, null);
      queryClient.removeQueries({ queryKey: marketerKeys.botChats });
    },
  });
}

export function useOrders(filters: { status: string; search: string }) {
  const enabled = useApiEnabled();
  return useInfiniteQuery({
    queryKey: marketerKeys.orders(filters),
    queryFn: ({ pageParam }) =>
      marketerApi.orders({
        page: pageParam,
        limit: 15,
        status: filters.status === "all" ? undefined : filters.status,
        search: filters.search || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled,
  });
}

export function useWallet() {
  const enabled = useApiEnabled();
  return useQuery({
    queryKey: marketerKeys.wallet,
    queryFn: marketerApi.wallet,
    enabled,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useWalletActivity() {
  const enabled = useApiEnabled();
  return useInfiniteQuery({
    queryKey: marketerKeys.walletActivity,
    queryFn: ({ pageParam }) =>
      marketerApi.walletActivity({
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled,
    refetchInterval: 30_000,
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketerApi.requestWithdrawal,
    onSuccess: (result) => {
      queryClient.setQueryData<MarketerWalletOverview>(
        marketerKeys.wallet,
        (current) =>
          current
            ? {
                ...current,
                availableBalance: result.wallet.availableBalance,
                heldBalance: result.wallet.heldBalance,
                canWithdraw:
                  current.phoneVerified &&
                  result.wallet.availableBalance >=
                    current.minimumWithdrawalAmount,
              }
            : current,
      );
      void queryClient.invalidateQueries({ queryKey: marketerKeys.wallet });
      void queryClient.invalidateQueries({
        queryKey: marketerKeys.walletActivityRoot,
      });
      void queryClient.invalidateQueries({ queryKey: marketerKeys.profile });
      void queryClient.invalidateQueries({
        queryKey: ["marketer", "dashboard"],
      });
    },
  });
}
