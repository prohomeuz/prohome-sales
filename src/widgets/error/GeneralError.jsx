export default function GeneralError() {
  return (
    <div className="animate-fade-in flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-96 flex-col items-center text-center">
        <img className="mb-5 size-40" src="/cancel.svg" alt="Cancel" />
        <h2 className="mb-3 font-bold">Xatolik yuz berdi</h2>
        <p className="text-muted-foreground text-xs">
          Sahifani bir necha bor yangilab ko'ring. Ushbu xolat davomiy bo'lsa,{" "}
          <strong className="underline">77 777 41 27</strong> yoki{" "}
          <strong className="underline">77 777 51 37</strong> raqamiga aloqaga
          chiqing
        </p>
      </div>
    </div>
  );
}
