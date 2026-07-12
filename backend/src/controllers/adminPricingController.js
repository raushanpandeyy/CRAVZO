import { apiResponse } from "../utils/apiResponse.js";
import { getPricingSettings, updatePricingSettings } from "../services/pricingSettingsService.js";

const getAdminPricingSettings = async (req, res) => {
  const settings = await getPricingSettings();
  res.status(200).json(apiResponse({ message: "Pricing settings fetched", data: settings }));
};

const updateAdminPricingSettings = async (req, res) => {
  const settings = await updatePricingSettings({
    rainChargeEnabled: req.body.rainChargeEnabled,
    rainChargeAmount: req.body.rainChargeAmount,
  });
  res.status(200).json(apiResponse({ message: "Pricing settings updated", data: settings }));
};

export { getAdminPricingSettings, updateAdminPricingSettings };