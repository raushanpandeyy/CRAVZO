export const getCloudinaryUrl = (url, { width, height, quality } = {}) => {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;

  const parts = url.split("/upload/");
  if (parts.length < 2) return url;

  const transformations = ["f_avif", "q_auto"];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height},c_fill`);

  return `${parts[0]}/upload/${transformations.join(",")}/${parts[1]}`;
};
