import { cn } from "@/shared/lib/utils";
import { CalendarDays, CreditCard, FileText, MapPin } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { formatPassportNumberDisplay } from "../lib/status-form-validation";

const DATE_MIN = "1900-01-01";

function sanitizeNameInput(raw) {
  return String(raw ?? "")
    .replace(/[^\p{L}\p{M}'`\u2019\-\s]/gu, "")
    .replace(/\s{2,}/g, " ");
}

function getTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value) {
  const source = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source)) return null;

  const [year, month, day] = source.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1) return null;

  const isLeapYear =
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const monthDays = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDay = monthDays[month - 1];

  if (!maxDay || day > maxDay) {
    return null;
  }

  return { year, month, day };
}

function normalizeDateInput(nextValue, prevValue, options = {}) {
  const bounds = options.bounds ?? {};
  const allowEmpty = options.allowEmpty ?? true;
  const enforceBounds = options.enforceBounds ?? true;
  const next = String(nextValue ?? "").trim();
  if (!next) {
    return allowEmpty ? "" : String(prevValue ?? "");
  }

  if (!parseIsoDate(next)) {
    return String(prevValue ?? "");
  }

  if (!enforceBounds) {
    return next;
  }

  const minDate = String(bounds.minDate ?? "").trim();
  const maxDate = String(bounds.maxDate ?? "").trim();

  if (minDate && next < minDate) {
    return String(prevValue ?? "");
  }

  if (maxDate && next > maxDate) {
    return String(prevValue ?? "");
  }

  return next;
}

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
  const todayIso = getTodayIso();
  const birthDateValue = normalizeDateInput(statusForm.birthDate, "", {
    enforceBounds: false,
  });
  const passportIssuedDateValue = normalizeDateInput(
    statusForm.passportIssuedDate,
    "",
    {
      enforceBounds: false,
    },
  );

  function handleDateFieldChange(
    field,
    nextValue,
    prevValue,
    minDate,
    maxDate,
    mode = "change",
  ) {
    const normalized = normalizeDateInput(nextValue, prevValue, {
      allowEmpty: mode === "blur",
      enforceBounds: mode === "blur",
      bounds: {
        minDate,
        maxDate,
      },
    });

    if (normalized !== prevValue) {
      onFieldChange(field, normalized);
    }
  }

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
            onChange={(evt) =>
              onFieldChange("middleName", sanitizeNameInput(evt.target.value))
            }
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
              value={birthDateValue}
              onChange={(evt) =>
                handleDateFieldChange(
                  "birthDate",
                  evt.currentTarget.value,
                  birthDateValue,
                  DATE_MIN,
                  todayIso,
                )
              }
              onBlur={(evt) =>
                handleDateFieldChange(
                  "birthDate",
                  evt.currentTarget.value,
                  birthDateValue,
                  DATE_MIN,
                  todayIso,
                  "blur",
                )
              }
              min={DATE_MIN}
              max={todayIso}
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
              value={passportIssuedDateValue}
              onChange={(evt) =>
                handleDateFieldChange(
                  "passportIssuedDate",
                  evt.currentTarget.value,
                  passportIssuedDateValue,
                  DATE_MIN,
                  todayIso,
                )
              }
              onBlur={(evt) =>
                handleDateFieldChange(
                  "passportIssuedDate",
                  evt.currentTarget.value,
                  passportIssuedDateValue,
                  DATE_MIN,
                  todayIso,
                  "blur",
                )
              }
              min={DATE_MIN}
              max={todayIso}
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
