import { applyReferralSchema } from "../validators/referralValidators.js";
import { apiResponse } from "../utils/apiResponse.js";
import { applyReferralCode, getMyReferralStats } from "../services/referralService.js";

const getMyReferral = async (req, res) => {
  const stats = await getMyReferralStats(req.user.sub);

  res.status(200).json(
    apiResponse({
      message: "Referral stats fetched successfully",
      data: stats,
    }),
  );
};

const applyReferral = async (req, res) => {
  const { referralCode } = applyReferralSchema.parse(req.body);

  const result = await applyReferralCode(req.user.sub, referralCode);

  res.status(200).json(
    apiResponse({
      message: "Referral code applied successfully",
      data: result,
    }),
  );
};

export { applyReferral, getMyReferral };