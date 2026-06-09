import { getImageQualityParams, getImageWidth } from "./connection";

export function getCloudinaryUrl(url, { width = 400, height, quality } = {}) {
  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  const q = quality || getImageQualityParams();
  const w = getImageWidth(width);
  const crop = height
    ? `c_fill,w_${w},h_${height}`
    : `c_fill,w_${w}`;

  return `${parts[0]}/upload/${crop},${q},f_avif/${parts[1]}`;
}

export function getCloudinarySrcSet(url, widths = [200, 400, 800]) {
  return widths
    .map((w) => {
      const adjusted = getImageWidth(w);
      const parts = url.split("/upload/");
      if (parts.length !== 2) return "";
      return `${parts[0]}/upload/c_fill,w_${adjusted},q_auto,f_avif/${parts[1]} ${w}w`;
    })
    .filter(Boolean)
    .join(", ");
}
