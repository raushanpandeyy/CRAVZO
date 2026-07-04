const getOrigin = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
};

export const getShareUrl = {
  dish: (dishName) =>
    `${getOrigin()}/dish/${encodeURIComponent(dishName)}?ref=share`,
  restaurant: (restaurantId) =>
    `${getOrigin()}/restaurant/${restaurantId}?ref=share`,
  dishOnRestaurant: (restaurantId, dishName) =>
    `${getOrigin()}/restaurant/${restaurantId}?ref=share&dish=${encodeURIComponent(dishName)}`,
};

export const getShareText = {
  dish: (dishName, restaurantName) =>
    `I'm craving ${dishName}${restaurantName ? ` from ${restaurantName}` : ""} on Dodago!`,
  restaurant: (restaurantName) =>
    `Check out ${restaurantName} on Dodago!`,
};

export function shareOnWhatsApp(url, text) {
  const message = encodeURIComponent(`${text}\n${url}`);
  window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
}

export function shareOnTelegram(url, text) {
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function shareOnSMS(url, text) {
  const body = encodeURIComponent(`${text}\n${url}`);
  window.location.href = `sms:?body=${body}`;
}

export function shareOnEmail(url, text) {
  const subject = encodeURIComponent("Craving something from Dodago!");
  const body = encodeURIComponent(`${text}\n\n${url}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

export async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  }
}

export async function shareNative(url, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: "Dodago", text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
