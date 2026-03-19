/**
 * @file Xona rasmlari tablar — 2D / 3D / PLAN.
 * @module widgets/home-details/ui/RoomImageTabs
 *
 * PhotoProvider ichida Tabs ko'rsatadi.
 * Faqat presentational — activeImageTab va onTabChange props orqali keladi.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Box, CircleMinus, CirclePlus, LayoutGrid, Square } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";

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
            <PhotoView src={`/gallery/png/${home.image[0]}.png`}>
              <picture>
                <source
                  srcSet={`/gallery/avif/${home.image[0]}.avif`}
                  type="image/avif"
                />
                <img
                  className="mx-auto h-auto max-h-[52svh] w-full max-w-4xl object-contain sm:max-h-[58svh] lg:h-64 lg:max-h-none lg:max-w-none"
                  src={`/gallery/png/${home.image[0]}.png`}
                  alt={home.size}
                />
              </picture>
            </PhotoView>
          </TabsContent>

          <TabsContent value="3D" forceMount>
            <PhotoView src={`/gallery/png/${home.image[1]}.png`}>
              <picture>
                <source
                  srcSet={`/gallery/avif/${home.image[1]}.avif`}
                  type="image/avif"
                />
                <img
                  className="mx-auto h-auto max-h-[52svh] w-full max-w-4xl object-contain sm:max-h-[58svh] lg:h-64 lg:max-h-none lg:max-w-none"
                  src={`/gallery/png/${home.image[1]}.png`}
                  alt={home.size}
                />
              </picture>
            </PhotoView>
          </TabsContent>

          <TabsContent value="PLAN" forceMount>
            <PhotoView src={`/gallery/png/${home.image[2]}.png`}>
              <picture>
                <source
                  srcSet={`/gallery/avif/${home.image[2]}.avif`}
                  type="image/avif"
                />
                <img
                  className="mx-auto h-auto max-h-[52svh] w-full max-w-4xl object-contain sm:max-h-[58svh] lg:h-64 lg:max-h-none lg:max-w-none"
                  src={`/gallery/png/${home.image[2]}.png`}
                  alt={home.size}
                />
              </picture>
            </PhotoView>
          </TabsContent>
        </Tabs>
      </PhotoProvider>
    </div>
  );
}
