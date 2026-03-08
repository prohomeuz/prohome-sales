import { Button } from "@/shared/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import {
  Archive, BarChart2, Bell, BookOpen, Briefcase, Building2,
  Calendar, CalendarCheck, CheckCircle2, Clock, Code2, Compass,
  Cpu, CreditCard, Database, DollarSign, Eye, FileCheck, FileText,
  Flag, Flame, Gem, Gift, Globe, Hammer, Handshake, Heart, Home,
  Hotel, Key, Layers, Lightbulb, Mail, Map, MapPin, Megaphone,
  MessageCircle, Phone, Rocket, Ruler, Send, Shield, ShieldCheck,
  Sparkles, Star, Tag, Target, TrendingUp, Trophy, UserCheck,
  UserPlus, Users, Wallet, Warehouse, Wrench, Zap,
} from "lucide-react";
import { useState } from "react";

const ICON_LIST = [
  // Real estate
  { name: "Home",         Icon: Home },
  { name: "Building2",    Icon: Building2 },
  { name: "Warehouse",    Icon: Warehouse },
  { name: "Hotel",        Icon: Hotel },
  { name: "MapPin",       Icon: MapPin },
  { name: "Map",          Icon: Map },
  { name: "Compass",      Icon: Compass },
  { name: "Key",          Icon: Key },
  { name: "Ruler",        Icon: Ruler },
  { name: "Hammer",       Icon: Hammer },
  { name: "Wrench",       Icon: Wrench },
  // Finance
  { name: "DollarSign",   Icon: DollarSign },
  { name: "Wallet",       Icon: Wallet },
  { name: "CreditCard",   Icon: CreditCard },
  { name: "TrendingUp",   Icon: TrendingUp },
  { name: "BarChart2",    Icon: BarChart2 },
  // Status / workflow
  { name: "Target",       Icon: Target },
  { name: "Zap",          Icon: Zap },
  { name: "Star",         Icon: Star },
  { name: "Flame",        Icon: Flame },
  { name: "Gem",          Icon: Gem },
  { name: "Rocket",       Icon: Rocket },
  { name: "Trophy",       Icon: Trophy },
  { name: "Sparkles",     Icon: Sparkles },
  { name: "Gift",         Icon: Gift },
  { name: "Flag",         Icon: Flag },
  // People
  { name: "Users",        Icon: Users },
  { name: "UserCheck",    Icon: UserCheck },
  { name: "UserPlus",     Icon: UserPlus },
  { name: "Handshake",    Icon: Handshake },
  { name: "Heart",        Icon: Heart },
  // Communication
  { name: "Phone",        Icon: Phone },
  { name: "Mail",         Icon: Mail },
  { name: "MessageCircle",Icon: MessageCircle },
  { name: "Send",         Icon: Send },
  { name: "Bell",         Icon: Bell },
  { name: "Megaphone",    Icon: Megaphone },
  { name: "Globe",        Icon: Globe },
  // Documents
  { name: "FileText",     Icon: FileText },
  { name: "FileCheck",    Icon: FileCheck },
  { name: "BookOpen",     Icon: BookOpen },
  { name: "Briefcase",    Icon: Briefcase },
  { name: "Layers",       Icon: Layers },
  { name: "Archive",      Icon: Archive },
  // Time
  { name: "Clock",        Icon: Clock },
  { name: "Calendar",     Icon: Calendar },
  { name: "CalendarCheck",Icon: CalendarCheck },
  // Tech
  { name: "Cpu",          Icon: Cpu },
  { name: "Database",     Icon: Database },
  { name: "Code2",        Icon: Code2 },
  // Security
  { name: "Shield",       Icon: Shield },
  { name: "ShieldCheck",  Icon: ShieldCheck },
  // Misc
  { name: "Eye",          Icon: Eye },
  { name: "CheckCircle2", Icon: CheckCircle2 },
  { name: "Tag",          Icon: Tag },
  { name: "Lightbulb",    Icon: Lightbulb },
];

const COLORS = [
  "#f43f5e","#fb7185","#f472b6","#e879f9","#a855f7","#8b5cf6","#6366f1",
  "#3b82f6","#0ea5e9","#06b6d4","#10b981","#65a30d","#f59e0b","#f97316",
  "#ef4444","#22c55e","#fda4af","#c4b5fd","#93c5fd","#6ee7b7","#fde68a",
  "#fed7aa","#d1fae5","#e0e7ff","#be123c","#7c3aed","#1d4ed8","#047857",
  "#b45309","#9f1239","#4c1d95","#1e3a5f",
];

const INIT = { status: "", icon: "Target", color: "#8b5cf6" };

export default function AddColumnModal({ open, onClose, onAdd, insertLabel }) {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit() {
    if (!form.status.trim()) { setErrors({ status: "Status nomi kiritilishi shart" }); return; }
    onAdd(form);
    setForm(INIT);
    setErrors({});
  }

  function handleClose() { setForm(INIT); setErrors({}); onClose(); }

  const SelectedIcon = ICON_LIST.find((i) => i.name === form.icon)?.Icon ?? Target;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="flex size-7 items-center justify-center rounded-md"
              style={{ background: form.color + "22", color: form.color }}
            >
              <SelectedIcon size={16} />
            </span>
            Yangi column qo'shish
            {insertLabel && (
              <span className="text-muted-foreground text-xs font-normal">— {insertLabel}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="col-status">Status nomi <span className="text-destructive">*</span></Label>
            <Input
              id="col-status"
              placeholder="Masalan: Yangi, Ko'rib chiqilmoqda…"
              value={form.status}
              onChange={(e) => {
                set("status", e.target.value);
                if (errors.status) setErrors((p) => ({ ...p, status: undefined }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Icon</Label>
            <div className="max-h-[160px] overflow-y-auto rounded-md border p-2">
              <div className="grid grid-cols-10 gap-1">
                {ICON_LIST.map(({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => set("icon", name)}
                    title={name}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md transition-colors",
                      form.icon === name
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                    style={form.icon === name ? { background: form.color } : {}}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Rang</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform hover:scale-110",
                    form.color === c ? "border-foreground scale-125" : "border-transparent",
                  )}
                  style={{ background: c }}
                />
              ))}
              <label className="text-muted-foreground hover:border-foreground flex size-6 cursor-pointer items-center justify-center rounded-full border border-dashed text-[10px]" title="Maxsus rang">
                +
                <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="sr-only" />
              </label>
              <span className="h-6 rounded-full px-2 font-mono text-[10px] leading-6 text-white shadow-sm" style={{ background: form.color }}>
                {form.color}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Bekor qilish</Button>
          <Button onClick={handleSubmit}>Qo'shish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
