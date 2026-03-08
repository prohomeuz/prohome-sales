import { CloudAlert } from "lucide-react";

export default function Offline() {
  return (
    <div className="fixed inset-0 animate-fade-in flex items-center justify-center w-full h-full bg-slate-800 text-white">
      <div className="w-full max-w-lg text-center flex flex-col items-center">
        <div className="p-3 rounded shadow bg-white w-12 h-12 flex items-center justify-center mb-5">
          <CloudAlert className="text-slate-800" />
        </div>
        <h1 className="font-medium text-xl">
          Internet bilan ulanishda xatolik yuz berdi!
        </h1>
        <p className="text-sm">
          Qurilmangiz internetga ulanganiga ishonch hosil qiling.
        </p>
      </div>
    </div>
  );
}
