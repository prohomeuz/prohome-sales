import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// ─── Field definitions ────────────────────────────────────────────────────────
const FIELDS = [
  { key: "title",       label: "Ism (F.I.O)",      type: "text",     required: true,  placeholder: "Abdullayev Jasur" },
  { key: "phone",       label: "Telefon",           type: "tel",      required: true,  placeholder: "+998 90 123 45 67" },
  { key: "budget",      label: "Byudjet ($)",       type: "number",   required: true,  placeholder: "50000" },
  { key: "address",     label: "Manzil / Hudud",    type: "text",     required: true,  placeholder: "Toshkent, Yunusobod" },
  { key: "email",       label: "Email",             type: "email",    required: false, placeholder: "email@example.com" },
  { key: "rooms",       label: "Xona soni",         type: "number",   required: false, placeholder: "3" },
  { key: "floor",       label: "Qavat",             type: "number",   required: false, placeholder: "5" },
  { key: "area",        label: "Maydon (m²)",       type: "number",   required: false, placeholder: "80" },
  {
    key: "buildingType", label: "Qurilish turi", type: "select", required: false,
    options: ["Yangi bino", "Eski bino", "Privatizatsiya", "Idora", "Kotedj"],
  },
  {
    key: "paymentType", label: "To'lov turi", type: "select", required: false,
    options: ["Naqd", "Ipoteka", "Muddatli to'lov", "Almashtirish", "Subsidiya"],
  },
  { key: "notes", label: "Izoh / Qaydlar", type: "textarea", required: false, placeholder: "Qo'shimcha ma'lumotlar…" },
];

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));
const UZ_PHONE = /^\+998\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(raw) {
  return String(raw ?? "").replace(/[^\d+]/g, "");
}

// ─── URL helpers ──────────────────────────────────────────────────────────────
export function getDrawerFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const d = p.get("drawer");
  if (!d) return { open: false, leadId: null, status: "" };
  return { open: true, leadId: d !== "new" ? d : null, status: p.get("status") ?? "" };
}

export function pushDrawerUrl(leadId, status) {
  const p = new URLSearchParams(window.location.search);
  if (leadId) { p.set("drawer", String(leadId)); p.delete("status"); }
  else { p.set("drawer", "new"); if (status) p.set("status", status); }
  history.pushState({}, "", "?" + p);
}

