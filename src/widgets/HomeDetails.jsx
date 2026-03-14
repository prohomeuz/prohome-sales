import { useClipboard } from "@/shared/hooks/use-clipboard";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { formatNumber } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { NoiseBackground } from "@/shared/ui/noise-background";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Calculator,
  Check,
  CircleMinus,
  CirclePlus,
  Copy,
  Info,
  LayoutGrid,
  MessageSquareWarning,
  Square,
} from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CalculatorTool from "./CalculatorTool";
import LoadTransition from "./loading/LoadTransition";
import SurfaceLoader from "./loading/SurfaceLoader";

const statuses = {
  SOLD: "bg-red-500",
  RESERVED: "bg-orange-500",
  EMPTY: "bg-green-500",
  NOT: "bg-slate-400",
};

const uzebekTranslate = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

const IMAGE_TABS = ["2D", "3D", "PLAN"];

const INITIAL_HOME_DETAILS_STATE = {
  home: null,
  notFound: false,
  error: false,
  pdfLoading: false,
  getLoading: false,
};

function homeDetailsReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        getLoading: true,
        error: false,
        notFound: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        home: action.payload,
        notFound: false,
        error: false,
        getLoading: false,
      };
    case "FETCH_NOT_FOUND":
      return {
        ...state,
        home: null,
        notFound: true,
        error: false,
        getLoading: false,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        error: action.payload,
        getLoading: false,
      };
    case "CLEAR_HOME":
      return {
        ...state,
        home: null,
        notFound: false,
        error: false,
        getLoading: false,
      };
    case "SET_PDF_LOADING":
      return {
        ...state,
        pdfLoading: action.payload,
      };
    default:
      return state;
  }
}

