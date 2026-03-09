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
import LoadTransition from "@/widgets/loading/LoadTransition";
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
import { useCallback, useEffect, useReducer } from "react";

const INITIAL_STATE = {
  addModal: false,
  showConfirmation: null,
  errors: USER_FORM_ERRORS,
};

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_ADD_MODAL":
      return {
        ...state,
        addModal: !state.addModal,
        errors: USER_FORM_ERRORS,
      };
    case "SET_ADD_MODAL":
      return {
        ...state,
        addModal: action.payload,
        errors: USER_FORM_ERRORS,
      };
    case "SET_SHOW_CONFIRMATION":
      return { ...state, showConfirmation: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
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

export default function SalesManager() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { addModal, showConfirmation, errors } = state;

  const {
    list: salesmanagers,
    error,
    getLoading,
    addLoading,
    removeLoading,
    add,
    remove,
  } = useUserCrud("sales-manager");

  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  useEffect(() => {
    if (getLoading) start();
    else complete();
  }, [getLoading, start, complete]);

  const handleAddModal = useCallback(() => {
    dispatch({ type: "TOGGLE_ADD_MODAL" });
  }, []);

  const clearFieldError = useCallback((field) => {
    dispatch({ type: "CLEAR_ERROR", payload: field });
  }, []);

  const handleAddSubmit = useCallback(
    async (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const result = {
        ...getFormData(form),
        permissions: new FormData(form).getAll("permissions"),
      };
      if (!validateUserForm(form, result, (next) => dispatch({ type: "SET_ERRORS", payload: next }))) return;
      result.companyId = 1;
      const ok = await add(result);
      if (ok) {
        dispatch({ type: "SET_ADD_MODAL", payload: false });
        dispatch({ type: "SET_SHOW_CONFIRMATION", payload: null });
      }
    },
    [add],
  );

  const handleDelete = useCallback(
    (id) =>
      remove(id).then(() =>
        dispatch({ type: "SET_SHOW_CONFIRMATION", payload: null }),
      ),
    [remove],
  );

  const toggleConfirm = useCallback((id) => {
    dispatch({
      type: "SET_SHOW_CONFIRMATION",
      payload: showConfirmation === id ? null : id,
    });
  }, [showConfirmation]);

  return (
    <LoadTransition
      loading={getLoading}
      className="h-full"
      loader={<LogoLoader title="Sotuv menejerlari yuklanmoqda" description="Foydalanuvchilar ro'yxati tayyorlanmoqda." />}
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : (
        <>
          <section className="animate-fade-in relative flex h-full min-h-0 flex-col p-4 sm:p-5 lg:p-6">
        <header className="bg-primary/2 mb-6 flex flex-col gap-3 rounded-[24px] border p-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 className="text-2xl font-bold">Sotuv menejerlari</h2>
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

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          {salesmanagers.length > 0 ? (
            <>
              <div className="grid gap-3 lg:hidden">
                {salesmanagers.map((sm, index) => (
                  <article
                    key={sm.id}
                    className="rounded-[22px] border bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-muted-foreground text-xs">#{index + 1}</p>
                        <p className="font-semibold">{sm.fullName}</p>
                        <p className="text-muted-foreground text-sm">{sm.email}</p>
                      </div>
                      <Button
                        onClick={() => toggleConfirm(sm.id)}
                        variant="ghost"
                        size="icon-sm"
                      >
                        {showConfirmation === sm.id ? <X /> : <Trash />}
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {sm.permission?.PROHOME && (
                        <Badge variant="outline">Prohome</Badge>
                      )}
                      {sm.permission?.CRM && <Badge variant="outline">CRM</Badge>}
                    </div>

                    {showConfirmation === sm.id && (
                      <div className="mt-4 flex justify-end">
                        <Badge
                          onClick={() => handleDelete(sm.id)}
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
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="hidden lg:block">
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
                    {salesmanagers.map((sm, index) => (
                      <TableRow key={sm.id} className="group">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{sm.fullName}</TableCell>
                        <TableCell>{sm.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {sm.permission?.PROHOME && (
                              <Badge variant="outline">Prohome</Badge>
                            )}
                            {sm.permission?.CRM && (
                              <Badge variant="outline">CRM</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex w-full min-w-37.5 items-center justify-end gap-1">
                            {showConfirmation === sm.id && (
                              <Badge
                                onClick={() => handleDelete(sm.id)}
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
                              onClick={() => toggleConfirm(sm.id)}
                              variant="ghost"
                              size="icon-sm"
                            >
                              {showConfirmation === sm.id ? <X /> : <Trash />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <EmptyData text="Hozircha sotuv menejerlari yo'q" />
          )}
        </div>
          </section>

          <Drawer open={addModal} onOpenChange={handleAddModal}>
        <DrawerContent className="inset-0 h-screen max-h-screen rounded-none data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:rounded-none">
          <DrawerHeader className="relative flex flex-col items-center gap-2 text-center">
            <DrawerTitle>Yangi sotuv menejeri qo&apos;shish.</DrawerTitle>
            <DrawerDescription className="text-muted-foreground text-sm">
              Sotuv menejeri qo&apos;shish uchun barcha ma&apos;lumotlarni
              to&apos;ldiring
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
      )}
    </LoadTransition>
  );
}
