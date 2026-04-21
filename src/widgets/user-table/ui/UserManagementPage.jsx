/**
 * @file Universal foydalanuvchi boshqaruv sahifasi.
 * @module widgets/user-table/ui/UserManagementPage
 *
 * Admin, Rop va SalesManager sahifalari shu bitta komponent orqali ishlaydi.
 * Farqi faqat `userRole` prop — konfiguratsiya user-role-config.js dan olinadi.
 */

import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { useUserCrud } from "@/features/user-crud/model/use-user-crud";
import { USER_FORM_ERRORS, validateUserForm, validateUpdateForm } from "@/features/user-crud/lib/user-validators";
import { cn, getFormData } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
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
import { Check, Pencil, Plus, Trash, X } from "lucide-react";
import { useCallback, useEffect, useReducer } from "react";
import { USER_ROLE_CONFIG } from "../lib/user-role-config";

const INITIAL_STATE = {
  addModal: false,
  editModal: false,
  editingUser: null,
  showConfirmation: null,
  errors: USER_FORM_ERRORS,
  editErrors: USER_FORM_ERRORS,
};

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_ADD_MODAL":
      return { ...state, addModal: !state.addModal, errors: USER_FORM_ERRORS };
    case "SET_ADD_MODAL":
      return { ...state, addModal: action.payload, errors: USER_FORM_ERRORS };
    case "SET_SHOW_CONFIRMATION":
      return { ...state, showConfirmation: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "CLEAR_ERROR":
      return state.errors[action.payload]
        ? { ...state, errors: { ...state.errors, [action.payload]: null } }
        : state;
    case "OPEN_EDIT":
      return { ...state, editModal: true, editingUser: action.payload, editErrors: USER_FORM_ERRORS };
    case "CLOSE_EDIT":
      return { ...state, editModal: false, editingUser: null, editErrors: USER_FORM_ERRORS };
    case "SET_EDIT_ERRORS":
      return { ...state, editErrors: action.payload };
    case "CLEAR_EDIT_ERROR":
      return state.editErrors[action.payload]
        ? { ...state, editErrors: { ...state.editErrors, [action.payload]: null } }
        : state;
    default:
      return state;
  }
}

/**
 * @param {{ userRole: 'admin' | 'rop' | 'salesmanager' }} props
 */
