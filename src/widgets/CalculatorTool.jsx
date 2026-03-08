import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Drawer, DrawerClose, DrawerContent } from "@/shared/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/shared/ui/field";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { SparklesText } from "@/shared/ui/sparkles-text";
import confetti from "canvas-confetti";
import {
  BadgePercent,
  Bolt,
  Calculator,
  CalendarDays,
  CircleCheckBig,
  CircleDollarSign,
  CircleMinus,
  CirclePlus,
  Coins,
  Grid2X2,
  HandCoins,
  Layers2,
  Lock,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { toast } from "sonner";
import useSound from "@/shared/hooks/use-sound";
import {
  formatNumber,
  formatNumberWithPercent,
  getFormData,
  normalizePeriod,
} from "@/shared/lib/utils";
import AppartmentTimeLine from "./AppartmentTimeLine";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { NoiseBackground } from "@/shared/ui/noise-background";
import { Pointer } from "@/shared/ui/pointer";
import { Spinner } from "@/shared/ui/spinner";

const states = {
  BOX: "Karobka",
  READY: "Ta'mirlangan",
};

const uzbekTranslate = {
  refrigerator: "Muzlatgich",
  "gas-stove": "Gaz plita",
  "washing-machine": "Kir yuvish mashinasi",
  "electric-plate": "Elektr plita",
};

const actionButtons = [
  {
    code: "SOLD",
    title: "Sotish",
    bg: "bg-green-500",
  },
  {
    code: "RESERVED",
    title: "Bron qilish",
    bg: "bg-yellow-500",
  },
  {
    code: "NOT",
    title: "To'xtatish",
    bg: "bg-slate-400",
  },
  {
    code: "EMPTY",
    title: "Sotuvga chiqarish",
    bg: "bg-green-500",
  },
];

const paymentPeriods = [12, 24, 36, 48, 60];

export default function CalculatorTool({ home }) {
  const timerRef = useRef();
  const { sound } = useSound("/win.mp3");
  const [open, setOpen] = useState(
    window.location.search.includes("details=") &&
      window.location.hash === "#calculator",
  );
  const [calcResult, setCalcResult] = useState({
    monthlyPayment: 0,
    downPayment: 0,
    months: 60,
    bonus: [],
  });
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState("discountPerM2");
  const [period, setPeriod] = useState(60);
  const [downPayment, setDownPayment] = useState(0);
  const [discount, setDiscount] = useState("");

  const [galleryShow, setGalleryShow] = useState(false);

  // Loadings
  const [calcLoading, setCalcLoading] = useState(false);

  //   API
  async function calc(url) {
    let req;
    const token = localStorage.getItem("token");
    setCalcLoading(true);
    try {
      req = await fetch(url, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
    } catch {
      toast.error("Tizimda nosozlik!", { position: "bottom-left" });
    }

    if (req) {
      if (req.status === 200) {
        const data = await req.json();
        setCalcResult(data);
        if (data.bonus.length > 0) win();
      } else if (req.status === 400) {
        toast.error(
          "Boshlang'ich to'lov uyning umumiy summasidan katta bo'lishi mumkin emas!",
          { position: "bottom-left" },
        );
      } else {
        toast.error("Xatolik yuz berdi qayta urunib ko'ring!", {
          position: "bottom-left",
        });
      }
    }

    setCalcLoading(false);
  }

  function handleOpen() {
    setOpen(!open);
  }

  function handleClose() {
    setCalcResult({
      monthlyPayment: 0,
      downPayment: 0,
      months: 60,
      bonus: [],
    });

    setDownPayment(0);
    setPeriod(60);
    setDiscount("");
    setShowDiscount(false);
    setCalcLoading(false);

    const url = new URL(window.location.href);
    url.hash = "";

    history.replaceState(null, "", url);
  }

  function handleChangeDiscountType(value) {
    setDiscountType(value);
  }

  function handleCalc(evt) {
    evt.preventDefault();
    const url = new URL(
      import.meta.env.VITE_BASE_URL + `/api/v1/room/${home.id}/calculate`,
    );
    const formData = getFormData(evt.currentTarget);

    Object.entries(formData).forEach(([key, value]) => {
      url.searchParams.append(key, value.replaceAll(/\s+/g, ""));
    });

    calc(url.href);
  }

  function handlePeriod(p) {
    setPeriod(p);
  }

  function handleDownPayment(evt) {
    let input = evt.target.value;
    let rawValue = input.replace(/\D/g, "");
    let formattedValue = formatNumber(rawValue);
    setDownPayment(formattedValue);
  }

  function handleDiscount(evt) {
    const value = formatNumberWithPercent(evt.target.value);
    setDiscount(value);
  }

  function win() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    sound();
  }

  useEffect(() => {
    window.addEventListener("hashchange", (evt) => {
      const url = new URL(evt.newURL);
      if (url.searchParams.has("details") && url.hash === "#calculator") {
        setOpen(true);
      } else {
        setOpen(false);
      }
    });
  }, []);

  // Discount
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.keyCode === 68 && !timerRef.current) {
        timerRef.current = setTimeout(() => {
          setShowDiscount((prev) => !prev);
          timerRef.current = null;
        }, 2500);
      }
    }

    function handleKeyUp(e) {
      if (e.keyCode === 68) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (v === false && galleryShow === false) {
          handleOpen();
          handleClose();
        }
      }}
      direction={"top"}
    >
      <DrawerContent className="h-full min-h-screen">
        {/* Close  */}
        <DrawerClose
          onClick={handleClose}
          className={`${buttonVariants({
            variant: "secondary",
            size: "icon-sm",
          })} absolute top-3 right-3 border shadow`}
        >
          <X />
        </DrawerClose>

        <div className="flex h-full gap-10 px-10 py-15">
          <div
            className={`no-scrollbar relative h-full w-[65%] overflow-y-auto transition-opacity ${
              calcLoading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {calcLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Spinner />
              </div>
            )}

            <div className="animate-fade-in bg-background sticky top-2 z-10 mb-8 w-full rounded border px-3 py-6">
              <h3 className="bg-background text-muted-foreground absolute top-0 left-5 flex -translate-y-2/4 gap-2 rounded px-2">
                Oyiga
              </h3>
              <h2 className={"font-mono text-4xl font-bold"}>
                {formatNumber(calcResult.monthlyPayment)}
              </h2>
            </div>

            <div className="animate-fade-in mb-5">
              {calcResult.bonus.length > 0 && (
                <div className="text-primary-foreground animate-fade-in mb-5 flex w-full overflow-hidden rounded border-3 border-green-500">
                  <div className="flex items-center justify-center bg-green-500 p-2 text-4xl font-bold">
                    Bonus:
                  </div>

                  <div className="flex w-full gap-5 px-10 py-2">
                    <PhotoProvider
                      onVisibleChange={(visible) => {
                        setGalleryShow(visible);
                      }}
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
                      {calcResult.bonus.map((b) => {
                        return (
                          <PhotoView src={`/bonus/png/${b}.png`}>
                            <div className="flex w-2/4 flex-col items-center gap-1">
                              <picture>
                                <source
                                  srcset={`/bonus/avif/${b}.avif`}
                                  type="image/avif"
                                />
                                <img
                                  className="w-full"
                                  src={`/bonus/png/${b}.png`}
                                  alt={b}
                                />
                              </picture>
                              <span className="text-foreground text-xs">
                                {uzbekTranslate[b]}
                              </span>
                            </div>
                          </PhotoView>
                        );
                      })}
                    </PhotoProvider>
                  </div>
                </div>
              )}

              {calcResult.totalDiscount ? (
                <NoiseBackground
                  containerClassName="w-full p-4 rounded mb-10"
                  speed={0.4}
                >
                  <div className="bg-background inline-flex w-full items-end gap-5 rounded p-2">
                    <CircleCheckBig
                      className="text-green-600"
                      width={40}
                      height={40}
                    />
                    <SparklesText className="text-5xl" sparklesCount={5}>
                      {formatNumber(calcResult.totalDiscount)}
                    </SparklesText>
                    <p>so'm foydadasiz hurmatli mijoz!</p>
                  </div>
                </NoiseBackground>
              ) : null}

              <div id="shu">
                <div className="mb-2 grid grid-cols-[6fr_2fr_3fr] gap-2">
                  <div className="bg-primary/2 w-full rounded border p-2">
                    <div className="mb-2 flex items-center gap-1">
                      <CircleDollarSign />
                      <span className="text-muted-foreground text-xs">
                        Umumiy narx
                      </span>
                    </div>
                    <h4 className="font-mono text-lg font-medium">
                      {calcResult.price
                        ? formatNumber(calcResult.price * calcResult.size)
                        : "---"}{" "}
                    </h4>
                  </div>
                  <div className="bg-primary/2 w-full rounded border p-2">
                    <div className="mb-2 flex items-center gap-1">
                      <CalendarDays />
                      <span className="text-muted-foreground text-xs">
                        Muddat
                      </span>
                    </div>
                    <h4 className="font-mono text-lg font-medium">
                      {calcResult.months} oy
                    </h4>
                  </div>
                  {states[calcResult.state] && (
                    <div className="bg-primary/2 w-full rounded border p-2">
                      <div className="mb-2 flex items-center gap-1">
                        <Grid2X2 />
                        <span className="text-muted-foreground text-xs">
                          O'lchami
                        </span>
                      </div>
                      <h4 className="font-mono text-lg font-medium">
                        {calcResult.size} m<sup>2</sup>
                      </h4>
                    </div>
                  )}
                </div>

                <div className="mb-2 grid grid-cols-[1fr_3fr_2fr] gap-2">
                  {states[calcResult.state] && (
                    <div className="bg-primary/2 w-full rounded border p-2">
                      <div className="mb-2 flex items-center gap-1">
                        <Bolt />
                        <span className="text-muted-foreground text-xs">
                          Holati
                        </span>
                      </div>
                      <h4 className="font-mono text-lg font-medium">
                        {states[calcResult.state]}
                      </h4>
                    </div>
                  )}
                  <div className="bg-primary/2 w-full rounded border p-2">
                    <div className="mb-2 flex items-center gap-1">
                      <HandCoins />
                      <span className="text-muted-foreground text-xs">
                        Boshlang'ich to'lov
                      </span>
                    </div>
                    <h4 className="font-mono text-lg font-medium">
                      {formatNumber(calcResult.downPayment)}
                    </h4>
                  </div>
                  <div className="bg-primary/2 w-full rounded border p-2">
                    <div className="mb-2 flex items-center gap-1">
                      <Coins />
                      <span className="text-muted-foreground text-xs">
                        M<sup>2</sup>
                      </span>
                    </div>
                    <h4 className="font-mono text-lg font-medium">
                      {formatNumber(home.price)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-5">
              <PhotoProvider
                onVisibleChange={(visible) => {
                  setGalleryShow(visible);
                }}
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
                      className="w-full shadow"
                      src={`/gallery/jpg/${home.image}.jpg`}
                      alt={home.image}
                    />
                  </picture>
                </PhotoView>
              </PhotoProvider>
            </div>

            <Alert className="relative mb-10 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <Layers2 className="text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">
                Infra tuzilma
              </AlertTitle>
              <AlertDescription className="mb-3 text-amber-800 dark:text-amber-200">
                Bino maktab, bog'cha, masjid va 10 dan ziyod savdo-sotiq
                do'konlariga judayam yaqin joylashgan.
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Maktab
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Masjid
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Bog'cha
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Do'konlar
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Yonilg'i shaxobchasi
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Mashina yuvish joyi
              </AlertDescription>
            </Alert>

            {/* Timeline  */}
            <AppartmentTimeLine />
          </div>

          <div className="no-scrollbar flex h-full w-[35%] flex-col justify-between overflow-y-auto px-1">
            <form
              onSubmit={handleCalc}
              className="mx-auto flex w-full flex-col gap-5 pb-10"
            >
              {showDiscount && (
                <div className="py-5">
                  <div className="border-primary animate-fade-in relative rounded border px-3 py-6">
                    <h3 className="bg-primary absolute top-0 left-5 flex -translate-y-2/4 gap-2 rounded p-0.5 px-2 font-bold text-white">
                      <BadgePercent /> Chegirma
                    </h3>
                    <div className="flex w-full gap-5">
                      <Input
                        placeholder="100 yoki 5%"
                        onChange={handleDiscount}
                        value={discount}
                        autoFocus={true}
                        autoComplete="off"
                        name={discountType}
                      />
                      <NativeSelect
                        className={"w-30"}
                        onChange={(evt) => {
                          handleChangeDiscountType(evt.target.value);
                        }}
                        value={discountType}
                        defaultValue={discountType}
                      >
                        <NativeSelectOption value={"discountPerM2"}>
                          m2
                        </NativeSelectOption>
                        <NativeSelectOption value={"discountTotal"}>
                          Summa
                        </NativeSelectOption>
                      </NativeSelect>
                    </div>
                  </div>
                </div>
              )}
              <RadioGroup name={"state"} defaultValue="BOX">
                <div className="flex gap-4">
                  <FieldLabel htmlFor="box">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Karobka</FieldTitle>
                        <FieldDescription className="text-xs">
                          Uy hech qanday ta'mirsiz, karobka holatida
                          topshiriladi
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="BOX" id="box" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="ready">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Ta'mirlangan</FieldTitle>
                        <FieldDescription className="text-xs">
                          Uy jihozlashga tayyor bo'ladi
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="READY" id="ready" />
                    </Field>
                  </FieldLabel>
                </div>
              </RadioGroup>
              <div className="grid gap-2">
                <Label htmlFor="downPayment">Boshlang'ich to'lov</Label>
                <InputGroup>
                  <InputGroupInput
                    id="downPayment"
                    onChange={handleDownPayment}
                    value={downPayment}
                    name={"downPayment"}
                    placeholder="0"
                    autoComplete="off"
                    autoFocus={true}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>so'm</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="months">Necha oyga</Label>
                <div className="flex gap-2">
                  <div className="flex gap-1">
                    {paymentPeriods.map((p) => {
                      return (
                        <span
                          onClick={() => {
                            handlePeriod(p);
                          }}
                          className={`inline-flex w-9 cursor-pointer items-center justify-center rounded-full ${
                            period === p
                              ? "bg-primary text-primary-foreground"
                              : "border"
                          }`}
                        >
                          {p}
                        </span>
                      );
                    })}
                  </div>
                  <InputGroup>
                    <InputGroupInput
                      id="months"
                      name={"months"}
                      autoComplete="off"
                      onChange={(evt) => {
                        const value = normalizePeriod(evt.target.value);
                        handlePeriod(value);
                      }}
                      type="number"
                      min={12}
                      max={240}
                      value={period}
                      placeholder="0"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>oy</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>
              <Button variant="secondary" disabled={calcLoading}>
                {calcLoading ? (
                  <>Hisoblanmoqda...</>
                ) : (
                  <>
                    <Calculator /> Hisoblash
                  </>
                )}
              </Button>
            </form>

            <div className="flex flex-col gap-2">
              {home.customer && home.customer.canBeSold === false && (
                <Pointer>
                  <Badge className={"bg-black"}>
                    <Lock /> Ushbu uy ustida amal bajara olmaysiz
                  </Badge>
                </Pointer>
              )}
              {home &&
                actionButtons.map(({ bg, title, code }, index) => {
                  return (
                    code !== home.status && (
                      <Button
                        className={`${bg} hover:${bg} text-primary-foreground hover:text-primary-foreground hover:opacity-90 ${
                          home.customer && home.customer.canBeSold === false
                            ? "pointer-events-none"
                            : ""
                        }`}
                        size="sm"
                        key={index}
                      >
                        {title}
                      </Button>
                    )
                  );
                })}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
