import { Clock3, Sparkles } from "lucide-react";

export default function Crm() {
  return (
    <section className="animate-fade-in flex h-full items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl rounded-xl border bg-background px-6 py-10 text-center shadow-sm sm:px-10 sm:py-14">
        <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-full">
          <Clock3 className="size-7" />
        </div>

        <div className="mt-6 space-y-3">
          <div className="text-primary inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" />
            Hozir jarayonda
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            CRM bo&apos;limi vaqtincha ishlab chiqilmoqda
          </h1>

          <p className="text-muted-foreground mx-auto max-w-xl text-sm leading-6 sm:text-base">
            Bu sahifa tez orada yangi, barqaror va qulay ish jarayoni bilan
            qo&apos;shiladi.
          </p>
        </div>
      </div>
    </section>
  );
}
