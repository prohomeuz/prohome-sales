import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/shared/ui/field";
import { ArrowLeft, Plus, PlusCircle, RefreshCcw, Trash } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { apiRequest } from "@/shared/lib/api";
import { getFormData } from "@/shared/lib/utils";

const UZ_PHONE = /^\+998\d{9}$/;

const EMPTY_ERRORS = {
  name: null,
  phoneNumber: null,
  managerName: null,
  description: null,
  permissions: null,
};

export default function AddCompany() {
  const navigate = useNavigate();
  const [logo, setLogo] = useState({ file: null, src: null });
  const [addLoading, setAddLoading] = useState(false);
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  useEffect(
    () => () => {
      if (logo.src?.startsWith("blob:")) URL.revokeObjectURL(logo.src);
    },
    [logo.src]
  );

  const formatPhone = useCallback((phone) => {
    if (!phone) return "";
    const trimmed = phone.trim();
    return trimmed.startsWith("+") ? trimmed : `+998${trimmed}`;
  }, []);

  const validateCompanyForm = useCallback(
    (form, data) => {
      const next = { ...EMPTY_ERRORS };
      const name = (data.name ?? "").trim();
      const phone = (data.phoneNumber ?? "").trim();
      const fullPhone = formatPhone(phone);
      const managerName = (data.managerName ?? "").trim();
      const description = (data.description ?? "").trim();

      if (!name) next.name = "Kompaniya nomini kiriting!";
      if (!phone) next.phoneNumber = "Telefon raqamni kiriting!";
      else if (!UZ_PHONE.test(fullPhone)) next.phoneNumber = "Telefon raqam +998xxxxxxxxx formatda bo'lishi kerak!";
      if (!managerName) next.managerName = "Boshqaruvchi ismini kiriting!";
      if (!description) next.description = "Kompaniya uchun izoh yozing!";
      if (!data.permissions?.length) next.permissions = "Kompaniya uchun ruxsatlarni belgilang!";

      setErrors(next);
      if (next.name) form.name?.focus();
      else if (next.phoneNumber) form.phoneNumber?.focus();
      else if (next.managerName) form.managerName?.focus();
      else if (next.description) form.description?.focus();

      return Object.values(next).every((v) => v === null);
    },
    [formatPhone]
  );

  const handleImage = useCallback((file) => {
    setLogo((prev) => {
      if (prev.src?.startsWith("blob:")) URL.revokeObjectURL(prev.src);
      return { ...prev, src: URL.createObjectURL(file), file };
    });
  }, []);

  const handleDeleteLogo = useCallback(() => {
    setLogo((prev) => {
      if (prev.src?.startsWith("blob:")) URL.revokeObjectURL(prev.src);
      return { ...prev, file: null, src: null };
    });
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const data = {
        ...getFormData(form),
        permissions: new FormData(form).getAll("permissions"),
      };
      if (!validateCompanyForm(form, data)) return;

      const formattedPhone = formatPhone(data.phoneNumber);
      const formData = new FormData();
      Object.entries({
        ...data,
        phoneNumber: formattedPhone,
      }).forEach(([k, v]) => {
        if (k === "logo") return;
        if (v !== null && v !== undefined) formData.append(k, v);
      });
      if (logo.file) formData.append("logo", logo.file);

      setAddLoading(true);
      try {
        const res = await apiRequest("/api/v1/company", {
          method: "POST",
          body: formData,
        });
        if (res.status === 201) {
          const result = await res.json();
          navigate("/company");
          return;
        }
        if (res.status === 409) setErrors((e) => ({ ...e, name: "Ushbu kompaniya ro'yhatdan o'tgan!" }));
        else setErrors((e) => ({ ...e, name: "Xatolik yuz berdi, qayta urunib ko'ring!" }));
      } catch {
        setErrors((e) => ({ ...e, name: "Tizimda nosozlik, adminga aloqaga chiqing!" }));
      } finally {
        setAddLoading(false);
      }
    },
    [formatPhone, logo.file, navigate, validateCompanyForm]
  );

  return (
    <section className="animate-fade-in h-full p-5">
      <Link className={`${buttonVariants({ variant: "outline" })} mb-10`} to="/company">
        <ArrowLeft />
        Orqaga
      </Link>
      <div className="mb-5">
        <h2 className="mb-5 text-3xl font-bold">Yangi kompaniya qo&apos;shish</h2>
        <p className="text-muted-foreground">
          Yangi kompaniya qo&apos;shish uchun barcha ma&apos;lumotlarni kiritishingiz
          kerak!
        </p>
      </div>
      <div className="flex items-start gap-10">
        <div className="relative h-40 w-40 shrink-0">
          {!logo.file ? (
            <label
              className="hover:border-primary group inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg border-4 border-dashed transition-colors"
              htmlFor="logo"
            >
              <input
                onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                className="hidden"
                accept="image/*"
                id="logo"
                type="file"
              />
              <Plus className="group-hover:text-primary transition-colors" />
            </label>
          ) : (
            <div className="relative h-full w-full">
              <img
                className="inline-block h-full w-full rounded-lg object-cover object-center"
                src={logo.src}
                alt="Company logo"
              />
              <div className="absolute inset-0 flex rounded-lg bg-black/50">
                <div
                  onClick={handleDeleteLogo}
                  className="group flex h-full w-full cursor-pointer items-center justify-center"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleDeleteLogo()}
                >
                  <Trash className="group-hover:text-destructive text-white" />
                </div>
                <label className="group inline-flex h-full w-full cursor-pointer items-center justify-center">
                  <input
                    onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                    id="logo"
                    type="file"
                  />
                  <RefreshCcw className="text-white transition-opacity group-hover:opacity-80" />
                </label>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="relative flex w-full flex-col">
          <div className="mb-5 grid w-full grid-cols-2 gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">Kompaniya nomi*</Label>
              <Input
                className="w-full"
                id="name"
                name="name"
                type="text"
                placeholder="Kompaniya nomini kiriting"
                disabled={addLoading}
                onChange={() => clearFieldError("name")}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="managerName">Boshqaruvchi*</Label>
              <Input
                id="managerName"
                name="managerName"
                type="text"
                placeholder="Boshqaruvchi ismini kiriting"
                disabled={addLoading}
                onChange={() => clearFieldError("managerName")}
              />
              {errors.managerName && (
                <p className="text-destructive text-xs">{errors.managerName}</p>
              )}
            </div>
            <div className="col-span-2 grid w-full gap-2">
              <Label htmlFor="phoneNumber">Telefon raqami*</Label>
              <InputGroup>
                <InputGroupInput
                  className="pl-1!"
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  placeholder="xxxxxxx"
                  disabled={addLoading}
                  onChange={() => clearFieldError("phoneNumber")}
                />
                <InputGroupAddon>
                  <InputGroupText>+998</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {errors.phoneNumber && (
                <p className="text-destructive text-xs">{errors.phoneNumber}</p>
              )}
            </div>
            <div className="col-span-2 grid w-full gap-3">
              <Label htmlFor="description">Izoh*</Label>
              <Textarea
                className="max-h-16"
                placeholder="Kompaniya haqida izoh yozing"
                id="description"
                name="description"
                disabled={addLoading}
                onChange={() => clearFieldError("description")}
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description}</p>
              )}
            </div>
            <div className="col-span-2 grid w-full items-center gap-3">
              <Label>Ruxsatlar*</Label>
              <div className="flex gap-5">
                <FieldLabel>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="permissions-prohome"
                      name="permissions"
                      value="PROHOME"
                      onCheckedChange={() => clearFieldError("permissions")}
                    />
                    <FieldContent>
                      <FieldTitle>PROHOME</FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                <FieldLabel>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="permissions-crm"
                      name="permissions"
                      value="CRM"
                      onCheckedChange={() => clearFieldError("permissions")}
                    />
                    <FieldContent>
                      <FieldTitle>CRM</FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </div>
              {errors.permissions && (
                <p className="text-destructive text-xs">{errors.permissions}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Link className={buttonVariants({ variant: "outline" })} to="/company">
              Bekor qilish
            </Link>
            <Button disabled={addLoading} type="submit">
              {addLoading ? (
                <>
                  <RefreshCcw className="animate-spin" />
                  Qo&apos;shilmoqda...
                </>
              ) : (
                <>
                  <PlusCircle />
                  Qo&apos;shish
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
