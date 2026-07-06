import { Image, ImageBackground } from "react-native";
import { getCloudinaryUrl } from "../utils/cloudinary";

export const OptimizedImage = ({ source, width, height, quality, ...props }) => {
  if (source?.uri) {
    source = { ...source, uri: getCloudinaryUrl(source.uri, { width, height, quality }) };
  }
  return <Image source={source} {...props} />;
};

export const OptimizedBackground = ({ source, width, height, quality, ...props }) => {
  if (source?.uri) {
    source = { ...source, uri: getCloudinaryUrl(source.uri, { width, height, quality }) };
  }
  return <ImageBackground source={source} {...props} />;
};

export default OptimizedImage;
