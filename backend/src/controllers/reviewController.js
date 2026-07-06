import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { deleteCache, getCache, setCache } from "../utils/cache.js";
import { upsertReviewSchema } from "../validators/reviewValidators.js";

// Fix #8: Cache restaurant reviews.
// listRestaurantReviews is called on every restaurant page load with no cache.
// Reviews don't change often â€” 2-minute TTL is a good tradeoff.
import { REVIEWS_CACHE_TTL_SECONDS } from "../utils/publicCache.js";

const REVIEW_CACHE_TTL = REVIEWS_CACHE_TTL_SECONDS;
const reviewCacheKey = (restaurantId) => `reviews:restaurant:${restaurantId}`;

const serializeReview = (review) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  reply: review.reply,
  replyDate: review.replyDate,
  createdAt: review.createdAt,
  restaurant: review.restaurant
    ? {
        id: review.restaurant.id,
        name: review.restaurant.name,
        imageUrl: review.restaurant.imageUrl,
      }
    : null,
  user: review.user
    ? {
        id: review.user.id,
        name: review.user.name,
        avatarUrl: review.user.avatarUrl,
      }
    : null,
});

const listMyReviews = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId: req.user.sub },
      include: {
        restaurant: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { userId: req.user.sub } }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Your reviews fetched successfully",
      data: reviews.map(serializeReview),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }),
  );
};

const listRestaurantReviews = async (req, res) => {
  const { restaurantId } = req.params;
  const cacheKey = reviewCacheKey(restaurantId);

  // Fix #8: Serve from Redis if available
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json(
      apiResponse({
        message: "Restaurant reviews fetched successfully",
        data: cached,
      }),
    );
  }

  const reviews = await prisma.review.findMany({
    where: { restaurantId },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
      restaurant: {
        select: { id: true, name: true, imageUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = reviews.map(serializeReview);
  await setCache(cacheKey, serialized, REVIEW_CACHE_TTL);

  res.status(200).json(
    apiResponse({
      message: "Restaurant reviews fetched successfully",
      data: serialized,
    }),
  );
};

const upsertReview = async (req, res) => {
  const { restaurantId, rating, comment = null } = upsertReviewSchema.parse(req.body);

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, status: "ACTIVE" },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }
  const deliveredOrder = await prisma.order.findFirst({
    where: {
      customerId: req.user.sub,
      restaurantId,
      status: "DELIVERED",
    },
    select: { id: true },
  });
  if (!deliveredOrder) {
    throw new ApiError(403, "You can review this restaurant after a delivered order");
  }

  const existingReview = await prisma.review.findFirst({
    where: { userId: req.user.sub, restaurantId },
    select: { id: true },
  });

  const review = existingReview
    ? await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment?.trim() || null,
        },
        include: {
          restaurant: { select: { id: true, name: true, imageUrl: true } },
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      })
    : await prisma.review.create({
        data: {
          userId: req.user.sub,
          restaurantId,
          rating,
          comment: comment?.trim() || null,
        },
        include: {
          restaurant: { select: { id: true, name: true, imageUrl: true } },
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

  // Fix #8: Invalidate the reviews cache for this restaurant on write
  await deleteCache(reviewCacheKey(restaurantId));

  res.status(200).json(
    apiResponse({
      message: "Review saved successfully",
      data: serializeReview(review),
    }),
  );
};

const deleteReview = async (req, res) => {
  const review = await prisma.review.findFirst({
    where: { id: req.params.reviewId, userId: req.user.sub },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  await prisma.review.delete({ where: { id: req.params.reviewId } });

  // Fix #8: Invalidate cache on delete
  await deleteCache(reviewCacheKey(review.restaurantId));

  res.status(200).json(
    apiResponse({
      message: "Review deleted successfully",
      data: { reviewId: req.params.reviewId },
    }),
  );
};

const replyToReview = async (req, res) => {
  const { reviewId } = req.params;
  const { reply } = req.body;

  if (!reply || !reply.trim()) {
    throw new ApiError(400, "Reply text is required");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { restaurant: { select: { vendorId: true } } },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (req.user.role === "VENDOR" && review.restaurant.vendorId !== req.user.sub) {
    throw new ApiError(403, "You do not have permission to reply to this review");
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      reply: reply.trim(),
      replyDate: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      restaurant: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  await deleteCache(reviewCacheKey(review.restaurantId));

  res.status(200).json(
    apiResponse({
      message: "Reply submitted successfully",
      data: serializeReview(updated),
    }),
  );
};

export { deleteReview, listMyReviews, listRestaurantReviews, replyToReview, upsertReview };