export function clearDrawerUrl() {
  const p = new URLSearchParams(window.location.search);
  p.delete("drawer"); p.delete("status");
  const qs = p.toString();
  history.pushState({}, "", qs ? "?" + qs : window.location.pathname);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LeadDrawer({ open, leadId, initialStatus, leads, voronka, onClose, onAddLead }) {
  const isNew = !leadId;
  const existingLead = leadId ? leads.find((l) => String(l.id) === String(leadId)) : null;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fill form when opening
  useEffect(() => {
    if (!open) return;
    if (existingLead) {
      setForm(Object.fromEntries(FIELDS.map((f) => [f.key, existingLead[f.key] ?? ""])));
    } else {
      setForm({ ...EMPTY, status: initialStatus ?? "" });
    }
    setErrors({});
    setSaveError(null);
  }, [open, leadId, initialStatus]);  // eslint-disable-line

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function validate() {
    const errs = {};
    const title = String(form.title ?? "").trim();
    const phone = normalizePhone(form.phone);
    const budget = Number(form.budget);
    const address = String(form.address ?? "").trim();
    const status = String(form.status || initialStatus || "").trim();
    const email = String(form.email ?? "").trim();
    const rooms = String(form.rooms ?? "").trim();
    const floor = String(form.floor ?? "").trim();
    const area = String(form.area ?? "").trim();

    if (!status) errs.status = "Bosqichni tanlang!";
    if (!title) errs.title = "F.I.O kiriting!";
    else if (title.length < 3) errs.title = "F.I.O kamida 3 ta belgi bo'lsin!";

    if (!phone) errs.phone = "Telefon kiriting!";
    else if (!UZ_PHONE.test(phone)) errs.phone = "Telefon +998xxxxxxxxx formatda bo'lsin!";

    if (!String(form.budget ?? "").trim()) errs.budget = "Byudjet kiriting!";
    else if (!Number.isFinite(budget) || budget <= 0) errs.budget = "Byudjet 0 dan katta bo'lsin!";

    if (!address) errs.address = "Manzil kiriting!";
    if (email && !EMAIL_RE.test(email)) errs.email = "Email noto'g'ri formatda!";
    if (rooms && (!Number.isInteger(Number(rooms)) || Number(rooms) <= 0)) errs.rooms = "Xona soni musbat butun son bo'lsin!";
    if (floor && (!Number.isInteger(Number(floor)) || Number(floor) <= 0)) errs.floor = "Qavat musbat butun son bo'lsin!";
    if (area && (!Number.isFinite(Number(area)) || Number(area) <= 0)) errs.area = "Maydon 0 dan katta bo'lsin!";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const status = (form.status || initialStatus || voronka[0]?.status || "").trim();
      await onAddLead({
        ...form,
        title: String(form.title ?? "").trim(),
        phone: normalizePhone(form.phone),
        budget: Number(form.budget) || 0,
        address: String(form.address ?? "").trim(),
        email: String(form.email ?? "").trim() || undefined,
        notes: String(form.notes ?? "").trim() || undefined,
        rooms: form.rooms ? Number(form.rooms) : undefined,
        floor: form.floor ? Number(form.floor) : undefined,
        area: form.area ? Number(form.area) : undefined,
        status,
      });
      onClose();
    } catch {
      setSaveError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setSaving(false);
    }
  }

  const title = isNew
    ? `Yangi mijoz${initialStatus ? ` — ${initialStatus}` : ""}`
    : existingLead?.title ?? "Mijoz ma'lumotlari";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        {/* Header */}
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            {title}
            {!isNew && existingLead && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {existingLead.status}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Detail view (existing lead) */}
          {!isNew && existingLead && (
            <DetailView lead={existingLead} />
          )}

          {/* Not found */}
          {!isNew && !existingLead && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="text-muted-foreground/40" size={36} />
              <p className="text-muted-foreground text-sm">Mijoz topilmadi</p>
            </div>
          )}

          {/* Add new lead form */}
          {isNew && (
            <div className="flex flex-col gap-4">
              {/* Status selector */}
              {voronka?.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Label>Bosqich <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.status || initialStatus || ""}
                    onValueChange={(v) => {
                      set("status", v);
                      if (errors.status) setErrors((p) => ({ ...p, status: undefined }));
                    }}
                  >
                    <SelectTrigger className={`text-sm ${errors.status ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Bosqichni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {voronka.map((v) => (
                        <SelectItem key={v.id} value={v.status}>{v.status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-destructive text-[11px]">{errors.status}</p>}
                </div>
              )}

              {/* Divider — required */}
              <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium border-b pb-1">
                Majburiy ma'lumotlar
              </p>

              {FIELDS.filter((f) => f.required).map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  error={errors[field.key]}
                  onChange={(v) => { set(field.key, v); if (errors[field.key]) setErrors((p) => ({ ...p, [field.key]: undefined })); }}
                />
              ))}

              {/* Optional */}
              <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium border-b pb-1 mt-2">
                Qo'shimcha ma'lumotlar
              </p>

              {FIELDS.filter((f) => !f.required).map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  error={errors[field.key]}
                  onChange={(v) => {
                    set(field.key, v);
                    if (errors[field.key]) setErrors((p) => ({ ...p, [field.key]: undefined }));
                  }}
                />
              ))}

              {saveError && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle size={13} />
                  {saveError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — only for new lead */}
        {isNew && (
          <div className="border-t px-5 py-3 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 size={13} className="animate-spin" />}
              Saqlash
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────
function FormField({ field, value, error, onChange }) {
  const id = `field-${field.key}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {field.type === "select" ? (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger id={id} className={error ? "border-destructive" : ""}>
            <SelectValue placeholder={`${field.label} tanlang`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`resize-none text-sm ${error ? "border-destructive" : ""}`}
          rows={3}
        />
      ) : (
        <Input
          id={id}
          type={field.type}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`text-sm ${error ? "border-destructive" : ""}`}
        />
      )}
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}

// ─── DetailView ───────────────────────────────────────────────────────────────
function DetailView({ lead }) {
  const rows = [
    { label: "Telefon",       value: lead.phone },
    { label: "Email",         value: lead.email },
    { label: "Manzil",        value: lead.address },
    { label: "Byudjet",       value: lead.budget != null ? `$${Number(lead.budget).toLocaleString()}` : null },
    { label: "Xona soni",     value: lead.rooms != null ? `${lead.rooms} xona` : null },
    { label: "Qavat",         value: lead.floor != null ? `${lead.floor}-qavat` : null },
    { label: "Maydon",        value: lead.area != null ? `${lead.area} m²` : null },
    { label: "Qurilish turi", value: lead.buildingType },
    { label: "To'lov turi",   value: lead.paymentType },
    { label: "Izoh",          value: lead.notes },
  ].filter((r) => r.value);

  if (!rows.length) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Qo'shimcha ma'lumot yo'q
      </p>
    );
  }

  return (
    <dl className="divide-y">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-4 py-2.5">
          <dt className="text-muted-foreground text-xs w-28 shrink-0 mt-0.5">{r.label}</dt>
          <dd className="text-sm font-medium flex-1 break-words">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
