import { storage } from "./storage";

export const PRIVACY_CONSENT_VERSION = "dpdp-2026-07-24";
export const PRIVACY_CONSENT_KEY = "dodagoPrivacyConsent";

export const defaultConsent = {
  version: PRIVACY_CONSENT_VERSION,
  essential: true,
  location: false,
  notifications: false,
  media: false,
  marketing: false,
  ageConfirmed: false,
  acceptedNotice: false,
  updatedAt: null,
};

export const getPrivacyConsent = () => {
  const raw = storage.getString(PRIVACY_CONSENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    storage.delete(PRIVACY_CONSENT_KEY);
    return null;
  }
};

export const hasCurrentPrivacyConsent = () => {
  const consent = getPrivacyConsent();
  return Boolean(
    consent?.version === PRIVACY_CONSENT_VERSION &&
    consent?.acceptedNotice &&
    consent?.ageConfirmed
  );
};

export const savePrivacyConsent = (updates = {}) => {
  const next = {
    ...defaultConsent,
    ...(getPrivacyConsent() || {}),
    ...updates,
    version: PRIVACY_CONSENT_VERSION,
    essential: true,
    updatedAt: new Date().toISOString(),
  };
  storage.set(PRIVACY_CONSENT_KEY, JSON.stringify(next));
  return next;
};

export const updatePrivacyConsent = (updates = {}) => savePrivacyConsent(updates);

export const clearPrivacyConsent = () => {
  storage.delete(PRIVACY_CONSENT_KEY);
};

export const isConsentEnabled = (key) => Boolean(getPrivacyConsent()?.[key]);
