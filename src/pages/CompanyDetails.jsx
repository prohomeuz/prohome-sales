import { useCompanyDetails } from "@/shared/hooks/use-company-details";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { apiUrl } from "@/shared/lib/api";
import { getFormData } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldContent, FieldLabel, FieldTitle } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import GeneralError from "@/widgets/error/GeneralError";
import LogoLoader from "@/widgets/loading/LogoLoader";
import {
  ArrowLeft,
  CircleCheck,
  CircleXIcon,
  Power,
  RefreshCcw,
  Search,
  ShieldAlert,
  Trash,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const UZ_PHONE = /^\+998\d{9}$/;

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [logo, setLogo] = useState({ file: null, src: null, removed: false });
  const [errors, setErrors] = useState({
    name: null,
    phoneNumber: null,
    managerName: null,
    description: null,
    permissions: null,
  });

  const {
    details,
    notFound,
    error,
    getLoading,
    editLoading,
    statusLoading,
    deleteLoading,
    get,
    edit,
    toggleStatus,
    remove,
  } = useCompanyDetails(id);

  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  useEffect(() => {
    if (getLoading) start();
    else complete();
  }, [getLoading, start, complete]);

  useEffect(
    () => () => {
      if (logo.src?.startsWith("blob:")) URL.revokeObjectURL(logo.src);
    },
    [logo.src],
  );

  const formatPhone = useCallback((phone) => {
    if (!phone) return "";
    const trimmed = phone.trim();
    return trimmed.startsWith("+") ? trimmed : `+998${trimmed}`;
  }, []);

  const validateCompanyEditForm = useCallback(
    (form, data) => {
      const next = {
        name: null,
        phoneNumber: null,
        managerName: null,
        description: null,
        permissions: null,
      };
      const name = (data.name ?? "").trim();
      const phone = (data.phoneNumber ?? "").trim();
      const fullPhone = formatPhone(phone);
      const managerName = (data.managerName ?? "").trim();
      const description = (data.description ?? "").trim();

      if (!name) next.name = "Kompaniya nomini kiriting!";
      if (!phone) next.phoneNumber = "Telefon raqamni kiriting!";
      else if (!UZ_PHONE.test(fullPhone))
        next.phoneNumber =
          "Telefon raqam +998xxxxxxxxx formatda bo'lishi kerak!";
      if (!managerName) next.managerName = "Boshqaruvchi ismini kiriting!";
      if (!description) next.description = "Kompaniya uchun izoh yozing!";
      if (!data.permissions?.length)
        next.permissions = "Kompaniya uchun ruxsatlarni belgilang!";

      setErrors(next);
      if (next.name) form.name?.focus();
      else if (next.phoneNumber) form.phoneNumber?.focus();
      else if (next.managerName) form.managerName?.focus();
      else if (next.description) form.description?.focus();

      return Object.values(next).every((v) => v === null);
    },
    [formatPhone],
  );

  const handleEditMode = useCallback(() => {
    setErrors({
      name: null,
      phoneNumber: null,
      managerName: null,
      description: null,
      permissions: null,
    });
    setEditMode((v) => !v);
  }, []);

  const handleImage = useCallback((file) => {
    setLogo((prev) => {
      if (prev.src?.startsWith("blob:")) URL.revokeObjectURL(prev.src);
      return {
        ...prev,
        src: URL.createObjectURL(file),
        file,
        removed: false,
      };
    });
  }, []);

  const handleRemoveImage = useCallback(() => {
    setLogo((prev) => {
      if (prev.src?.startsWith("blob:")) URL.revokeObjectURL(prev.src);
      return { file: null, src: null, removed: true };
    });
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  }, []);

  const handleSubmit = useCallback(
    (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const data = {
        ...getFormData(form),
        permissions: new FormData(form).getAll("permissions"),
      };
      if (!validateCompanyEditForm(form, data)) return;
      edit({
        ...data,
        logo: logo.file ?? undefined,
        removeLogo: logo.removed && !logo.file,
        phoneNumber: formatPhone(data.phoneNumber),
      }).then((ok) => {
        if (ok) {
          setLogo((prev) => ({
            ...prev,
            file: null,
            src: null,
            removed: false,
          }));
          handleEditMode();
        }
      });
    },
    [
      edit,
      formatPhone,
      logo.file,
      logo.removed,
      handleEditMode,
      validateCompanyEditForm,
    ],
  );

  const handleDelete = useCallback(async () => {
    const ok = await remove();
    if (ok) navigate("/company");
  }, [remove, navigate]);

  const avatarSrc =
    logo.src && logo.src.startsWith("blob:")
      ? logo.src
      : !logo.removed && details?.logo
        ? apiUrl(details.logo)
        : undefined;

  if (getLoading) return <LogoLoader />;
  if (error) return <GeneralError />;
  if (notFound)
    return (
      <div className="animate-fade-in flex h-full w-full items-center justify-center">
        <div className="tex-center flex w-full max-w-sm flex-col items-center">
          <h3 className="mb-3 text-2xl font-medium">404</h3>
          <p className="text-muted-foreground mb-5">
            Bunday kompaniya mavjud emas!
          </p>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            to="/company"
          >
            <Search /> Mavjud kompaniyalar
          </Link>
        </div>
      </div>
    );

  if (!details) return null;

  return (
    <section className="animate-fade-in h-full p-5">
      <div className="mb-10 flex items-center justify-between">
        <Link className={buttonVariants({ variant: "outline" })} to="/company">
          <ArrowLeft />
          Orqaga
        </Link>
        <div className="flex items-center space-x-2">
          <Switch
            id="edit-mode"
            checked={editMode}
            onCheckedChange={handleEditMode}
          />
          <Label htmlFor="edit-mode">O&apos;zgartirish</Label>
        </div>
      </div>

      <div className="relative mb-4 rounded border px-3 py-6">
        <h3 className="bg-background text-muted-foreground absolute top-0 left-5 flex -translate-y-2/4 gap-2 px-2 font-bold">
          <ShieldAlert /> Muhim harakatlar
        </h3>
        <div className="flex items-center justify-between">
          {!statusLoading && (
            <Badge
              className={`animate-fade-in ${details.status === false ? "bg-background" : ""}`}
              variant={details.status ? "default" : "outline"}
            >
              {details.status ? (
                <>
                  <CircleCheck /> Faol
                </>
              ) : (
                <>
                  <CircleXIcon /> To&apos;xtagan
                </>
              )}
            </Badge>
          )}
          {statusLoading && (
            <p>
              {details.status ? "To'xtatilmoqda..." : "Faollashtirilmoqda..."}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={toggleStatus}
              disabled={!editMode || statusLoading || editLoading}
              variant={details.status ? "secondary" : "default"}
            >
              <Power /> {details.status ? "To'xtatish" : "Faollashtirish"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={deleteLoading || editLoading || statusLoading}
                  variant="destructive"
                >
                  {deleteLoading ? (
                    <>
                      <RefreshCcw className="animate-spin" />
                      O&apos;chirilmoqda...
                    </>
                  ) : (
                    <>
                      <Trash />
                      O&apos;chirish
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Rostan ham <span className="font-mono">{details.name}</span>{" "}
                    kompaniyasini o&apos;chirib yubormoqchimisiz?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Yaxshilab o&apos;ylab ko&apos;ring, bu jarayonni ortga
                    qaytarish imkonsiz!
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Yo&apos;q</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Ha
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-10">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-lg">
          <Avatar className="h-full w-full rounded-lg">
            <AvatarImage src={avatarSrc} alt={details.name?.[0]} />
            <AvatarFallback className="rounded-lg uppercase select-none">
              <span className="text-5xl">{details.name?.[0]}</span>
            </AvatarFallback>
          </Avatar>
          {editMode && (
            <div
              className={`animate-fade-in absolute inset-0 z-10 flex bg-black/50 ${editLoading ? "pointer-events-none opacity-80" : ""}`}
            >
              {avatarSrc && (
                <div
                  onClick={handleRemoveImage}
                  className="group flex h-full w-full cursor-pointer items-center justify-center"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleRemoveImage()}
                >
                  <Trash className="group-hover:text-destructive h-10 w-10 text-white" />
                </div>
              )}
              <label
                className="group inline-flex h-full w-full cursor-pointer items-center justify-center"
                htmlFor="image"
              >
                <RefreshCcw className="h-10 w-10 text-white group-hover:opacity-80" />
                <input
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleImage(e.target.files[0])
                  }
                  id="image"
                  type="file"
                  accept="image/*"
                />
              </label>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative flex w-full flex-col">
          <div className="grid w-full grid-cols-2 gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">Kompaniya nomi*</Label>
              <Input
                className="w-full"
                id="name"
                name="name"
                type="text"
                placeholder="Kompaniya nomini kiriting"
                defaultValue={details.name}
                disabled={!editMode || editLoading || statusLoading}
                onChange={() => clearFieldError("name")}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name}</p>
              )}
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="managerName">Boshqaruvchi*</Label>
              <Input
                id="managerName"
                name="managerName"
                type="text"
                placeholder="Boshqaruvchi ismini kiriting"
                defaultValue={details.managerName}
                disabled={!editMode || editLoading || statusLoading}
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
                  defaultValue={details.phoneNumber?.replace("+998", "")}
                  disabled={!editMode || editLoading || statusLoading}
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
                defaultValue={details.description}
                disabled={!editMode || editLoading || statusLoading}
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
                      defaultChecked={details.permissions?.PROHOME}
                      name="permissions"
                      value="PROHOME"
                      disabled={!editMode || editLoading || statusLoading}
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
                      defaultChecked={details.permissions?.CRM}
                      name="permissions"
                      value="CRM"
                      disabled={!editMode || editLoading || statusLoading}
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
          {editMode && (
            <div className="animate-fade-in absolute right-0 -bottom-5 flex translate-y-full gap-3">
              <Button
                onClick={handleEditMode}
                variant="outline"
                type="button"
                disabled={editLoading || statusLoading}
              >
                Bekor qilish
              </Button>
              <Button disabled={editLoading || statusLoading} type="submit">
                {editLoading ? (
                  <>
                    <RefreshCcw className="animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>Saqlash</>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
