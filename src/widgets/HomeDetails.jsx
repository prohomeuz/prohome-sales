import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import {
  ArrowRight,
  Calculator,
  Check,
  CircleMinus,
  CirclePlus,
  Copy,
  Info,
  MessageSquareWarning,
} from "lucide-react";
import { useEffect, useReducer } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { Button, buttonVariants } from "@/shared/ui/button";
import { useClipboard } from "@/shared/hooks/use-clipboard";
import { formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { NoiseBackground } from "@/shared/ui/noise-background";
import CalculatorTool from "./CalculatorTool";
import LoadTransition from "./loading/LoadTransition";
import SurfaceLoader from "./loading/SurfaceLoader";

const statuses = {
  SOLD: "bg-red-500",
  RESERVED: "bg-yellow-500",
  EMPTY: "bg-green-500",
  NOT: "bg-slate-400",
};

const uzebekTranslate = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

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
  const { copied, copy } = useClipboard({
    copiedDuring: 1000,
  });
  const [state, dispatch] = useReducer(
    homeDetailsReducer,
    INITIAL_HOME_DETAILS_STATE,
  );
  const { home, notFound, error, pdfLoading, getLoading } = state;
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
    const url = new URLSearchParams(l.search);

    if (url.has("details")) {
      const id = url.get("details");
      get(id);
    } else {
      dispatch({ type: "CLEAR_HOME" });
    }
  }, [l.search]);

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
      <div className="animate-fade-in fixed inset-x-4 bottom-4 top-16 z-40 flex items-center justify-center rounded-xl border bg-background/98 p-6 shadow-2xl backdrop-blur lg:static lg:inset-auto lg:h-full lg:min-w-[24rem] lg:w-[24rem] lg:rounded-none lg:border-l lg:border-t-0 lg:bg-background lg:p-6 lg:shadow-none">
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
        className={`bg-background no-scrollbar fixed inset-x-0 bottom-0 top-12 z-40 overflow-y-auto border-t shadow-2xl transition-all duration-300 lg:static lg:h-full lg:border-l lg:border-t-0 lg:shadow-none ${
          showPanel
            ? "translate-y-0 opacity-100 lg:w-[24rem] lg:min-w-[24rem] lg:translate-x-0 lg:opacity-100 xl:w-[26rem] xl:min-w-[26rem]"
            : "pointer-events-none translate-y-8 opacity-0 lg:w-0 lg:min-w-0 lg:translate-x-full lg:translate-y-0"
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
                <Badge className={statuses[home.status]}>
                  {uzebekTranslate[home.status]}
                </Badge>

                <Button
                  className={"border shadow"}
                  onClick={() => {
                    navigate(`/tjm/${id}`);
                    dispatch({ type: "CLEAR_HOME" });
                  }}
                  variant="secondary"
                  size="icon-sm"
                >
                  <ArrowRight />
                </Button>
              </div>

              <div className="px-4 pb-4 sm:px-5">
                {home.customer && (
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
                                    handleCopyPhoneNumber(home.customer.phone);
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
                  <i className="font-mono text-sm sm:text-base">№ {home.houseNumber}</i>

                  <span className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs leading-none shadow-sm">
                    {formatNumber(home.price * home.size)} UZS
                  </span>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="mb-5 px-4 pt-4 sm:px-5">
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
                <PhotoView src={`/gallery/jpg/${home.image}.jpg`}>
                  <picture>
                    <source
                      srcset={`/gallery/avif/${home.image}.avif`}
                      type="image/avif"
                    />
                    <img
                      className="h-56 w-full object-contain sm:h-72 lg:h-64"
                      src={`/gallery/jpg/${home.image}.jpg`}
                      alt={home.size}
                    />
                  </picture>
                </PhotoView>
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
                    <dd className="font-medium">{formatNumber(home.price)}</dd>
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

            <div className="sticky bottom-0 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-sm sm:px-5 lg:static lg:bg-transparent lg:p-0">
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
