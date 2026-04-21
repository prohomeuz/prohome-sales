import { Plus, RefreshCcw, Trash, Building2, MapPin, Layers, Image as ImageIcon, X } from "lucide-react";
import { useCallback, useEffect, useReducer } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { buttonVariants } from "@/shared/ui/button";
import { apiRequest } from "@/shared/lib/api";
import { getFormData } from "@/shared/lib/utils";
import { useCompanies } from "@/entities/company/model/use-companies";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

const EMPTY_ERRORS = {
  name: null,
  address: null,
  companyId: null,
  image3d: null,
};

const INITIAL_STATE = {
  image3d: { file: null, src: null },
  addLoading: false,
  errors: EMPTY_ERRORS,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_IMAGE":
      return { ...state, image3d: action.payload };
    case "SET_ADD_LOADING":
      return { ...state, addLoading: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "PATCH_ERRORS":
      return { ...state, errors: { ...state.errors, ...action.payload } };
    case "CLEAR_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.payload]: null },
      };
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

export default function AddTjmModal({ open, onOpenChange, onSuccess }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { image3d, addLoading, errors } = state;
  const { companies, loading: companiesLoading } = useCompanies();

  useEffect(() => {
    if (!open) {
      if (image3d.src?.startsWith("blob:")) URL.revokeObjectURL(image3d.src);
      dispatch({ type: "RESET" });
    }
  }, [open]);

  const handleImage = useCallback((file) => {
    const previousSrc = state.image3d.src;
    if (previousSrc?.startsWith("blob:")) URL.revokeObjectURL(previousSrc);
    dispatch({
      type: "SET_IMAGE",
      payload: { file, src: URL.createObjectURL(file) },
    });
    dispatch({ type: "CLEAR_ERROR", payload: "image3d" });
  }, [state.image3d.src]);

  const handleDeleteImage = useCallback(() => {
    const previousSrc = state.image3d.src;
    if (previousSrc?.startsWith("blob:")) URL.revokeObjectURL(previousSrc);
    dispatch({
      type: "SET_IMAGE",
      payload: { file: null, src: null },
    });
  }, [state.image3d.src]);

  const validate = (data) => {
    const nextErrors = { ...EMPTY_ERRORS };
    let isValid = true;

    if (!data.name?.trim()) {
      nextErrors.name = "TJM nomi majburiy!";
      isValid = false;
    }
    if (!data.address?.trim()) {
      nextErrors.address = "Manzil majburiy!";
      isValid = false;
    }
    if (!data.companyId) {
      nextErrors.companyId = "Kompaniya tanlash majburiy!";
      isValid = false;
    }
    if (!image3d.file) {
      nextErrors.image3d = "3D rasm yuklash majburiy!";
      isValid = false;
    }

    dispatch({ type: "SET_ERRORS", payload: nextErrors });
    return isValid;
  };

  const handleSubmit = useCallback(
    async (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const rawData = getFormData(form);
      
      if (!validate(rawData)) return;

      const formData = new FormData();
      formData.append("name", rawData.name);
      formData.append("address", rawData.address);
      formData.append("companyId", Number(rawData.companyId));
      if (rawData.otherId) formData.append("otherId", Number(rawData.otherId));
      if (image3d.file) formData.append("image3d", image3d.file);

      dispatch({ type: "SET_ADD_LOADING", payload: true });
      try {
        const res = await apiRequest("/api/v1/projects", {
          method: "POST",
          body: formData,
        });

        if (res.status === 201) {
          toast.success("TJM muvaffaqiyatli qo'shildi!");
          onSuccess?.();
          onOpenChange(false);
          return;
        }

        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Xatolik yuz berdi!");
      } catch (err) {
        console.error(err);
        toast.error("Tizimda nosozlik yuz berdi!");
      } finally {
        dispatch({ type: "SET_ADD_LOADING", payload: false });
      }
    },
    [image3d.file, onOpenChange, onSuccess]
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="inset-0 h-[100dvh] max-h-screen rounded-none bg-background data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:rounded-none flex flex-col">
        <DrawerHeader className="relative flex flex-col items-center gap-2 text-center pt-8">
          <DrawerTitle className="text-[14px] font-bold text-foreground">Yangi TJM qo'shish.</DrawerTitle>
          <DrawerDescription className="text-muted-foreground text-xs">
            TJM qo'shish uchun barcha ma'lumotlarni to'ldiring
          </DrawerDescription>
          <DrawerClose
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "absolute top-4 right-4",
            )}
            aria-label="Yopish"
          >
            ✕
          </DrawerClose>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-6 pb-24 overflow-y-auto"
        >
          {/* 3D Image Upload */}
          <div className="flex w-full flex-col gap-2">
            <Label className="text-[13px] font-bold text-foreground">3D Tasvir (Asosiy rasm)*</Label>
            <div className="relative group/img h-[200px] w-full overflow-hidden rounded-[16px] border border-dashed border-border bg-muted/20 transition-all hover:border-primary">
              {!image3d.file ? (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 hover:bg-muted/30">
                  <div className="flex size-11 items-center justify-center rounded-[12px] bg-background border border-border text-muted-foreground shadow-sm">
                    <ImageIcon className="size-5" />
                  </div>
                  <div className="text-center mt-1">
                    <p className="text-[13px] font-bold text-foreground">Rasm yuklash</p>
                    <p className="text-[11px] font-medium text-muted-foreground">TJM 3D ko'rinishi</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
                </label>
              ) : (
                <div className="relative h-full w-full">
                  <img src={image3d.src} className="h-full w-full object-cover" alt="TJM 3D" />
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover/img:opacity-100">
                    <Button type="button" variant="destructive" size="icon" className="h-10 w-10 rounded-full shadow-lg" onClick={handleDeleteImage}>
                      <Trash className="size-4.5" />
                    </Button>
                    <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-background text-foreground shadow-lg hover:bg-muted/50 transition-colors">
                      <RefreshCcw className="size-4.5" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              )}
            </div>
            {errors.image3d && <p className="text-red-500 text-[12px] font-semibold">{errors.image3d}</p>}
          </div>

          <div className="flex w-full flex-col gap-2 relative">
            <Label htmlFor="name" className="text-[13px] font-bold text-foreground">TJM nomi*</Label>
            <Input id="name" name="name" placeholder="Masalan: Golden House" disabled={addLoading} onChange={() => dispatch({ type: "CLEAR_ERROR", payload: "name" })} className="h-[44px] rounded-[10px] border-border bg-background transition-all text-[14px] focus:ring-primary focus:border-primary/50 placeholder:text-muted-foreground" />
            {errors.name && <p className="text-red-500 text-[12px] font-semibold">{errors.name}</p>}
          </div>

          <div className="flex w-full flex-col gap-2 relative">
            <Label htmlFor="companyId" className="text-[13px] font-bold text-foreground">Kompaniya*</Label>
            <Select name="companyId" disabled={addLoading || companiesLoading} onValueChange={() => dispatch({ type: "CLEAR_ERROR", payload: "companyId" })}>
              <SelectTrigger className="h-[44px] rounded-[10px] border-border bg-background transition-all text-[14px] focus:ring-primary focus:border-primary/50 w-full">
                <SelectValue placeholder={companiesLoading ? "Yuklanmoqda..." : "Kompaniyani tanlang"} />
              </SelectTrigger>
              <SelectContent className="rounded-[12px] border-border/40 shadow-xl">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="rounded-[8px] my-0.5 text-[14px]">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyId && <p className="text-red-500 text-[12px] font-semibold">{errors.companyId}</p>}
          </div>

          <div className="flex w-full flex-col gap-2 relative">
            <Label htmlFor="address" className="text-[13px] font-bold text-foreground">Manzil*</Label>
            <Input id="address" name="address" placeholder="Shahar, tuman, ko'cha..." disabled={addLoading} onChange={() => dispatch({ type: "CLEAR_ERROR", payload: "address" })} className="h-[44px] rounded-[10px] border-border bg-background transition-all text-[14px] focus:ring-primary focus:border-primary/50 placeholder:text-muted-foreground" />
            {errors.address && <p className="text-red-500 text-[12px] font-semibold">{errors.address}</p>}
          </div>

          <div className="flex w-full flex-col gap-2 relative">
            <Label htmlFor="otherId" className="text-[13px] font-bold text-foreground">Internal ID (Ixtiyoriy)</Label>
            <Input id="otherId" name="otherId" type="number" placeholder="Qo'shimcha identifikator" disabled={addLoading} className="h-[44px] rounded-[10px] border-border bg-background transition-all text-[14px] focus:ring-primary focus:border-primary/50 placeholder:text-muted-foreground" />
          </div>

          <Button disabled={addLoading} type="submit" className="mt-4 h-[44px] w-full rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[14px] shadow-[0_4px_12px_rgba(94,165,0,0.2)] hover:-translate-y-px transition-all">
            {addLoading ? (
              <><RefreshCcw className="mr-2 size-4.5 animate-spin" /> Qo'shilmoqda...</>
            ) : (
              <><Plus className="mr-2 size-4.5" /> Qo'shish</>
            )}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
