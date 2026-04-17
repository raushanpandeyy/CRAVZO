import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const serializeReview = (review) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
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
  const reviews = await prisma.review.findMany({
    where: {
      userId: req.user.sub,
    },
    include: {
      restaurant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Your reviews fetched successfully",
      data: reviews.map(serializeReview),
    }),
  );
};

const listRestaurantReviews = async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: {
      restaurantId: req.params.restaurantId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      restaurant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Restaurant reviews fetched successfully",
      data: reviews.map(serializeReview),
    }),
  );
};

const upsertReview = async (req, res) => {
  const { restaurantId, rating, comment = null } = req.body;

  if (!restaurantId || !rating) {
    throw new ApiError(400, "Restaurant and rating are required");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be an integer between 1 and 5");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      status: "ACTIVE",
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      userId: req.user.sub,
      restaurantId,
    },
    select: { id: true },
  });

  const review = existingReview
    ? await prisma.review.update({
        where: {
          id: existingReview.id,
        },
        data: {
          rating,
          comment: comment?.trim() || null,
        },
        include: {
          restaurant: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
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
          restaurant: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

  res.status(200).json(
    apiResponse({
      message: "Review saved successfully",
      data: serializeReview(review),
    }),
  );
};

const deleteReview = async (req, res) => {
  const review = await prisma.review.findFirst({
    where: {
      id: req.params.reviewId,
      userId: req.user.sub,
    },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  await prisma.review.delete({
    where: {
      id: req.params.reviewId,
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Review deleted successfully",
      data: {
        reviewId: req.params.reviewId,
      },
    }),
  );
};

export { deleteReview, listMyReviews, listRestaurantReviews, upsertReview };
