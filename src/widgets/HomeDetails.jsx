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
import { useEffect, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { Button, buttonVariants } from "@/shared/ui/button";
import { useClipboard } from "@/shared/hooks/use-clipboard";
import { formatNumber } from "@/shared/lib/utils";
import CalculatorTool from "./CalculatorTool";
import { Badge } from "@/shared/ui/badge";
import { NoiseBackground } from "@/shared/ui/noise-background";
import { Spinner } from "@/shared/ui/spinner";

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

export default function HomeDetails() {
  const l = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { copied, copy } = useClipboard({
    copiedDuring: 1000,
  });

  const [home, setHome] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Errors
  const [error, setError] = useState(false);

  // Loadings
  const [pdfLoading, setPdfLoading] = useState(false);
  const [getLoading, setGetLoading] = useState(false);
  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  async function get(id) {
    start();
    let req;
    const token = localStorage.getItem("token");
    setGetLoading(true);
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
      setError("Tizimda nosozlik!");
    }

    if (req) {
      if (req.status === 200) {
        const data = await req.json();
        setHome(data);
        setNotFound(false);
      } else if (req.status === 404 || req.status === 400) {
        setNotFound(true);
      } else {
        setError("Xatolik yuz berdi qayta urunib ko'ring!");
      }
    }

    complete();
    setGetLoading(false);
  }

  useEffect(() => {
    const url = new URLSearchParams(l.search);

    if (url.has("details")) {
      const id = url.get("details");
      get(id);
    } else {
      setHome(null);
    }
  }, [l.search]);

  function handleCopyPhoneNumber(phone) {
    copy(phone);
  }

  function handleClick() {
    setPdfLoading(true);
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
        setPdfLoading(false);
      });
  }

  if (notFound) {
    return (
      <div className="animate-fade-in flex h-full w-112.5 items-center justify-center">
        <div className="tex-center flex w-full flex-col items-center">
          <h3 className="mb-3 text-2xl font-medium">404</h3>
          <p className="text-muted-foreground mb-5">Bunday uy mavjud emas!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`bg-background no-scrollbar relative h-full overflow-y-scroll transition-all duration-400 ${
          home ? "w-112.5 translate-x-0" : "w-0 translate-x-112.5"
        } ${getLoading ? "pointer-events-none opacity-50" : ""}`}
      >
        {getLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        {home && (
          <div className="pb-10">
            <div className="bg-background sticky top-0 z-10 border-b">
              <div className="flex items-center justify-between px-2 pb-5">
                <Badge className={statuses[home.status]}>
                  {uzebekTranslate[home.status]}
                </Badge>

                <Button
                  className={"border shadow"}
                  onClick={() => {
                    navigate(`/tjm/${id}`);
                    setHome(null);
                  }}
                  variant="secondary"
                  size="icon-sm"
                >
                  <ArrowRight />
                </Button>
              </div>

              <div className="p-2">
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
                <div className="flex items-center justify-between">
                  <i className="font-mono">№ {home.houseNumber}</i>

                  <span className="bg-primary text-primary-foreground px-2 py-1 text-xs leading-none">
                    {formatNumber(home.price * home.size)} UZS
                  </span>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="mb-5 p-2">
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
                      className="h-45 w-full shadow"
                      src={`/gallery/jpg/${home.image}.jpg`}
                      alt={home.size}
                    />
                  </picture>
                </PhotoView>
              </PhotoProvider>
            </div>

            <div className="mb-5 px-2">
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

            <div className="mb-5 px-2">
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

            <div className="px-2">
              <a
                className={`${buttonVariants({
                  variant: "secondary",
                })} w-full`}
                href="#calculator"
              >
                <Calculator />
                Hisoblash
              </a>
            </div>
          </div>
        )}
      </div>
      {home && <CalculatorTool home={home} />}
    </>
  );
}
