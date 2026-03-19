/**
 * @file Xona holati o'zgartirish dialogi.
 * @module widgets/calculator/ui/StatusChangeDialog
 *
 * SOLD / RESERVED / NOT / EMPTY holatlari uchun mijoz formasi.
 * Barcha state va handlerlar props orqali ota-komponentdan keladi.
 */

import { cn, formatNumber, formatNumberWithPercent } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import {
  FileText,
  MessageSquareText,
  Phone,
  UserRound,
} from "lucide-react";
import { normalizePeriod } from "@/shared/lib/utils";
import { formatUzPhoneDisplay, digitsOnly } from "../lib/helpers";
import { statusBadgeClass, statusLabels, MIN_INSTALLMENTS, MAX_INSTALLMENTS } from "../lib/constants";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onSubmit: (evt: React.FormEvent) => void,
 *   activeAction: object | null,
 *   home: object,
 *   statusForm: object,
 *   statusErrors: object,
 *   hasDiscountValue: boolean,
 *   actionInProgress: boolean,
 *   pendingAction: string | null,
 *   onFieldChange: (field: string, value: string) => void,
 * }} props
 */
export default function StatusChangeDialog({
  open,
  onOpenChange,
  onSubmit,
  activeAction,
  home,
  statusForm,
  statusErrors,
  hasDiscountValue,
  actionInProgress,
  pendingAction,
  onFieldChange,
}) {
  const ActiveActionIcon = activeAction?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        {activeAction && (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <DialogHeader className="gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1 flex size-11 shrink-0 items-center justify-center rounded-lg border",
                    activeAction.iconTone,
                  )}
                >
                  {ActiveActionIcon && <ActiveActionIcon className="size-5" />}
                </span>
                <div className="space-y-1 text-left">
                  <DialogTitle>{activeAction.title}</DialogTitle>
                  <DialogDescription>
                    #{home.houseNumber} uy uchun statusni{" "}
                    <span className="font-medium">
                      {activeAction.title.toLowerCase()}
                    </span>{" "}
                    oqimi.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Hozirgi holat xulosa */}
            <div className="bg-primary/5 grid gap-2 rounded-xl border p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Joriy holat</span>
                <Badge
                  className={cn(
                    "text-primary-foreground",
                    statusBadgeClass[home.status],
                  )}
                >
                  {statusLabels[home.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Uy raqami</span>
                <span className="font-mono">#{home.houseNumber}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Umumiy qiymat</span>
                <span className="font-mono">
                  {formatNumber(home.price * home.size)}
                </span>
              </div>
            </div>

            {/* SOLD / RESERVED: mijoz ma'lumotlari */}
            {(activeAction.code === "SOLD" ||
              activeAction.code === "RESERVED") && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="status-firstName">Ism*</Label>
                    <Input
                      id="status-firstName"
                      autoFocus
                      value={statusForm.firstName}
                      onChange={(evt) =>
                        onFieldChange("firstName", evt.target.value)
                      }
                      placeholder="Ali"
                    />
                    {statusErrors.firstName && (
                      <p className="text-destructive text-xs">
                        {statusErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status-lastName">Familiya*</Label>
                    <Input
                      id="status-lastName"
                      value={statusForm.lastName}
                      onChange={(evt) =>
                        onFieldChange("lastName", evt.target.value)
                      }
                      placeholder="Valiyev"
                    />
                    {statusErrors.lastName && (
                      <p className="text-destructive text-xs">
                        {statusErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="status-phone">Telefon*</Label>
                    <div className="relative">
                      <Phone className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="status-phone"
                        value={statusForm.phone}
                        onChange={(evt) =>
                          onFieldChange(
                            "phone",
                            formatUzPhoneDisplay(evt.target.value),
                          )
                        }
                        placeholder="+998 (__) ___ __ __"
                        className="pl-9"
                      />
                    </div>
                    {statusErrors.phone && (
                      <p className="text-destructive text-xs">
                        {statusErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status-downPayment">
                      Boshlang'ich to'lov
                    </Label>
                    <Input
                      id="status-downPayment"
                      value={statusForm.downPayment}
                      onChange={(evt) =>
                        onFieldChange(
                          "downPayment",
                          formatNumber(digitsOnly(evt.target.value) || 0),
                        )
                      }
                      placeholder="0"
                    />
                    {statusErrors.downPayment && (
                      <p className="text-destructive text-xs">
                        {statusErrors.downPayment}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "grid gap-4",
                    activeAction.code === "SOLD" ? "sm:grid-cols-2" : "",
                  )}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="status-installments">Muddat (oy)*</Label>
                    <Input
                      id="status-installments"
                      type="number"
                      min={MIN_INSTALLMENTS}
                      max={MAX_INSTALLMENTS}
                      value={statusForm.installments}
                      onChange={(evt) =>
                        onFieldChange(
                          "installments",
                          normalizePeriod(evt.target.value),
                        )
                      }
                      placeholder="60"
                    />
                    {statusErrors.installments && (
                      <p className="text-destructive text-xs">
                        {statusErrors.installments}
                      </p>
                    )}
                  </div>

                  {activeAction.code === "SOLD" && (
                    <div className="grid gap-2">
                      {hasDiscountValue && (
                        <>
                          <Label htmlFor="status-discountValue">Chegirma</Label>
                          <Input
                            id="status-discountValue"
                            value={statusForm.discountValue}
                            onChange={(evt) =>
                              onFieldChange(
                                "discountValue",
                                formatNumberWithPercent(evt.target.value),
                              )
                            }
                            placeholder="100 000 yoki 5%"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status-description">Izoh</Label>
                  <div className="relative">
                    <MessageSquareText className="text-muted-foreground absolute top-3 left-3 size-4" />
                    <Textarea
                      id="status-description"
                      value={statusForm.description}
                      onChange={(evt) =>
                        onFieldChange("description", evt.target.value)
                      }
                      className="min-h-24 pl-9"
                      placeholder="Qo'shimcha qaydlar yoki mijozga oid eslatma..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* NOT: sotuv to'xtatilish sababi */}
            {activeAction.code === "NOT" && (
              <div className="grid gap-2">
                <Label htmlFor="status-not-description">Sabab*</Label>
                <div className="relative">
                  <FileText className="text-muted-foreground absolute top-3 left-3 size-4" />
                  <Textarea
                    id="status-not-description"
                    autoFocus
                    value={statusForm.description}
                    onChange={(evt) =>
                      onFieldChange("description", evt.target.value)
                    }
                    className="min-h-28 pl-9"
                    placeholder="Masalan: namunaviy kvartira, ichki rezerv yoki texnik sababi bor..."
                  />
                </div>
                {statusErrors.description && (
                  <p className="text-destructive text-xs">
                    {statusErrors.description}
                  </p>
                )}
              </div>
            )}

            {/* EMPTY: oddiy tasdiqlash */}
            {activeAction.code === "EMPTY" && (
              <div className="bg-muted/40 flex items-start gap-3 rounded-xl border p-4 text-sm">
                <span className="bg-background flex size-10 shrink-0 items-center justify-center rounded-xl border">
                  <UserRound className="text-muted-foreground size-4" />
                </span>
                <div>
                  <p className="font-medium">Uy yana aktiv sotuvga chiqadi.</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    Ushbu amal bajarilganda uy yana sotuvga chiqadi.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Bekor qilish
              </Button>
              <Button disabled={actionInProgress}>
                {pendingAction === activeAction.code && actionInProgress ? (
                  <>
                    <Spinner />
                    Saqlanmoqda...
                  </>
                ) : (
                  activeAction.submitLabel
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
