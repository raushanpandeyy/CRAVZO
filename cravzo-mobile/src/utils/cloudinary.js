const CLOUD_NAME = "dp3l13mm5";

export const getCloudinaryUrl = (url, { width, height, quality } = {}) => {
  if (!url) return null;

  if (url.includes("res.cloudinary.com")) {
    const parts = url.split("/upload/");
    if (parts.length < 2) return url;

    const firstSegment = parts[1].split("/")[0];
    if (/^[fqwcheg]_/.test(firstSegment)) {
      return url;
    }

    const transformations = ["f_webp", "q_auto"];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height},c_fill`);

    return `${parts[0]}/upload/${transformations.join(",")}/${parts[1]}`;
  }

  const tx = ["f_webp", "q_auto"];
  if (width) tx.push(`w_${width}`);
  if (height) tx.push(`h_${height},c_fill`);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${tx.join(",")}/${encodeURIComponent(url)}`;

};