export default function HomeDetails({ onRoomStatusUpdated }) {
  const l = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(l.search);
  const detailsId = searchParams.get("details");
  const imageTabParam = searchParams.get("img");
  const { copied, copy } = useClipboard({
    copiedDuring: 1000,
  });
  const [state, dispatch] = useReducer(
    homeDetailsReducer,
    INITIAL_HOME_DETAILS_STATE,
  );
  const { home, notFound, error, pdfLoading, getLoading } = state;
  const [activeImageTab, setActiveImageTab] = useState(
    IMAGE_TABS.includes(imageTabParam) ? imageTabParam : "2D",
  );
  const showPanel = Boolean(home || getLoading || notFound || error);
  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  async function get(id) {
    start();
    let req;
    const token = localStorage.getItem("token");
    dispatch({ type: "FETCH_START" });
    try {
      req = await fetch(
        import.meta.env.VITE_BASE_URL + `/api/v1/room/by/${id}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
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

  useEffect(() => {
    if (detailsId) {
      get(detailsId);
    } else {
      dispatch({ type: "CLEAR_HOME" });
    }
  }, [detailsId]);

  useEffect(() => {
    if (detailsId || !imageTabParam) return;

    const params = new URLSearchParams(l.search);
    params.delete("img");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: l.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [detailsId, imageTabParam, l.pathname, l.search, navigate]);

  useEffect(() => {
    if (!imageTabParam) {
      setActiveImageTab("2D");
      return;
    }

    if (IMAGE_TABS.includes(imageTabParam)) {
      setActiveImageTab(imageTabParam);
    }
  }, [imageTabParam]);

  function handleImageTabChange(value) {
    if (!IMAGE_TABS.includes(value)) {
      return;
    }

    setActiveImageTab(value);
    const params = new URLSearchParams(l.search);
    params.set("img", value);
    const nextSearch = params.toString();
    navigate(
      {
        pathname: l.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }

  function handleCopyPhoneNumber(phone) {
    copy(phone);
  }

  function handleClick() {
    dispatch({ type: "SET_PDF_LOADING", payload: true });
    fetch("http://localhost:3030/save-as-pdf")
      .then((res) => {
        return res.blob();
      })
      .then((res) => {
        const tab = window.open("", "_blank");
        const file = new Blob([res], { type: "application/pdf" });
        const url = URL.createObjectURL(file);
        tab.location.href = url;
        URL.revokeObjectURL(url);
      })
      .finally(() => {
        dispatch({ type: "SET_PDF_LOADING", payload: false });
      });
  }

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
        className={`bg-background no-scrollbar fixed inset-0 z-50 transition-all duration-300 lg:static lg:h-full lg:border-l lg:shadow-none ${
          showPanel
            ? "translate-y-0 overflow-y-auto opacity-100 lg:w-[24rem] lg:min-w-[24rem] lg:translate-x-0 lg:opacity-100 xl:w-[26rem] xl:min-w-[26rem]"
            : "pointer-events-none translate-y-8 overflow-hidden opacity-0 lg:w-0 lg:min-w-0 lg:translate-x-full lg:translate-y-0"
        }`}
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
              <div className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
                  <Badge
                    className={`order-2 lg:order-1 ${statuses[home.status]}`}
                  >
                    {uzebekTranslate[home.status]}
                  </Badge>

                  <Button
                    className={"order-1 border shadow lg:order-2"}
                    onClick={() => {
                      const params = new URLSearchParams(l.search);
                      params.delete("details");
                      params.delete("img");
                      const nextSearch = params.toString();
                      navigate({
                        pathname: `/tjm/${id}`,
                        search: nextSearch ? `?${nextSearch}` : "",
                      });
                      dispatch({ type: "CLEAR_HOME" });
                    }}
                    variant="secondary"
                    size="icon-sm"
                  >
                    <ArrowLeft className="lg:hidden" />
                    <ArrowRight className="hidden lg:block" />
                  </Button>
                </div>

                <div className="px-4 pb-4 sm:px-5">
                  {home.customer && home.status !== "EMPTY" && (
                    <div className="animate-fade-in mb-5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            className={"w-full"}
                            variant="secondary"
                            size="sm"
                          >
                            <Info />
                            Info
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start">
                          <NoiseBackground
                            className={"rounded p-2"}
                            gradientColors={[]}
                            animating={false}
                            noiseIntensity={0.3}
                          >
                            <dl className="flex flex-col gap-2 font-mono text-xs">
                              <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                                <dt>ISM</dt>
                                <dd className="font-medium">
                                  {home.customer.firstName}
                                </dd>
                              </div>
                              <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                                <dt>FAMILIYA</dt>
                                <dd className="font-medium">
                                  {home.customer.lastName}
                                </dd>
                              </div>
                              <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                                <dt>TEL</dt>
                                <dd className="relative flex items-center gap-1 font-medium select-none">
                                  {home.customer.phone}
                                  <Button
                                    onClick={() => {
                                      handleCopyPhoneNumber(
                                        home.customer.phone,
                                      );
                                    }}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    {copied ? (
                                      <Check className="size-3" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </Button>
                                </dd>
                              </div>
                            </dl>
                          </NoiseBackground>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <i className="font-mono text-sm sm:text-base">
                      № {home.houseNumber}
                    </i>

                    <span className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs leading-none shadow-sm">
                      {(home.price * home.size).toFixed(1)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="mb-6 px-4 pt-5 sm:px-6 md:px-8 lg:mb-5 lg:px-5 lg:pt-4">
                <PhotoProvider
                  toolbarRender={({ onScale, scale }) => {
                    return (
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
                    );
                  }}
                >
                  <Tabs
                    value={activeImageTab}
                    onValueChange={handleImageTabChange}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger
                        value="2D"
                        className="flex-1 justify-center gap-2"
                      >
                        <Square className="size-4" />
                        2D
                      </TabsTrigger>
                      <TabsTrigger
                        value="3D"
                        className="flex-1 justify-center gap-2"
                      >
                        <Box className="size-4" />
                        3D
                      </TabsTrigger>
                      <TabsTrigger
                        value="PLAN"
                        className="flex-1 justify-center gap-2"
                      >
                        <LayoutGrid className="size-4" />
                        Plan
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="2D">
                      <PhotoView src={`/gallery/png/${home.image[0]}.png`}>
                        <picture>
                          <source
                            srcset={`/gallery/avif/${home.image[0]}.avif`}
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

                    <TabsContent value="3D">
                      <PhotoView src={`/gallery/png/${home.image[1]}.png`}>
                        <picture>
                          <source
                            srcset={`/gallery/avif/${home.image[1]}.avif`}
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

                    <TabsContent value="PLAN">
                      <PhotoView src={`/gallery/png/${home.image[2]}.png`}>
                        <picture>
                          <source
                            srcset={`/gallery/avif/${home.image[2]}.avif`}
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

              <div className="mb-5 px-4 sm:px-5">
                <NoiseBackground
                  className={"rounded p-2"}
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
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt className="text-xs">
                        M<sup>2</sup>
                      </dt>
                      <dd className="font-medium">
                        {formatNumber(home.price)}
                      </dd>
                    </div>
                  </dl>
                </NoiseBackground>
              </div>

              <div className="mb-5 px-4 sm:px-5">
                {home.status === "NOT" && (
                  <Alert className="relative mb-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                    <MessageSquareWarning className="text-slate-600 dark:text-slate-400" />
                    <AlertTitle className="text-slate-900 dark:text-slate-100">
                      Ushbu uy sotilmaydi
                    </AlertTitle>
                    <AlertDescription className="mb-3 text-xs text-slate-700 dark:text-slate-300">
                      {home.description
                        ? home.description
                        : "Ushbu uy NTJ yoki boshqa sababga ko'ra sotilmaydi"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="bg-background/95 sticky bottom-0 px-4 pt-2 pb-4 backdrop-blur-sm sm:px-5 lg:static lg:bg-transparent lg:p-0">
                <div className="lg:px-5">
                  <a
                    className={`${buttonVariants({
                      variant: "secondary",
                    })} w-full shadow-sm`}
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
