import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Share2 } from "lucide-react-native";
import ShareModal from "./ShareModal";

export default function ShareButton({ url, text, iconSize = 20, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation?.();
          setOpen(true);
        }}
        className={`items-center justify-center rounded-full p-2 ${className}`}
      >
        <Share2 size={iconSize} color="#64748b" />
      </TouchableOpacity>
      <ShareModal
        url={url}
        text={text}
        visible={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
