/**
 * @file Xona tafsilot paneli — slide-in drawer.
 * @module widgets/HomeDetails
 *
 * URL ?details=<id> parametriga qarab xona ma'lumotini yuklaydi.
 * Sub-komponentlar: RoomHeader, RoomImageTabs.
 * Barcha state va handlers shu faylda — sub-komponentlar faqat presentational.
 */

import { useAppStore } from "@/entities/session/model";
import { apiRequest } from "@/shared/lib/api";
import { useClipboard } from "@/shared/hooks/use-clipboard";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { cn, formatNumber } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { buttonVariants } from "@/shared/ui/button";
import { NoiseBackground } from "@/shared/ui/noise-background";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Calculator, MessageSquareWarning } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CalculatorTool from "./CalculatorTool";
import {
  homeDetailsReducer,
  INITIAL_HOME_DETAILS_STATE,
} from "./home-details/model/home-details-reducer";
import RoomHeader from "./home-details/ui/RoomHeader";
import RoomImageTabs from "./home-details/ui/RoomImageTabs";
import LoadTransition from "./loading/LoadTransition";
import SurfaceLoader from "./loading/SurfaceLoader";

const IMAGE_TABS = ["2D", "3D", "PLAN"];

/**
 * @param {{ onRoomStatusUpdated?: (roomId: string, patch: object) => void }} props
 */
