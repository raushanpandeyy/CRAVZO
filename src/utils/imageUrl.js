const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const isLocalOrPrivateHost = (hostname) => {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (LOCAL_HOSTS.has(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  if (/^10\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  return false;
};

export const isUnsafeImageUrl = (url) => {
  if (!url || typeof url !== "string") return true;
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;

  try {
    const parsed = new URL(url, window.location.origin);
    if (isLocalOrPrivateHost(parsed.hostname)) return true;
    return window.location.protocol === "https:" && parsed.protocol === "http:";
  } catch {
    return true;
  }
};

export const getSafeImageUrl = (url, fallback = TRANSPARENT_PIXEL) => (
  isUnsafeImageUrl(url) ? fallback : url
);