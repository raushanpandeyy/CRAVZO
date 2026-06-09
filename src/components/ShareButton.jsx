import React, { lazy, Suspense, useState } from "react";
import { Share2 } from "lucide-react";

const ShareModal = lazy(() => import("./ShareModal.jsx"));

const ShareButton = ({ url, text, className = "", iconSize = 18 }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`flex items-center justify-center rounded-full p-2 transition active:scale-90 ${className}`}
        aria-label="Share"
      >
        <Share2 size={iconSize} />
      </button>

      {open && (
        <Suspense fallback={null}>
          <ShareModal
            url={url}
            text={text}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export default ShareButton;
