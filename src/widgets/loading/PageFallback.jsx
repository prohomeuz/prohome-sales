/**
 * @file Sahifa yuklayotganda ko'rsatiladigan to'liq ekran loader.
 * @module widgets/loading/PageFallback
 *
 * Router Suspense fallback sifatida ishlatiladi.
 * LogoLoader ga bog'liq bo'lgani uchun widgets qatlamida turadi.
 */

import LogoLoader from "./LogoLoader";

/**
 * React Router `RouterProvider` ning `fallbackElement` uchun.
 * @returns {JSX.Element}
 */
export default function PageFallback() {
  return <LogoLoader />;
}