export default function HomeDetails({ onRoomStatusUpdated }) {
  const l = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(l.search);
  const detailsId = searchParams.get("details");
  const imageTabParam = searchParams.get("img");

  const currencyUsd = useAppStore((state) => state.currencyUsd);
  const { copied, copy } = useClipboard({ copiedDuring: 1000 });

  const [state, dispatch] = useReducer(
    homeDetailsReducer,
    INITIAL_HOME_DETAILS_STATE,
  );
  const { home, notFound, error, getLoading } = state;

  const [activeImageTab, setActiveImageTab] = useState(
    IMAGE_TABS.includes(imageTabParam) ? imageTabParam : "2D",
  );

  const showPanel = Boolean(home || getLoading || notFound || error);

  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  // ─── API ────────────────────────────────────────────────────────────────────

  async function get(roomId) {
    start();
    let req;
    dispatch({ type: "FETCH_START" });
    try {
      req = await apiRequest(`/api/v1/room/by/${roomId}`);
    } catch {
      dispatch({ type: "FETCH_ERROR", payload: "Tizimda nosozlik!" });
    }

    if (req) {
      if (req.status === 200) {
        const data = await req.json();
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } else if (req.status === 404 || req.status === 400) {
        dispatch({ type: "FETCH_NOT_FOUND" });
      } else {
        dispatch({
          type: "FETCH_ERROR",
          payload: "Xatolik yuz berdi qayta urunib ko'ring!",
        });
      }
    }

    complete();
  }

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (detailsId) {
      get(detailsId);
    } else {
      dispatch({ type: "CLEAR_HOME" });
    }
  }, [detailsId]);

  /** img param ni tozalash — details yo'q bo'lganda */
  useEffect(() => {
    if (detailsId || !imageTabParam) return;

    const params = new URLSearchParams(l.search);
    params.delete("img");
    const nextSearch = params.toString();
    navigate(
      { pathname: l.pathname, search: nextSearch ? `?${nextSearch}` : "" },
      { replace: true },
    );
  }, [detailsId, imageTabParam, l.pathname, l.search, navigate]);

  /** URL img parametriga qarab activeImageTab ni yangilash */
  useEffect(() => {
    if (!imageTabParam) {
      setActiveImageTab("2D");
      return;
    }
    if (IMAGE_TABS.includes(imageTabParam)) {
      setActiveImageTab(imageTabParam);
    }
  }, [imageTabParam]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleImageTabChange(value) {
    if (!IMAGE_TABS.includes(value)) return;

    setActiveImageTab(value);
    const params = new URLSearchParams(l.search);
    params.set("img", value);
    const nextSearch = params.toString();
    navigate(
      { pathname: l.pathname, search: nextSearch ? `?${nextSearch}` : "" },
      { replace: true },
    );
  }

  function handleClose() {
    const params = new URLSearchParams(l.search);
    params.delete("details");
    params.delete("img");
    const nextSearch = params.toString();
    navigate({
      pathname: `/tjm/${id}`,
      search: nextSearch ? `?${nextSearch}` : "",
    });
    dispatch({ type: "CLEAR_HOME" });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="animate-fade-in bg-background/98 lg:bg-background fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur lg:static lg:inset-auto lg:h-full lg:w-[24rem] lg:min-w-[24rem] lg:border-l lg:p-6 lg:backdrop-blur-none">
        <div className="tex-center flex w-full max-w-sm flex-col items-center text-center">
          <h3 className="mb-3 text-2xl font-medium">404</h3>
          <p className="text-muted-foreground mb-5">Bunday uy mavjud emas!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "bg-background no-scrollbar fixed inset-0 z-50 transition-all duration-300 lg:static lg:h-full lg:border-l lg:shadow-none",
          showPanel
            ? "translate-y-0 overflow-y-auto opacity-100 lg:w-[24rem] lg:min-w-[24rem] lg:translate-x-0 lg:opacity-100 xl:w-[26rem] xl:min-w-[26rem]"
            : "pointer-events-none translate-y-8 overflow-hidden opacity-0 lg:w-0 lg:min-w-0 lg:translate-x-full lg:translate-y-0",
        )}
      >
        <LoadTransition
          loading={getLoading}
          className="min-h-full"
          loader={
            <SurfaceLoader
              title="Uy ma'lumoti yuklanmoqda"
              description={
                home
                  ? "Tanlangan uy tafsilotlari yangilanmoqda."
                  : "Tanlangan uy tafsilotlari tayyorlanmoqda."
              }
            />
          }
          loaderClassName="bg-background/72 backdrop-blur-[2px]"
          contentClassName="min-h-full"
        >
          {error ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-sm text-center">
                <h3 className="mb-3 text-xl font-medium">Xatolik yuz berdi</h3>
                <p className="text-muted-foreground text-sm leading-6">
                  {error}
                </p>
              </div>
            </div>
          ) : home ? (
            <div className="pb-6 lg:pb-10">
              {/* Sticky sarlavha: status, yopish, mijoz info, narx */}
              <RoomHeader
                home={home}
                currencyUsd={currencyUsd}
                copied={copied}
                onCopyPhone={copy}
                onClose={handleClose}
              />

              {/* 2D / 3D / PLAN rasmlar */}
              <RoomImageTabs
                home={home}
                activeImageTab={activeImageTab}
                onTabChange={handleImageTabChange}
              />

              {/* Xona parametrlari */}
              <div className="mb-5 px-4 sm:px-5">
                <NoiseBackground
                  className="rounded p-2"
                  gradientColors={[]}
                  animating={false}
                  noiseIntensity={0.3}
                >
                  <dl className="flex flex-col gap-2 font-mono">
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt className="text-xs">BLOK</dt>
                      <dd className="font-medium">{home.block}</dd>
                    </div>
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt className="text-xs">QAVAT</dt>
                      <dd className="font-medium">{home.floorNumber}</dd>
                    </div>
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt className="text-xs">MAYDON</dt>
                      <dd className="font-medium">
                        {home.size} m <sup>2</sup>
                      </dd>
                    </div>
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt className="text-xs">XONA</dt>
                      <dd className="font-medium">{home.room}</dd>
                    </div>
                    {currencyUsd?.rate ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background flex cursor-help flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                            <dt className="text-xs">
                              M<sup>2</sup>
                            </dt>
                            <dd className="font-medium">
                              {formatNumber(home.price)} USD
                            </dd>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="pointer-events-none">
                          <div className="text-xs">
                            <span className="font-semibold">
                              {formatNumber(home.price)} USD
                            </span>{" "}
                            ={" "}
                            <span className="font-mono font-semibold">
                              {formatNumber(
                                Math.round(
                                  Number(home.price) *
                                    Number(currencyUsd.rate),
                                ),
                              )}{" "}
                              so&apos;m
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                        <dt className="text-xs">
                          M<sup>2</sup>
                        </dt>
                        <dd className="font-medium">
                          {formatNumber(home.price)} USD
                        </dd>
                      </div>
                    )}
                  </dl>
                </NoiseBackground>
              </div>

              {/* "Sotilmaydi" ogohlantirish */}
              <div className="mb-5 px-4 sm:px-5">
                {home.status === "NOT" && (
                  <Alert className="relative mb-10 border-muted-foreground/20 bg-muted/50">
                    <MessageSquareWarning className="text-muted-foreground" />
                    <AlertTitle className="text-foreground">
                      Ushbu uy sotilmaydi
                    </AlertTitle>
                    <AlertDescription className="mb-3 text-xs text-muted-foreground">
                      {home.description
                        ? home.description
                        : "Ushbu uy NTJ yoki boshqa sababga ko'ra sotilmaydi"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Hisoblash tugmasi (sticky pastda) */}
              <div className="bg-background/95 sticky bottom-0 px-4 pt-2 pb-4 backdrop-blur-sm sm:px-5 lg:static lg:bg-transparent lg:p-0">
                <div className="lg:px-5">
                  <a
                    className={cn(buttonVariants({ variant: "secondary" }), "w-full shadow-sm")}
                    href="#calculator"
                  >
                    <Calculator />
                    Hisoblash
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </LoadTransition>
      </div>

      {home && (
        <CalculatorTool
          home={home}
          projectId={id}
          onStatusUpdated={(payload) => {
            onRoomStatusUpdated?.(payload.roomId, {
              status: payload.nextStatus,
              description: payload.description ?? "",
            });
          }}
        />
      )}
    </>
  );
}
