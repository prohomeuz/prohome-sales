import { CircleMinus, CirclePlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhotoSlider } from "react-photo-view";

const DISCOUNT_IMAGES = [1, 2];

function detectAvifSupport() {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return canvas.toDataURL("image/avif").startsWith("data:image/avif");
  } catch {
    return false;
  }
}

export default function DiscountViewerSlider({
  openSignal = 0,
  onViewerVisibleChange,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [preferAvif, setPreferAvif] = useState(false);

  useEffect(() => {
    setPreferAvif(detectAvifSupport());
  }, []);

  useEffect(() => {
    if (openSignal > 0) {
      setActiveIndex(0);
      setIsVisible(true);
    }
  }, [openSignal]);

  useEffect(() => {
    onViewerVisibleChange?.(isVisible);
  }, [isVisible, onViewerVisibleChange]);

  const sources = useMemo(() => {
    const format = preferAvif ? "avif" : "png";
    return DISCOUNT_IMAGES.map((imageId) => ({
      key: imageId,
      src: `/discount/${format}/${imageId}.${format}`,
    }));
  }, [preferAvif]);

  return (
    <PhotoSlider
      images={sources}
      index={activeIndex}
      onIndexChange={(nextIndex) => {
        setActiveIndex(nextIndex);
      }}
      visible={isVisible}
      onClose={() => {
        setIsVisible(false);
      }}
      toolbarRender={({ onScale, scale }) => (
        <div className="mr-5 flex">
          <div className="group h-11 w-11 p-2.5">
            <CircleMinus
              className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
              onClick={() => {
                onScale(scale - 1);
              }}
            />
          </div>
          <div className="group h-11 w-11 p-2.5">
            <CirclePlus
              className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
              onClick={() => {
                onScale(scale + 1);
              }}
            />
          </div>
        </div>
      )}
    />
  );
}
