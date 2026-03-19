import { CloudAlert } from "lucide-react";

export default function Offline() {
  return (
    <div className="animate-fade-in fixed inset-0 flex h-full w-full items-center justify-center bg-background text-foreground">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded border bg-card p-3 shadow-sm">
          <CloudAlert className="text-card-foreground" />
        </div>
        <h1 className="text-xl font-medium">
          Internet bilan ulanishda xatolik yuz berdi!
        </h1>
        <p className="text-muted-foreground text-sm">
          Qurilmangiz internetga ulanganiga ishonch hosil qiling.
        </p>
      </div>
    </div>
  );
}
