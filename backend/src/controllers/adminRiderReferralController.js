import { apiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import {
  adminListRiderReferrals,
  adminGetRiderReferral,
  RIDER_REFERRAL_STAGES,
  RIDER_REFERRAL_TOTAL,
} from "../services/riderReferralService.js";

// GET /api/admin/rider-referrals?page=1&limit=30&search=
export const listRiderReferrals = async (req, res) => {
  const page  = Math.max(1, Number(req.query.page  || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
  const search = (req.query.search || "").trim();

  const data = await adminListRiderReferrals({ page, limit, search });

  res.status(200).json(
    apiResponse({
      message: "Rider referrals fetched",
      data: {
        ...data,
        stagesConfig: RIDER_REFERRAL_STAGES,
        totalPossiblePerReferral: RIDER_REFERRAL_TOTAL,
      },
    }),
  );
};

// GET /api/admin/rider-referrals/:id
export const getRiderReferralDetail = async (req, res) => {
  const rr = await adminGetRiderReferral(req.params.id);
  if (!rr) throw new ApiError(404, "Rider referral not found");

  res.status(200).json(
    apiResponse({ message: "Rider referral detail fetched", data: rr }),
  );
};
