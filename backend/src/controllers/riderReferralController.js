import { apiResponse } from "../utils/apiResponse.js";
import { getRiderReferralStats } from "../services/riderReferralService.js";

// GET /api/rider/referral
export const getRiderReferralStatsController = async (req, res) => {
  const stats = await getRiderReferralStats(req.user.sub);
  res.status(200).json(
    apiResponse({ message: "Rider referral stats fetched", data: stats }),
  );
};
