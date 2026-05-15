import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import { Building2, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { apiUrl } from "@/shared/lib/api";

export default function ProjectDialog({ open, onOpenChange, project = null, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });
  const [image, setImage] = useState({ file: null, src: null });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        address: project.address || "",
      });
      setImage({
        file: null,
        src: project.image3d ? apiUrl(project.image3d) : null
      });
    } else {
      setFormData({ name: "", address: "" });
      setImage({ file: null, src: null });
    }
  }, [project, open]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (image.src && image.src.startsWith("blob:")) {
        URL.revokeObjectURL(image.src);
      }
      setImage({
        file,
        src: URL.createObjectURL(file)
      });
    }
  };

  const handleRemoveImage = () => {
    if (image.src && image.src.startsWith("blob:")) {
      URL.revokeObjectURL(image.src);
    }
    setImage({ file: null, src: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Loyiha nomi kiritilishi shart");

    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("address", formData.address.trim());
      
      if (image.file) {
        data.append("image3d", image.file, image.file.name || "project.png");
      }


      // Preserve status if it exists
      if (project && project.status !== undefined) {
        data.append("status", String(project.status));
      }

      // Send companyId if it exists in project
      if (project && project.companyId) {
        data.append("companyId", String(project.companyId));
      }

      // Preserve statusOrder if it exists
      if (project && Array.isArray(project.statusOrder)) {
        project.statusOrder.forEach(val => {
          data.append("statusOrder", String(val));
        });
      }



      const success = await onSave(data, project?.id);
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] overflow-hidden border-none p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-8 bg-gradient-to-br from-primary/10 via-primary/[0.02] to-transparent">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="size-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {project ? "Loyihani tahrirlash" : "Yangi loyiha qo'shish"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Turar joy majmuasi ma'lumotlarini kiriting
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Loyiha nomi *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Masalan: Dream House"
                className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Manzil
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                placeholder="Masalan: Toshkent sh., Yunusobod tumani"
                className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Loyiha surati (3D)
              </Label>
              
              <div 
                className={cn(
                  "relative group flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed transition-all overflow-hidden",
                  image.src ? "border-transparent" : "border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-muted/20"
                )}
              >
                {image.src ? (
                  <>
                    <img 
                      src={image.src} 
                      alt="Project preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="size-10 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <Upload className="size-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                      <button 
                        type="button" 
                        onClick={handleRemoveImage}
                        className="size-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-3">
                    <div className="size-12 rounded-2xl bg-background border border-border/40 flex items-center justify-center shadow-sm">
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">Rasm yuklash</p>
                      <p className="text-[10px] text-muted-foreground font-medium">PNG, JPG formatlar (max 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex-row gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 rounded-2xl font-bold text-muted-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saqlanmoqda...
                </>
              ) : (
                project ? "O'zgarishlarni saqlash" : "Loyihani yaratish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
