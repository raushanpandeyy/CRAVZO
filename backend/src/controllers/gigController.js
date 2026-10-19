import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {
  bookGig,
  endGig,
  getActiveGig,
  getGigStats,
  GIG_TIERS,
  MIN_GIG_HOURS,
} from "../services/gigService.js";

// POST /api/rider/gig/book
// Body: { durationHours: number }
export const bookGigController = async (req, res) => {
  const riderId = req.user.sub;
  const durationHours = Number(req.body.durationHours);

  if (!Number.isFinite(durationHours) || durationHours < MIN_GIG_HOURS) {
    throw new ApiError(400, `durationHours must be a number ≥ ${MIN_GIG_HOURS}`);
  }

  const gig = await bookGig(riderId, durationHours);
  res.status(201).json(apiResponse({ message: "Gig booked successfully", data: gig }));
};

// POST /api/rider/gig/end
// Rider manually ends their active gig (going offline triggers this too)
export const endGigController = async (req, res) => {
  const riderId = req.user.sub;
  const gig = await endGig(riderId, { endedEarly: true });

  if (!gig) {
    throw new ApiError(404, "No active gig found");
  }

  res.status(200).json(apiResponse({ message: "Gig ended", data: gig }));
};

// GET /api/rider/gig/active
export const getActiveGigController = async (req, res) => {
  const riderId = req.user.sub;
  const gig = await getActiveGig(riderId);
  res.status(200).json(apiResponse({ message: "Active gig fetched", data: gig }));
};

// GET /api/rider/gig/stats
export const getGigStatsController = async (req, res) => {
  const riderId = req.user.sub;
  const stats = await getGigStats(riderId);
  res.status(200).json(apiResponse({ message: "Gig stats fetched", data: stats }));
};

// GET /api/rider/gig/tiers  — public-ish, no auth needed beyond RIDER
export const getGigTiersController = async (_req, res) => {
  res.status(200).json(
    apiResponse({
      message: "Gig incentive tiers",
      data: { tiers: GIG_TIERS, minDurationHours: MIN_GIG_HOURS },
    }),
  );
};
