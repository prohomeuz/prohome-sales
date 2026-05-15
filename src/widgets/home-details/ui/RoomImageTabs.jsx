/**
 * @file Xona rasmlari tablar — 2D / 3D / PLAN.
 * @module widgets/home-details/ui/RoomImageTabs
 *
 * PhotoProvider ichida Tabs ko'rsatadi.
 * Faqat presentational — activeImageTab va onTabChange props orqali keladi.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Box, CircleMinus, CirclePlus, LayoutGrid, Square, ImageOff, Maximize2, Download } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { apiUrl } from "@/shared/lib/api";

const getImageSrc = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  if (img.startsWith("image/")) return apiUrl(img);
  return apiUrl(`image/${img}`);
};

const handleDownload = async (e, url, title) => {
  e.stopPropagation();
  e.preventDefault();
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = title ? `${title}.png` : "image.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    window.open(url, "_blank");
  }
};

const ImageDisplay = ({ src, label }) => {
  if (!src) return null;
  return (
    <div className="group relative mx-auto h-[52svh] w-full max-w-4xl overflow-visible sm:h-[58svh] lg:h-72 lg:max-w-none">
      <PhotoView src={src}>
        <img
          src={src}
          alt={label}
          className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500 group-hover:scale-101 rounded-3xl"
        />
      </PhotoView>
      
      <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
        <PhotoView src={src}>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/40 hover:scale-105"
            title="Kattalashtirish"
          >
            <Maximize2 className="size-4" />
          </button>
        </PhotoView>
        <button
          type="button"
          onClick={(e) => handleDownload(e, src, label)}
          className="flex size-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105"
          title="Yuklab olish"
        >
          <Download className="size-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * @param {{
 *   home: object,
 *   activeImageTab: "2D" | "3D" | "PLAN",
 *   onTabChange: (value: string) => void,
 * }} props
 */
export default function RoomImageTabs({ home, activeImageTab, onTabChange }) {
  return (
    <div className="mb-6 px-4 pt-5 sm:px-6 md:px-8 lg:mb-5 lg:px-5 lg:pt-4">
      <PhotoProvider
        toolbarRender={({ onScale, scale }) => (
          <div className="mr-5 flex">
            <div className="group h-11 w-11 p-2.5">
              <CircleMinus
                className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
                onClick={() => onScale(scale - 1)}
              />
            </div>
            <div className="group h-11 w-11 p-2.5">
              <CirclePlus
                className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
                onClick={() => onScale(scale + 1)}
              />
            </div>
          </div>
        )}
      >
        <Tabs value={activeImageTab} onValueChange={onTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="2D" className="flex-1 justify-center gap-2">
              <Square className="size-4" />
              2D
            </TabsTrigger>
            <TabsTrigger value="3D" className="flex-1 justify-center gap-2">
              <Box className="size-4" />
              3D
            </TabsTrigger>
            <TabsTrigger value="PLAN" className="flex-1 justify-center gap-2">
              <LayoutGrid className="size-4" />
              Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="2D" forceMount>
            {home.img2d && home.img2d !== "0" ? (
              <ImageDisplay src={getImageSrc(home.img2d)} label="2D View" />
            ) : home.image?.[0] && home.image[0] !== "0" ? (
              <ImageDisplay src={getImageSrc(home.image[0])} label={home.size || "2D View"} />
            ) : (
              <div className="flex flex-col h-64 items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-muted/10">
                <div className="p-4 bg-muted/30 rounded-full mb-3">
                  <ImageOff className="size-6 text-muted-foreground/50" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">2D rasm yuklanmagan</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="3D" forceMount>
            {home.img3d && home.img3d !== "0" ? (
              <ImageDisplay src={getImageSrc(home.img3d)} label="3D View" />
            ) : home.image?.[1] && home.image[1] !== "0" ? (
              <ImageDisplay src={getImageSrc(home.image[1])} label={home.size || "3D View"} />
            ) : (
              <div className="flex flex-col h-64 items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-muted/10">
                <div className="p-4 bg-muted/30 rounded-full mb-3">
                  <ImageOff className="size-6 text-muted-foreground/50" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">3D rasm yuklanmagan</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="PLAN" forceMount>
            {home.plan && home.plan !== "0" ? (
              <ImageDisplay src={getImageSrc(home.plan)} label="Plan View" />
            ) : home.image?.[2] && home.image[2] !== "0" ? (
              <ImageDisplay src={getImageSrc(home.image[2])} label={home.size || "Plan View"} />
            ) : (
              <div className="flex flex-col h-64 items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-muted/10">
                <div className="p-4 bg-muted/30 rounded-full mb-3">
                  <ImageOff className="size-6 text-muted-foreground/50" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Plan yuklanmagan</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PhotoProvider>
    </div>
  );
}
