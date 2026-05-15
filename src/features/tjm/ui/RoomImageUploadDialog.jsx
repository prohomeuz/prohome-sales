import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, X, Loader2, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function RoomImageUploadDialog({ open, onOpenChange, roomId, roomName, blocId, projectId, onUpload }) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState({
    image2d: { file: null, src: null },
    image3d: { file: null, src: null },
    plan: { file: null, src: null },
  });

  useEffect(() => {
    if (!open) {
      Object.values(images).forEach(img => {
        if (img.src?.startsWith("blob:")) URL.revokeObjectURL(img.src);
      });
      setImages({
        image2d: { file: null, src: null },
        image3d: { file: null, src: null },
        plan: { file: null, src: null },
      });
    }
  }, [open]);

  const handleImageChange = (key, e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (images[key].src?.startsWith("blob:")) {
        URL.revokeObjectURL(images[key].src);
      }
      setImages(prev => ({
        ...prev,
        [key]: { file, src: URL.createObjectURL(file) }
      }));
    }
  };

  const handleRemoveImage = (key) => {
    if (images[key].src?.startsWith("blob:")) {
      URL.revokeObjectURL(images[key].src);
    }
    setImages(prev => ({
      ...prev,
      [key]: { file: null, src: null }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if at least one image is selected (though backend might require all three)
    // Based on Swagger, all three are required.
    if (!images.image2d.file || !images.image3d.file || !images.plan.file) {
      return toast.error("Barcha 3 ta rasm (2D, 3D, Plan) yuklanishi shart!");
    }

    setLoading(true);
    try {
      const success = await onUpload({
        projectId,
        blocId,
        roomIds: [roomId],
        image2d: images.image2d.file,
        image3d: images.image3d.file,
        plan: images.plan.file,
      });

      if (success) {
        toast.success("Rasmlar muvaffaqiyatli yuklandi");
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const renderUploadBox = (key, label) => {
    const img = images[key];
    return (
      <div className="space-y-2">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
          {label}
        </Label>
        <div 
          className={cn(
            "relative group flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed transition-all overflow-hidden",
            img.src ? "border-transparent" : "border-border/40 hover:border-primary/40 bg-muted/50 hover:bg-muted/80"
          )}
        >
          {img.src ? (
            <>
              <img 
                src={img.src} 
                alt={label} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="size-8 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Upload className="size-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(key, e)} />
                </label>
                <button 
                  type="button" 
                  onClick={() => handleRemoveImage(key)}
                  className="size-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <X className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-1">
              <div className="size-8 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-sm mb-1">
                <ImageIcon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-[11px] font-bold text-foreground">Rasm tanlash</p>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(key, e)} />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[32px] overflow-hidden border-none p-0 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-primary/10 via-primary/[0.02] to-transparent">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ImageIcon className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">
                  Rasmlarni yuklash
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Xona №{roomName} uchun 2D, 3D va Plan tasvirlari
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderUploadBox("image2d", "2D Tasvir")}
              {renderUploadBox("image3d", "3D Tasvir")}
            </div>
            {renderUploadBox("plan", "Plan (Chizma)")}

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
              <Info className="size-4 mt-0.5 shrink-0" />
              <p className="text-[10px] leading-tight font-medium">
                Diqqat! Backend talabiga ko'ra barcha 3 ta rasm bir vaqtda yuklanishi shart. 
                Agar biron rasm yetishmasa, vaqtinchalik o'rnini bosuvchi rasm yuklashingiz mumkin.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-10 rounded-xl font-bold text-muted-foreground"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-10 rounded-xl font-bold shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Yuklanmoqda...
                </>
              ) : (
                "Serverga saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
