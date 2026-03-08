import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { useUserCrud } from "@/shared/hooks/use-user-crud";
import { getFormData } from "@/shared/lib/utils";
import { USER_FORM_ERRORS, validateUserForm } from "@/shared/lib/validators";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { Field, FieldContent, FieldLabel, FieldTitle } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import EmptyData from "@/widgets/EmptyData";
import GeneralError from "@/widgets/error/GeneralError";
import LogoLoader from "@/widgets/loading/LogoLoader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/widgets/optics/table";
import { Check, Plus, Trash, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function Rop() {
  const [addModal, setAddModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [errors, setErrors] = useState(USER_FORM_ERRORS);

  const {
    list: rops,
    error,
    getLoading,
    addLoading,
    removeLoading,
    add,
    remove,
  } = useUserCrud("rop");

  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  useEffect(() => {
    if (getLoading) start();
    else complete();
  }, [getLoading, start, complete]);

  const handleAddModal = useCallback(() => {
    setErrors(USER_FORM_ERRORS);
    setAddModal((v) => !v);
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  }, []);

  const handleAddSubmit = useCallback(
    async (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const result = {
        ...getFormData(form),
        permissions: new FormData(form).getAll("permissions"),
      };
      if (!validateUserForm(form, result, setErrors)) return;
      result.companyId = 1;
      const ok = await add(result);
      if (ok) setAddModal(false);
    },
    [add, setErrors],
  );

  const handleDelete = useCallback(
    (id) => remove(id).then(() => setShowConfirmation(null)),
    [remove],
  );

  const toggleConfirm = useCallback((id) => {
    setShowConfirmation((prev) => (prev === id ? null : id));
  }, []);

  if (getLoading) return <LogoLoader />;
  if (error) return <GeneralError />;

  return (
    <>
      <section className="animate-fade-in relative h-full p-5">
        <header className="bg-primary/2 mb-10 flex items-center justify-between rounded border p-3">
          <h2 className="text-2xl font-bold">Roplar</h2>
          <Button
            onClick={handleAddModal}
            disabled={getLoading || addLoading}
            variant="secondary"
            size="sm"
          >
            <Plus />
            Qo&apos;shish
          </Button>
        </header>

        <div className="flex h-full max-h-75 w-full flex-col gap-4 overflow-y-auto pr-2">
          {rops.length > 0 ? (
            <Table className="w-full">
              <TableHeader className="bg-background sticky top-0">
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>Ism</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruxsatlar</TableHead>
                  <TableHead className="text-end">Harakatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rops.map((rp, index) => (
                  <TableRow key={rp.id} className="group">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{rp.fullName}</TableCell>
                    <TableCell>{rp.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {rp.permission?.PROHOME && (
                          <Badge variant="outline">Prohome</Badge>
                        )}
                        {rp.permission?.CRM && (
                          <Badge variant="outline">CRM</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex w-full min-w-37.5 items-center justify-end gap-1">
                        {showConfirmation === rp.id && (
                          <Badge
                            onClick={() => handleDelete(rp.id)}
                            className={`animate-fade-in cursor-pointer hover:opacity-80 ${removeLoading ? "pointer-events-none opacity-60" : ""}`}
                          >
                            {removeLoading ? (
                              <>
                                <Spinner /> O&apos;chirilmoqda...
                              </>
                            ) : (
                              <>
                                <Check /> Tasdiqlang
                              </>
                            )}
                          </Badge>
                        )}
                        <Button
                          onClick={() => toggleConfirm(rp.id)}
                          variant="ghost"
                          size="icon-sm"
                        >
                          {showConfirmation === rp.id ? <X /> : <Trash />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData text="Hozircha roplar yo'q" />
          )}
        </div>
      </section>

      <Drawer open={addModal} onOpenChange={handleAddModal}>
        <DrawerContent className="inset-0 h-screen max-h-screen rounded-none data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:rounded-none">
          <DrawerHeader className="relative flex flex-col items-center gap-2 text-center">
            <DrawerTitle>Yangi rop qo&apos;shish.</DrawerTitle>
            <DrawerDescription className="text-muted-foreground text-sm">
              Rop qo&apos;shish uchun barcha ma&apos;lumotlarni to&apos;ldiring
            </DrawerDescription>
            <DrawerClose
              className="absolute top-4 right-4 rounded-full border px-2 py-1 text-sm"
              aria-label="Yopish"
            >
              ✕
            </DrawerClose>
          </DrawerHeader>
          <form
            onSubmit={handleAddSubmit}
            className="mx-auto flex w-full max-w-sm flex-col gap-5 p-5"
          >
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="fullName">FISH*</Label>
              <Input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="To'liq ismingizni yozing"
                onChange={() => clearFieldError("fullName")}
              />
              {errors.fullName && (
                <p className="text-destructive text-xs">{errors.fullName}</p>
              )}
            </div>
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="email">Email*</Label>
              <Input
                type="email"
                id="email"
                name="email"
                autoComplete="username"
                placeholder="Email"
                onChange={() => clearFieldError("email")}
              />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email}</p>
              )}
            </div>
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="password">Parol*</Label>
              <Input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="********"
                onChange={() => clearFieldError("password")}
              />
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password}</p>
              )}
            </div>
            <div className="grid w-full items-center gap-3">
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
            <Button disabled={addLoading} type="submit">
              {addLoading ? (
                <>
                  <Spinner /> Qo&apos;shilmoqda...
                </>
              ) : (
                <>
                  <Plus /> Qo&apos;shish
                </>
              )}
            </Button>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
