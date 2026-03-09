import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/shared/ui/field";
import { ArrowLeft, Plus, PlusCircle, RefreshCcw, Trash } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer } from "react";
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

const INITIAL_STATE = {
  logo: { file: null, src: null },
  addLoading: false,
  errors: EMPTY_ERRORS,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOGO":
      return { ...state, logo: action.payload };
    case "SET_ADD_LOADING":
      return { ...state, addLoading: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "PATCH_ERRORS":
      return { ...state, errors: { ...state.errors, ...action.payload } };
    case "CLEAR_ERROR":
      return state.errors[action.payload]
        ? {
            ...state,
            errors: { ...state.errors, [action.payload]: null },
          }
        : state;
    default:
      return state;
  }
}

export default function AddCompany() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { logo, addLoading, errors } = state;

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

      dispatch({ type: "SET_ERRORS", payload: next });
      if (next.name) form.name?.focus();
      else if (next.phoneNumber) form.phoneNumber?.focus();
      else if (next.managerName) form.managerName?.focus();
      else if (next.description) form.description?.focus();

      return Object.values(next).every((v) => v === null);
    },
    [formatPhone]
  );

  const handleImage = useCallback((file) => {
    const previousSrc = state.logo.src;
    if (previousSrc?.startsWith("blob:")) URL.revokeObjectURL(previousSrc);
    dispatch({
      type: "SET_LOGO",
      payload: { file, src: URL.createObjectURL(file) },
    });
  }, [state.logo.src]);

  const handleDeleteLogo = useCallback(() => {
    const previousSrc = state.logo.src;
    if (previousSrc?.startsWith("blob:")) URL.revokeObjectURL(previousSrc);
    dispatch({
      type: "SET_LOGO",
      payload: { file: null, src: null },
    });
  }, [state.logo.src]);

  const clearFieldError = useCallback((field) => {
    dispatch({ type: "CLEAR_ERROR", payload: field });
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

      dispatch({ type: "SET_ADD_LOADING", payload: true });
      try {
        const res = await apiRequest("/api/v1/company", {
          method: "POST",
          body: formData,
        });
        if (res.status === 201) {
          await res.json();
          navigate("/company");
          return;
        }
        if (res.status === 409) {
          dispatch({
            type: "PATCH_ERRORS",
            payload: { name: "Ushbu kompaniya ro'yhatdan o'tgan!" },
          });
        } else {
          dispatch({
            type: "PATCH_ERRORS",
            payload: { name: "Xatolik yuz berdi, qayta urunib ko'ring!" },
          });
        }
      } catch {
        dispatch({
          type: "PATCH_ERRORS",
          payload: {
            name: "Tizimda nosozlik, adminga aloqaga chiqing!",
          },
        });
      } finally {
        dispatch({ type: "SET_ADD_LOADING", payload: false });
      }
    },
    [formatPhone, logo.file, navigate, validateCompanyForm]
  );

  return (
    <section className="animate-fade-in h-full overflow-y-auto p-4 sm:p-5 lg:p-6">
      <Link className={`${buttonVariants({ variant: "outline" })} mb-8`} to="/company">
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
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="relative mx-auto h-32 w-32 shrink-0 sm:h-40 sm:w-40 xl:mx-0">
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
          <div className="mb-5 grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
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
            <div className="col-span-1 grid w-full items-center gap-3 lg:col-span-2">
              <Label>Ruxsatlar*</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
