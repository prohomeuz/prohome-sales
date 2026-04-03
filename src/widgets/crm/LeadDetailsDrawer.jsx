import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/shared/ui/sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const leadSchema = z.object({
  title: z.string().min(2, "Ma'lumot kamida 2ta harfdan iborat bo'lishi kerak"),
  companyName: z.string().min(3, "Kontakt yoki telefon raqamini to'liq kiriting"),
  price: z.coerce.number().min(0, "Summa manfiy bo'lmasin"),
  columnId: z.union([z.string(), z.number(), z.null()]).optional(),
});

export function LeadDetailsDrawer({ lead, isOpen, onClose }) {
  const updateLead = useCrmStore((state) => state.updateLead);
  const columns = useCrmStore((state) => state.columns);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: "",
      companyName: "",
      price: 0,
      columnId: "",
    },
  });

  // Reset form when a new lead is selected
  useEffect(() => {
    if (lead && isOpen) {
      reset({
        title: lead.title || "",
        companyName: lead.companyName || "",
        price: Number(lead.price) || 0,
        columnId: lead.columnId ? String(lead.columnId) : "",
      });
    }
  }, [lead, isOpen, reset]);

  const onSubmit = async (data) => {
    if (!lead) return;
    const result = await updateLead(lead.id, {
      ...data,
      columnId: data.columnId ? String(data.columnId) : undefined,
    });
    if (result?.success) {
      toast.success("Ma'lumotlar saqlandi");
      onClose();
      return;
    }

    toast.error(result?.error || "Saqlashda xatolik yuz berdi");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-full w-full max-w-full flex-col gap-0 border-l-0 bg-gray-50 p-0 shadow-2xl sm:max-w-md sm:rounded-l-2xl">
        <SheetHeader className="border-b border-gray-100 bg-white p-4 pb-4 sm:rounded-tl-2xl sm:p-6">
          <SheetTitle className="text-xl font-black text-gray-900">
            Sdelkani Tahrirlash
          </SheetTitle>
          <SheetDescription className="text-gray-400 font-medium">
            Mijoz ma'lumotlarini yoki uning holatini o'zgartiring.
          </SheetDescription>
        </SheetHeader>

        <form 
          id="lead-edit-form"
          onSubmit={handleSubmit(onSubmit)} 
          className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
        >
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Holati (Kalonka)
            </Label>
            <Controller
              name="columnId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl border-gray-200 bg-white">
                    <SelectValue placeholder="Bosqichni tanlang" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {columns.map((col) => (
                      <SelectItem
                        key={col.id}
                        value={String(col.id)}
                        className="rounded-lg"
                      >
                        {col.title || col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Shaxs / Qo'shimcha ma'lumot
            </Label>
            <Input
              {...register("title")}
              className="h-12 bg-white rounded-xl border-gray-200 focus:border-[#65a30d] focus:ring-1 focus:ring-[#65a30d] transition-all"
            />
            {errors.title && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Telefon raqami / Kompaniya
            </Label>
            <Input
              {...register("companyName")}
              className="h-12 bg-white rounded-xl border-gray-200 focus:border-[#65a30d] focus:ring-1 focus:ring-[#65a30d] transition-all"
            />
            {errors.companyName && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Summa kutilmasi (so'm)
            </Label>
            <Input
              type="number"
              {...register("price")}
              className="h-12 bg-white rounded-xl border-gray-200 focus:border-[#65a30d] focus:ring-1 focus:ring-[#65a30d] transition-all"
            />
            {errors.price && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.price.message}</p>}
          </div>
        </form>

        <SheetFooter className="border-t border-gray-100 bg-white p-4 sm:rounded-bl-2xl sm:p-6">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-11 w-full rounded-xl px-6 font-bold text-gray-500 hover:bg-gray-100 sm:w-auto"
          >
            Bekor qilish
          </Button>
          <Button 
            type="submit" 
            form="lead-edit-form"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-[#65a30d] px-8 font-bold text-white hover:bg-[#4d7c0f] sm:w-auto"
          >
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</> : "Saqlash"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
