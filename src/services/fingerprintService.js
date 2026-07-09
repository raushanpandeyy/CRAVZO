const FINGERPRINT_STORAGE_KEY = "cravzoFingerprintHash";

let fingerprintPromise = null;

const getStoredFingerprint = () => sessionStorage.getItem(FINGERPRINT_STORAGE_KEY) || null;

const getFingerprintHash = async () => {
  const cached = getStoredFingerprint();
  if (cached) return cached;

  if (!fingerprintPromise) {
    fingerprintPromise = import("@fingerprintjs/fingerprintjs")
      .then((module) => module.default.load())
      .then((agent) => agent.get())
      .then((result) => {
        sessionStorage.setItem(FINGERPRINT_STORAGE_KEY, result.visitorId);
        return result.visitorId;
      })
      .catch(() => null);
  }

  return fingerprintPromise;
};

export { getFingerprintHash, getStoredFingerprint };
