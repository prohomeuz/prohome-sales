import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { GlobeLockIcon, KeyRound, Palette, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useReducer } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { apiRequest } from "@/shared/lib/api";
import { getFormData } from "@/shared/lib/utils";
import { useAppStore } from "@/entities/session/model";

const INITIAL_ERRORS = { oldPassword: null, newPassword: null, form: null };

function createInitialState() {
  return {
    dark: localStorage.getItem("theme") === "dark",
    updateModal: false,
    updateLoading: false,
    errors: INITIAL_ERRORS,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_DARK":
      return { ...state, dark: !state.dark };
    case "TOGGLE_UPDATE_MODAL":
      return { ...state, updateModal: !state.updateModal };
    case "SET_UPDATE_LOADING":
      return { ...state, updateLoading: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "PATCH_ERRORS":
      return { ...state, errors: { ...state.errors, ...action.payload } };
    case "CLEAR_ERROR":
      return state.errors[action.payload]
        ? {
            ...state,
            errors: { ...state.errors, [action.payload]: null },
          }
        : state;
    default:
      return state;
  }
}

export default function Settings() {
  const { user } = useAppStore();
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const { dark, updateModal, updateLoading, errors } = state;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleChange = useCallback(
    () => dispatch({ type: "TOGGLE_DARK" }),
    [],
  );
  const handleUpdateModal = useCallback(
    () => dispatch({ type: "TOGGLE_UPDATE_MODAL" }),
    [],
  );
  const clearFieldError = useCallback((field) => {
    dispatch({ type: "CLEAR_ERROR", payload: field });
  }, []);

  const handleSubmit = useCallback(
    async (evt) => {
      evt.preventDefault();
      const result = getFormData(evt.currentTarget);
      const oldP = (result.oldPassword ?? "").trim();
      const newP = (result.newPassword ?? "").trim();

      const nextErrors = { ...INITIAL_ERRORS };
      if (!oldP) nextErrors.oldPassword = "Amaldagi parolni kiriting!";
      if (!newP) nextErrors.newPassword = "Yangi parolni kiriting!";
      dispatch({ type: "SET_ERRORS", payload: nextErrors });
      if (nextErrors.oldPassword) {
        evt.currentTarget.oldPassword?.focus();
        return;
      }
      if (nextErrors.newPassword) {
        evt.currentTarget.newPassword?.focus();
        return;
      }

      dispatch({ type: "SET_UPDATE_LOADING", payload: true });
      try {
        const res = await apiRequest("/api/v1/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldPassword: oldP,
            newPassword: newP,
            email: user?.email,
          }),
        });
        if (res.status === 201) {
          handleUpdateModal();
          toast.success("Parolingiz o'zgartirildi!");
          dispatch({ type: "SET_ERRORS", payload: INITIAL_ERRORS });
        } else if (res.status === 400) {
          dispatch({
            type: "PATCH_ERRORS",
            payload: {
              newPassword: "Parol eng kamida 6 belgidan iborat bo'lishi kerak!",
            },
          });
        } else if (res.status === 404) {
          dispatch({
            type: "PATCH_ERRORS",
            payload: { oldPassword: "Amaldagi parol noto'g'ri." },
          });
        } else {
          dispatch({
            type: "PATCH_ERRORS",
            payload: { form: "Xatolik yuz berdi, qayta urunib ko'ring!" },
          });
        }
      } catch {
        dispatch({
          type: "PATCH_ERRORS",
          payload: { form: "Tizimda nosozlik!" },
        });
      } finally {
        dispatch({ type: "SET_UPDATE_LOADING", payload: false });
      }
    },
    [user?.email, handleUpdateModal]
  );

  if (!user) return <Navigate to="/login" />;

  return (
    <>
      <section className="animate-fade-in h-full p-5">
        <h2 className="mb-10 text-3xl font-bold">Sozlamalar</h2>

        <div className="h-full max-h-96 overflow-y-auto py-3 pr-2">
          <div className="relative mb-8 rounded border px-3 py-6">
            <h3 className="bg-background text-muted-foreground absolute left-5 top-0 flex -translate-y-2/4 gap-2 px-2 font-bold">
              <Palette /> Mavzu
            </h3>
            Tez kunda..
          </div>

          <div className="relative rounded border px-3 py-6">
            <h3 className="bg-background text-muted-foreground absolute left-5 top-0 flex -translate-y-2/4 gap-2 px-2 font-bold">
              <GlobeLockIcon /> Xavfsizlik
            </h3>
            <Button onClick={handleUpdateModal} variant="secondary">
              <KeyRound /> Parolni yangilash
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={updateModal} onOpenChange={handleUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parolni yangilash</DialogTitle>
            <DialogDescription>
              Amaldagi va yangilamoqchi bo&apos;lgan parollaringizni kiriting.
              Yangilash tugmasi bosilganda parol yangilanadi. Keyin siz ushbu
              parol bilan tizimga kirasiz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="oldPassword">Amaldagi parol*</Label>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                placeholder="********"
                onChange={() => clearFieldError("oldPassword")}
              />
              {errors.oldPassword && (
                <p className="text-destructive text-xs">{errors.oldPassword}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Yangi parol*</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="********"
                onChange={() => clearFieldError("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-destructive text-xs">{errors.newPassword}</p>
              )}
            </div>
            {errors.form && (
              <p className="text-destructive text-xs">{errors.form}</p>
            )}
            <Button disabled={updateLoading}>
              {updateLoading ? (
                <>
                  <RefreshCcw className="animate-spin" /> Yangilanmoqda...
                </>
              ) : (
                <>
                  <RefreshCcw /> Yangilash
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
