const MINUTES_IN_DAY = 24 * 60;

const parseTimeToMinutes = (value) => {
  if (!value || typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes) => {
  const normalized = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const getCurrentMinutes = (date = new Date()) => date.getHours() * 60 + date.getMinutes();

const minutesUntil = (targetMinutes, currentMinutes = getCurrentMinutes()) => {
  if (targetMinutes === null || targetMinutes === undefined) return null;
  return (targetMinutes - currentMinutes + MINUTES_IN_DAY) % MINUTES_IN_DAY;
};

const isWithinOperatingHours = (openingTime, closingTime, date = new Date()) => {
  const open = parseTimeToMinutes(openingTime);
  const close = parseTimeToMinutes(closingTime);
  if (open === null || close === null) return null;
  const now = getCurrentMinutes(date);
  if (open === close) return true;
  if (open < close) return now >= open && now < close;
  return now >= open || now < close;
};

const getRestaurantHoursStatus = (restaurant, options = {}) => {
  const now = options.now || new Date();
  const closingSoonMinutes = options.closingSoonMinutes ?? 30;
  const openingWindowMinutes = options.openingWindowMinutes ?? 30;
  const openingTime = restaurant?.openingTime;
  const closingTime = restaurant?.closingTime;
  const open = parseTimeToMinutes(openingTime);
  const close = parseTimeToMinutes(closingTime);
  const current = getCurrentMinutes(now);

  if (open === null || close === null) {
    return {
      hasHours: false,
      isWithinHours: null,
      minutesUntilOpen: null,
      minutesUntilClose: null,
      closingSoon: false,
      openingNow: false,
      nextClosingTime: closingTime || null,
      nextOpeningTime: openingTime || null,
    };
  }

  const withinHours = isWithinOperatingHours(openingTime, closingTime, now);
  const untilClose = minutesUntil(close, current);
  const untilOpen = minutesUntil(open, current);
  const minutesSinceOpen = (current - open + MINUTES_IN_DAY) % MINUTES_IN_DAY;

  return {
    hasHours: true,
    isWithinHours: withinHours,
    minutesUntilOpen: untilOpen,
    minutesUntilClose: untilClose,
    closingSoon: withinHours && untilClose <= closingSoonMinutes,
    openingNow: minutesSinceOpen <= openingWindowMinutes,
    nextClosingTime: closingTime,
    nextOpeningTime: openingTime,
  };
};

const getExtendedClosingTime = (closingTime, extraMinutes = 30) => {
  const close = parseTimeToMinutes(closingTime);
  if (close === null) return null;
  return formatMinutesToTime(close + extraMinutes);
};

export {
  formatMinutesToTime,
  getExtendedClosingTime,
  getRestaurantHoursStatus,
  isWithinOperatingHours,
  minutesUntil,
  parseTimeToMinutes,
};
