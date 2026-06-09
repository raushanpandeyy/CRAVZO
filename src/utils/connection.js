const getConnection = () => {
  if (typeof navigator === "undefined") return null;
  return navigator.connection || null;
};

export const getEffectiveConnectionType = () => {
  const conn = getConnection();
  if (!conn) return "unknown";
  return conn.effectiveType || "unknown";
};

export const isSlowConnection = () => {
  const type = getEffectiveConnectionType();
  return type === "slow-2g" || type === "2g";
};

export const isDataSaverMode = () => {
  const conn = getConnection();
  return conn?.saveData === true;
};

export const shouldReduceQuality = () => {
  if (isDataSaverMode()) return true;
  const type = getEffectiveConnectionType();
  return type === "slow-2g" || type === "2g" || type === "3g";
};

export const getImageQualityParams = () => {
  if (shouldReduceQuality()) {
    return "q_auto:low,e_improve:100";
  }
  return "q_auto";
};

export const getImageWidth = (defaultWidth) => {
  if (isSlowConnection()) return Math.floor(defaultWidth * 0.5);
  if (getEffectiveConnectionType() === "3g") return Math.floor(defaultWidth * 0.75);
  return defaultWidth;
};

export const getDeviceMemory = () => {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.deviceMemory || "unknown";
};

export const isLowEndDevice = () => {
  const mem = getDeviceMemory();
  if (typeof mem === "number" && mem < 2) return true;
  const conn = getConnection();
  if (conn?.effectiveType === "slow-2g") return true;
  return false;
};
