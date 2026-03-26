import { cn } from "@/shared/lib/utils";
import { CalendarDays, CreditCard, FileText, MapPin } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { formatPassportNumberDisplay } from "../lib/status-form-validation";

/**
 * @param {{
 *   statusForm: object,
 *   statusErrors: object,
 *   onFieldChange: (field: string, value: string) => void,
 * }} props
 */
export default function SoldContractFields({
  statusForm,
  statusErrors,
  onFieldChange,
}) {
  function getFieldClass(field, className = "") {
    return cn(
      className,
      statusErrors[field]
        ? "border-destructive/70 ring-1 ring-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/20"
        : "",
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="status-middleName">Otasining ismi</Label>
          <Input
            id="status-middleName"
            value={statusForm.middleName}
            onChange={(evt) => onFieldChange("middleName", evt.target.value)}
            aria-invalid={Boolean(statusErrors.middleName)}
            className={getFieldClass("middleName")}
            placeholder="Baxromjon O'g'li"
          />
          {statusErrors.middleName && (
            <p className="text-destructive text-xs">{statusErrors.middleName}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status-birthDate">Tug'ilgan sana*</Label>
          <div className="relative">
            <CalendarDays className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="status-birthDate"
              type="date"
              value={statusForm.birthDate}
              onChange={(evt) => onFieldChange("birthDate", evt.target.value)}
              aria-invalid={Boolean(statusErrors.birthDate)}
              className={getFieldClass("birthDate", "pl-9")}
            />
          </div>
          {statusErrors.birthDate && (
            <p className="text-destructive text-xs">{statusErrors.birthDate}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="status-passportNumber">Passport raqami*</Label>
          <div className="relative">
            <CreditCard className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="status-passportNumber"
              value={statusForm.passportNumber}
              onChange={(evt) =>
                onFieldChange(
                  "passportNumber",
                  formatPassportNumberDisplay(evt.target.value),
                )
              }
              aria-invalid={Boolean(statusErrors.passportNumber)}
              className={getFieldClass("passportNumber", "pl-9 uppercase")}
              placeholder="AC 2521090"
            />
          </div>
          {statusErrors.passportNumber && (
            <p className="text-destructive text-xs">
              {statusErrors.passportNumber}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status-passportIssuedDate">Berilgan sana*</Label>
          <div className="relative">
            <CalendarDays className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="status-passportIssuedDate"
              type="date"
              value={statusForm.passportIssuedDate}
              onChange={(evt) =>
                onFieldChange("passportIssuedDate", evt.target.value)
              }
              aria-invalid={Boolean(statusErrors.passportIssuedDate)}
              className={getFieldClass("passportIssuedDate", "pl-9")}
            />
          </div>
          {statusErrors.passportIssuedDate && (
            <p className="text-destructive text-xs">
              {statusErrors.passportIssuedDate}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status-passportIssuedBy">Kim tomonidan berilgan*</Label>
        <div className="relative">
          <FileText className="text-muted-foreground absolute top-3 left-3 size-4" />
          <Textarea
            id="status-passportIssuedBy"
            value={statusForm.passportIssuedBy}
            onChange={(evt) =>
              onFieldChange("passportIssuedBy", evt.target.value.toUpperCase())
            }
            aria-invalid={Boolean(statusErrors.passportIssuedBy)}
            className={getFieldClass("passportIssuedBy", "min-h-20 pl-9")}
            placeholder="FARG'ONA VILOYATI QO'SHTEPA TUMANI IIB"
          />
        </div>
        {statusErrors.passportIssuedBy && (
          <p className="text-destructive text-xs">
            {statusErrors.passportIssuedBy}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status-address">Manzil*</Label>
        <div className="relative">
          <MapPin className="text-muted-foreground absolute top-3 left-3 size-4" />
          <Textarea
            id="status-address"
            value={statusForm.address}
            onChange={(evt) => onFieldChange("address", evt.target.value)}
            aria-invalid={Boolean(statusErrors.address)}
            className={getFieldClass("address", "min-h-24 pl-9")}
            placeholder="Farg'ona viloyati, Qo'shtepa MFY, Latif ko'chasi, uy:187"
          />
        </div>
        {statusErrors.address && (
          <p className="text-destructive text-xs">{statusErrors.address}</p>
        )}
      </div>
    </>
  );
}