export default function UserManagementPage({ userRole }) {
  const config = USER_ROLE_CONFIG[userRole];
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { addModal, editModal, editingUser, showConfirmation, errors, editErrors } = state;

  const {
    list,
    error,
    getLoading,
    addLoading,
    removeLoading,
    updateLoading,
    add,
    remove,
    update,
  } = useUserCrud(config.crudType);

  const { start, complete } = useStableLoadingBar({ color: "#5ea500", height: 3 });

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
    (id, fullName) => {
      const args = config.passFullName ? [id, fullName] : [id];
      remove(...args).then(() =>
        dispatch({ type: "SET_SHOW_CONFIRMATION", payload: null }),
      );
    },
    [remove, config.passFullName],
  );

  const toggleConfirm = useCallback((id) => {
    dispatch({
      type: "SET_SHOW_CONFIRMATION",
      payload: showConfirmation === id ? null : id,
    });
  }, [showConfirmation]);

  const handleEditOpen = useCallback((user) => {
    dispatch({ type: "OPEN_EDIT", payload: user });
  }, []);

  const handleEditOpenChange = useCallback((open) => {
    if (!open) dispatch({ type: "CLOSE_EDIT" });
  }, []);

  const clearEditFieldError = useCallback((field) => {
    dispatch({ type: "CLEAR_EDIT_ERROR", payload: field });
  }, []);

  const handleEditSubmit = useCallback(
    async (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const result = {
        ...getFormData(form),
        permissions: new FormData(form).getAll("permissions"),
      };
      if (!validateUpdateForm(form, result, (next) => dispatch({ type: "SET_EDIT_ERRORS", payload: next }))) return;
      const payload = {
        fullName: result.fullName.trim(),
        ...(config.updateIncludesCompanyId ? { companyId: editingUser.companyId ?? 1 } : {}),
        permissions: result.permissions,
      };
      if (result.email?.trim()) payload.email = result.email.trim();
      if (result.password?.trim()) payload.password = result.password.trim();
      const ok = await update(editingUser.id, payload);
      if (ok) dispatch({ type: "CLOSE_EDIT" });
    },
    [update, editingUser],
  );

  return (
    <LoadTransition
      loading={getLoading}
      className="h-full"
      loader={
        <LogoLoader
          title={config.loaderTitle}
          description="Foydalanuvchilar ro'yxati tayyorlanmoqda."
        />
      }
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : (
        <>
          <section className="animate-fade-in relative flex h-full min-h-0 flex-col p-4 sm:p-5 lg:p-6">
            <header className="bg-primary/2 mb-6 flex flex-col gap-3 rounded-[24px] border p-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <h2 className="text-2xl font-bold">{config.title}</h2>
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
              {list.length > 0 ? (
                <>
                  {/* Mobile card view */}
                  <div className="grid gap-3 lg:hidden">
                    {list.map((user, index) => (
                      <article
                        key={user.id}
                        className="rounded-[22px] border bg-background p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-muted-foreground text-xs">#{index + 1}</p>
                            <p className="font-semibold">{user.fullName}</p>
                            <p className="text-muted-foreground text-sm">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {config.canUpdate && (
                              <Button
                                onClick={() => handleEditOpen(user)}
                                variant="ghost"
                                size="icon-sm"
                              >
                                <Pencil />
                              </Button>
                            )}
                            <Button
                              onClick={() => toggleConfirm(user.id)}
                              variant="ghost"
                              size="icon-sm"
                              className="focus-visible:border-destructive focus-visible:ring-destructive/30"
                            >
                              {showConfirmation === user.id ? <X /> : <Trash />}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {user.permission?.PROHOME && (
                            <Badge variant="outline">Prohome</Badge>
                          )}
                          {user.permission?.CRM && (
                            <Badge variant="outline">CRM</Badge>
                          )}
                        </div>

                        {showConfirmation === user.id && (
                          <div className="mt-4 flex justify-end">
                            <Badge
                              onClick={() => handleDelete(user.id, user.fullName)}
                              className={`animate-fade-in cursor-pointer hover:opacity-80  ${removeLoading ? "pointer-events-none opacity-60" : ""}`}
                            >
                              {removeLoading ? (
                                <><Spinner /> O&apos;chirilmoqda...</>
                              ) : (
                                <><Check /> Tasdiqlang</>
                              )}
                            </Badge>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>

                  {/* Desktop table view */}
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
                        {list.map((user, index) => (
                          <TableRow key={user.id} className="group">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{user.fullName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {user.permission?.PROHOME && (
                                  <Badge variant="outline">Prohome</Badge>
                                )}
                                {user.permission?.CRM && (
                                  <Badge variant="outline">CRM</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex w-full min-w-37.5 items-center justify-end gap-1">
                                {showConfirmation === user.id && (
                                  <Badge
                                    onClick={() => handleDelete(user.id, user.fullName)}
                                    className={`animate-fade-in cursor-pointer hover:opacity-80 ${removeLoading ? "pointer-events-none opacity-60" : ""}`}
                                  >
                                    {removeLoading ? (
                                      <><Spinner /> O&apos;chirilmoqda...</>
                                    ) : (
                                      <><Check /> Tasdiqlang</>
                                    )}
                                  </Badge>
                                )}
                                {config.canUpdate && (
                                  <Button
                                    onClick={() => handleEditOpen(user)}
                                    variant="ghost"
                                    size="icon-sm"
                                  >
                                    <Pencil />
                                  </Button>
                                )}
                                <Button
                                  onClick={() => toggleConfirm(user.id)}
                                  variant="ghost"
                                  size="icon-sm"
                                  className="focus-visible:border-destructive focus-visible:ring-destructive/30"
                                >
                                  {showConfirmation === user.id ? <X /> : <Trash />}
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
                <EmptyData text={config.emptyText} />
              )}
            </div>
          </section>

          {/* Edit Drawer */}
          {config.canUpdate && (
            <Drawer open={editModal} onOpenChange={handleEditOpenChange}>
              <DrawerContent className="inset-0 h-screen max-h-screen rounded-none data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:rounded-none">
                <DrawerHeader className="relative flex flex-col items-center gap-2 text-center">
                  <DrawerTitle>{config.editDrawerTitle}</DrawerTitle>
                  <DrawerDescription className="text-muted-foreground text-sm">
                    {config.editDrawerDescription}
                  </DrawerDescription>
                  <DrawerClose
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "absolute top-4 right-4")}
                    aria-label="Yopish"
                  >
                    ✕
                  </DrawerClose>
                </DrawerHeader>

                <form
                  key={editingUser?.id}
                  onSubmit={handleEditSubmit}
                  className="mx-auto flex w-full max-w-sm flex-col gap-5 p-5"
                >
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="edit-fullName">FISH*</Label>
                    <Input
                      type="text"
                      id="edit-fullName"
                      name="fullName"
                      defaultValue={editingUser?.fullName ?? ""}
                      placeholder="To'liq ismingizni yozing"
                      onChange={() => clearEditFieldError("fullName")}
                    />
                    {editErrors.fullName && (
                      <p className="text-destructive text-xs">{editErrors.fullName}</p>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      type="email"
                      id="edit-email"
                      name="email"
                      defaultValue={editingUser?.email ?? ""}
                      autoComplete="username"
                      placeholder="Email"
                      onChange={() => clearEditFieldError("email")}
                    />
                    {editErrors.email && (
                      <p className="text-destructive text-xs">{editErrors.email}</p>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="edit-password">Yangi parol <span className="text-muted-foreground">(ixtiyoriy)</span></Label>
                    <Input
                      type="password"
                      id="edit-password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="O'zgartirmasangiz bo'sh qoldiring"
                      onChange={() => clearEditFieldError("password")}
                    />
                    {editErrors.password && (
                      <p className="text-destructive text-xs">{editErrors.password}</p>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-3">
                    <Label>Ruxsatlar*</Label>
                    <div className="flex gap-5">
                      <FieldLabel>
                        <Field orientation="horizontal">
                          <Checkbox
                            id="edit-permissions-prohome"
                            name="permissions"
                            value="PROHOME"
                            defaultChecked={editingUser?.permission?.PROHOME}
                            onCheckedChange={() => clearEditFieldError("permissions")}
                          />
                          <FieldContent>
                            <FieldTitle>PROHOME</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                      <FieldLabel>
                        <Field orientation="horizontal">
                          <Checkbox
                            id="edit-permissions-crm"
                            name="permissions"
                            value="CRM"
                            defaultChecked={editingUser?.permission?.CRM}
                            onCheckedChange={() => clearEditFieldError("permissions")}
                          />
                          <FieldContent>
                            <FieldTitle>CRM</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    </div>
                    {editErrors.permissions && (
                      <p className="text-destructive text-xs">{editErrors.permissions}</p>
                    )}
                  </div>

                  <Button disabled={updateLoading} type="submit">
                    {updateLoading ? (
                      <><Spinner /> Yangilanmoqda...</>
                    ) : (
                      <><Check /> Saqlash</>
                    )}
                  </Button>
                </form>
              </DrawerContent>
            </Drawer>
          )}

          {/* Add Drawer */}
          <Drawer open={addModal} onOpenChange={handleAddModal}>
            <DrawerContent className="inset-0 h-screen max-h-screen rounded-none data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:rounded-none">
              <DrawerHeader className="relative flex flex-col items-center gap-2 text-center">
                <DrawerTitle>{config.drawerTitle}</DrawerTitle>
                <DrawerDescription className="text-muted-foreground text-sm">
                  {config.drawerDescription}
                </DrawerDescription>
                <DrawerClose
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "absolute top-4 right-4",
                  )}
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
                    <><Spinner /> Qo&apos;shilmoqda...</>
                  ) : (
                    <><Plus /> Qo&apos;shish</>
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
