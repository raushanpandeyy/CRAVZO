import { z } from "zod";

import { env } from "../config/env.js";
import { getCache, setCache } from "../utils/cache.js";

const SETTINGS_KEY = "settings:pricing";

const pricingSettingsSchema = z.object({
  rainChargeEnabled: z.boolean().default(false),
  rainChargeAmount: z.coerce.number().min(0).max(500).default(25),
});

const defaultPricingSettings = () => ({
  rainChargeEnabled: Boolean(env.RAIN_CHARGE_ENABLED),
  rainChargeAmount: Number(env.RAIN_CHARGE_AMOUNT || 25),
});

const getPricingSettings = async () => {
  const cached = await getCache(SETTINGS_KEY);
  if (!cached) return defaultPricingSettings();
  return pricingSettingsSchema.parse({ ...defaultPricingSettings(), ...cached });
};

const updatePricingSettings = async (payload) => {
  const current = await getPricingSettings();
  const cleanPayload = Object.fromEntries(Object.entries(payload || {}).filter(([, value]) => value !== undefined));
  const next = pricingSettingsSchema.parse({ ...current, ...cleanPayload });
  await setCache(SETTINGS_KEY, next, 30 * 24 * 60 * 60);
  return next;
};

export { getPricingSettings, updatePricingSettings };
