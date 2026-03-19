/**
 * @file Xona holati harakat tugmalari paneli.
 * @module widgets/calculator/ui/StatusActionCards
 *
 * SOLD / RESERVED / NOT / EMPTY tugmalari va qulf ogohlantirishini ko'rsatadi.
 * Faqat presentational — state va handlerlar props orqali keladi.
 */

import { cn } from "@/shared/lib/utils";
import { ArrowUpRight, LoaderCircle, Lock } from "lucide-react";

/**
 * @param {{
 *   availableActions: Array<object>,
 *   actionLocked: boolean,
 *   actionInProgress: boolean,
 *   pendingAction: string | null,
 *   onAction: (action: object) => void,
 * }} props
 */
export default function StatusActionCards({
  availableActions,
  actionLocked,
  actionInProgress,
  pendingAction,
  onAction,
}) {
  return (
    <div className="bg-muted/20 rounded-xl border p-3">
      {actionLocked && (
        <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950">
          <span className="bg-background flex size-8 shrink-0 items-center justify-center rounded-md">
            <Lock className="size-4 text-amber-700" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Ushbu uy ustida amal bajara olmaysiz
            </p>
            <p className="mt-0.5 text-xs leading-5 text-amber-800">
              Faqat ushbu bron yoki savdo amalini yaratgan foydalanuvchi
              statusni o'zgartira oladi.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {availableActions.map((action) => {
          const {
            code,
            title,
            description,
            icon: Icon,
            cardTone,
            accentTone,
            iconTone,
          } = action;

          return (
            <button
              type="button"
              key={code}
              disabled={actionLocked || actionInProgress}
              onClick={() => onAction(action)}
              className={cn(
                "group bg-background relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 overflow-hidden rounded-xl border px-4 py-4 text-left transition-colors duration-200",
                "hover:bg-accent/30 disabled:pointer-events-none disabled:opacity-60",
                cardTone,
              )}
            >
              <span
                className={cn(
                  "absolute top-3 bottom-3 left-0 w-1 rounded-full",
                  accentTone,
                )}
              />
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-[1.03]",
                  iconTone,
                )}
              >
                <Icon className="size-4.5" />
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-foreground text-base font-semibold tracking-[-0.01em]">
                  {title}
                </span>
                <span className="text-muted-foreground mt-1 text-sm leading-6">
                  {description}
                </span>
              </span>

              <span className="text-muted-foreground group-hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-md transition-colors">
                {pendingAction === code && actionInProgress ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
