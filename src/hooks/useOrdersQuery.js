import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyOrders, cancelOrder } from "../services/orderService.js";

const ORDERS_KEY = ["orders"];

export function useMyOrders() {
  return useQuery({
    queryKey: ORDERS_KEY,
    queryFn: () => getMyOrders(),
    select: (data) => (Array.isArray(data) ? data : data?.orders ?? []),
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const orders = query.state.data || [];
      const hasActive = orders.some((o) =>
        ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status),
      );
      return hasActive ? 45000 : false;
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}
