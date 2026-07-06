import { prisma } from "../config/database.js";
import { initiateRazorpayRefund, fetchRazorpayRefund } from "../services/razorpayRefundService.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { deleteCache } from "../utils/cache.js";

const getRefundableOrder = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "CANCELLED") {
    throw new ApiError(409, "Only cancelled orders can be refunded from the admin panel");
  }
  if (order.paymentMethod === "COD") {
    throw new ApiError(409, "COD orders do not have an online payment to refund");
  }
  return order;
};

const initiateAdminRefund = async (req, res) => {
  if (req.body?.confirmation !== "REFUND") {
    throw new ApiError(400, 'Send confirmation: "REFUND" to initiate this irreversible action');
  }
  const order = await getRefundableOrder(req.params.orderId);
  if (order.refundId) {
    throw new ApiError(409, "A Razorpay refund already exists; reconcile its status instead");
  }
  if (order.paymentStatus !== "PAID") {
    throw new ApiError(409, "Only a paid order without an existing refund can be refunded");
  }

  const amount = Number(order.refundAmount ?? order.totalAmount);
  const refund = await initiateRazorpayRefund({
    paymentId: order.gatewayPaymentId,
    amount,
    orderId: order.id,
    customerId: order.customerId,
  });
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: refund.status === "processed" ? "REFUNDED" : "REFUND_PENDING",
      refundId: refund.id,
      refundStatus: refund.status,
      refundAmount: amount,
      refundInitiatedAt: new Date(),
    },
  });
  await deleteCache("admin:overview");
  res.status(200).json(apiResponse({ message: "Razorpay refund initiated", data: updated }));
};

const reconcileAdminRefund = async (req, res) => {
  const order = await getRefundableOrder(req.params.orderId);
  if (!order.refundId) throw new ApiError(409, "This order has no Razorpay refund to reconcile");

  const refund = await fetchRazorpayRefund({ refundId: order.refundId });
  const paymentStatus = refund.status === "processed"
    ? "REFUNDED"
    : refund.status === "failed"
      ? "PAID"
      : "REFUND_PENDING";
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus, refundStatus: refund.status },
  });
  await deleteCache("admin:overview");
  res.status(200).json(apiResponse({ message: "Refund status reconciled with Razorpay", data: updated }));
};

export { initiateAdminRefund, reconcileAdminRefund };