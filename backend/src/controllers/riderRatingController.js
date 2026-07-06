import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const createRiderRating = async (req, res) => {
  const { orderId, riderId, rating, comment = null } = req.body;

  if (!orderId || !riderId || !rating) {
    throw new ApiError(400, "orderId, riderId, and rating are required");
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, riderId: true, status: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.customerId !== req.user.sub) {
    throw new ApiError(403, "You can only rate your own orders");
  }

  if (order.riderId !== riderId) {
    throw new ApiError(400, "This rider was not assigned to this order");
  }

  if (order.status !== "DELIVERED") {
    throw new ApiError(400, "You can only rate after delivery");
  }

  const existing = await prisma.riderRating.findUnique({
    where: { orderId },
  });

  const riderRating = existing
    ? await prisma.riderRating.update({
        where: { orderId },
        data: { rating, comment: comment?.trim() || null },
        include: {
          rider: { select: { id: true, name: true, avatarUrl: true } },
        },
      })
    : await prisma.riderRating.create({
        data: {
          orderId,
          userId: req.user.sub,
          riderId,
          rating,
          comment: comment?.trim() || null,
        },
        include: {
          rider: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

  res.status(existing ? 200 : 201).json(
    apiResponse({
      message: "Rider rating saved successfully",
      data: {
        id: riderRating.id,
        orderId: riderRating.orderId,
        riderId: riderRating.riderId,
        rating: riderRating.rating,
        comment: riderRating.comment,
        createdAt: riderRating.createdAt,
        rider: riderRating.rider,
      },
    }),
  );
};

const getMyRatings = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const [ratings, total] = await Promise.all([
    prisma.riderRating.findMany({
      where: { userId: req.user.sub },
      include: {
        rider: {
          select: { id: true, name: true, avatarUrl: true },
        },
        order: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.riderRating.count({ where: { userId: req.user.sub } }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Your rider ratings fetched successfully",
      data: ratings.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        riderId: r.riderId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        rider: r.rider,
        order: r.order,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
};

const getRiderRatings = async (req, res) => {
  const { riderId } = req.params;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const rider = await prisma.user.findUnique({
    where: { id: riderId },
    select: { id: true, role: true },
  });

  if (!rider || rider.role !== "RIDER") {
    throw new ApiError(404, "Rider not found");
  }

  const [ratings, total, aggregation] = await Promise.all([
    prisma.riderRating.findMany({
      where: { riderId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        order: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.riderRating.count({ where: { riderId } }),
    prisma.riderRating.aggregate({
      where: { riderId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Rider ratings fetched successfully",
      data: {
        averageRating: aggregation._avg.rating ? Number(aggregation._avg.rating.toFixed(1)) : null,
        totalRatings: aggregation._count.rating,
        ratings: ratings.map((r) => ({
          id: r.id,
          orderId: r.orderId,
          userId: r.userId,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          user: r.user,
          order: r.order,
        })),
      },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
};

export { createRiderRating, getMyRatings, getRiderRatings };
