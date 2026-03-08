import { Link } from "react-router-dom";
import { buttonVariants } from "@/shared/ui/button";

export default function Bug() {
  return (
    <div className="animate-fade-in flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-96 flex-col items-center text-center">
        <img className="mb-5 size-40" src="/cancel.svg" alt="Cancel" />
        <h2 className="mb-3 font-bold">Kutilmagan xatolik!</h2>
        <p className="text-muted-foreground mb-2 text-xs">
          <strong className="underline">77 777 41 27</strong> yoki{" "}
          <strong className="underline">77 777 51 37</strong> raqamiga aloqaga
          chiqing.
        </p>
        <Link className={buttonVariants({ variant: "link" })} to={"/"}>
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
