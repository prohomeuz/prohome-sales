import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
  companyName: z.string().min(4, "Kontakt yoki telefon raqamini to'liq kiriting"),
  price: z.coerce.number().min(0, "Summa 0 bo'lishi mumkin emas"),
  columnId: z.union([z.string(), z.number(), z.null()]).optional(),
});

export function LeadDetailsDrawer({ lead, isOpen, onClose }) {
  const updateLead = useCrmStore((state) => state.updateLead);
  const columns = useCrmStore((state) => state.columns);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
    try {
      await updateLead(lead.id, data);
      toast.success("Ma'lumotlar saqlandi");
      onClose();
    } catch (error) {
      toast.error("Saqlashda xatolik yuz berdi");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-gray-50 flex flex-col p-0 gap-0 sm:max-w-md w-full border-l-0 shadow-2xl rounded-l-2xl">
        <SheetHeader className="p-6 pb-4 bg-white border-b border-gray-100 rounded-tl-2xl">
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
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar"
        >
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Holati (Kalonka)
            </Label>
            <Select 
              value={watch("columnId")} 
              onValueChange={(val) => setValue("columnId", val, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full h-12 bg-white rounded-xl border-gray-200">
                <SelectValue placeholder="Bosqichni tanlang" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {columns.map((col) => (
                  <SelectItem key={col.id} value={String(col.id)} className="rounded-lg">
                    {col.title || col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              Summa Kutilmasi ($)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <Input
                type="number"
                {...register("price")}
                className="h-12 bg-white pl-8 rounded-xl border-gray-200 focus:border-[#65a30d] focus:ring-1 focus:ring-[#65a30d] transition-all"
              />
            </div>
            {errors.price && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.price.message}</p>}
          </div>
        </form>

        <SheetFooter className="p-6 bg-white border-t border-gray-100 rounded-bl-2xl">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl h-11 px-6 font-bold text-gray-500 hover:bg-gray-100"
          >
            Bekor qilish
          </Button>
          <Button 
            type="submit" 
            form="lead-edit-form"
            disabled={isSubmitting}
            className="rounded-xl h-11 px-8 font-bold bg-[#65a30d] hover:bg-[#4d7c0f] text-white"
          >
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</> : "Saqlash"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
