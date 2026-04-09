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

async function readResponsePayload(res) {
  try {
    const text = await res.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text.trim();
    }
  } catch {
    return null;
  }
}

function getResponseMessage(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload.trim();
  if (typeof payload.message === "string") return payload.message.trim();
  if (typeof payload.error === "string") return payload.error.trim();
  if (typeof payload.detail === "string") return payload.detail.trim();
  if (typeof payload.msg === "string") return payload.msg.trim();
  if (Array.isArray(payload.errors)) {
    const firstError = payload.errors.find((item) => typeof item === "string");
    if (firstError) return firstError.trim();
  }
  return "";
}

function mapPasswordErrors(status, message) {
  const normalized = message.toLowerCase();

  if (
    [401, 403, 404].includes(status) ||
    normalized.includes("old password") ||
    normalized.includes("current password") ||
    normalized.includes("amaldagi parol")
  ) {
    return { oldPassword: "Amaldagi parol noto'g'ri." };
  }

  if (
    status === 409 ||
    normalized.includes("same password") ||
    normalized.includes("same as old") ||
    normalized.includes("different from old")
  ) {
    return { newPassword: "Yangi parol avvalgisidan farq qilishi kerak!" };
  }

  if (
    status === 400 ||
    status === 422 ||
    normalized.includes("least") ||
    normalized.includes("minimum") ||
    normalized.includes("length") ||
    normalized.includes("6")
  ) {
    return {
      newPassword: message || "Parol eng kamida 6 belgidan iborat bo'lishi kerak!",
    };
  }

  return { form: message || "Xatolik yuz berdi, qayta urunib ko'ring!" };
}

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
    case "SET_UPDATE_MODAL":
      return { ...state, updateModal: action.payload };
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
            errors: { ...state.errors, [action.payload]: null, form: null },
          }
        : state;
    default:
      return state;
  }
}

export default function Settings() {
  const { user, setUser } = useAppStore();
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
  const handleUpdateModalChange = useCallback((open) => {
    dispatch({ type: "SET_UPDATE_MODAL", payload: open });
    if (!open) {
      dispatch({ type: "SET_ERRORS", payload: INITIAL_ERRORS });
      dispatch({ type: "SET_UPDATE_LOADING", payload: false });
    }
  }, []);
  const clearFieldError = useCallback((field) => {
    dispatch({ type: "CLEAR_ERROR", payload: field });
  }, []);

  const handleSubmit = useCallback(
    async (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const result = getFormData(form);
      const oldP = (result.oldPassword ?? "").trim();
      const newP = (result.newPassword ?? "").trim();

      const nextErrors = { ...INITIAL_ERRORS };
      if (!oldP) nextErrors.oldPassword = "Amaldagi parolni kiriting!";
      if (!newP) nextErrors.newPassword = "Yangi parolni kiriting!";
      else if (newP.length < 6) {
        nextErrors.newPassword = "Parol eng kamida 6 belgidan iborat bo'lishi kerak!";
      } else if (oldP === newP) {
        nextErrors.newPassword = "Yangi parol avvalgisidan farq qilishi kerak!";
      }
      dispatch({ type: "SET_ERRORS", payload: nextErrors });
      if (nextErrors.oldPassword) {
        form.oldPassword?.focus();
        return;
      }
      if (nextErrors.newPassword) {
        form.newPassword?.focus();
        return;
      }

      dispatch({ type: "SET_UPDATE_LOADING", payload: true });
      try {
        const payload = {
          oldPassword: oldP,
          newPassword: newP,
          ...(user?.email ? { email: user.email } : {}),
          ...(user?.username ? { username: user.username } : {}),
        };
        const res = await apiRequest("/api/v1/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await readResponsePayload(res);
        if (res.ok) {
          if (data?.accessToken) {
            setUser({
              user: data.user ?? user,
              accessToken: data.accessToken,
            });
          }

          form.reset();
          dispatch({ type: "SET_ERRORS", payload: INITIAL_ERRORS });
          dispatch({ type: "SET_UPDATE_MODAL", payload: false });
          toast.success(getResponseMessage(data) || "Parolingiz o'zgartirildi!");
          return;
        }

        dispatch({
          type: "PATCH_ERRORS",
          payload: mapPasswordErrors(res.status, getResponseMessage(data)),
        });
      } catch {
        dispatch({
          type: "PATCH_ERRORS",
          payload: { form: "Tizimda nosozlik!" },
        });
      } finally {
        dispatch({ type: "SET_UPDATE_LOADING", payload: false });
      }
    },
    [setUser, user]
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

      <Dialog open={updateModal} onOpenChange={handleUpdateModalChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parolni yangilash</DialogTitle>
            <DialogDescription>
              Amaldagi va yangilamoqchi bo&apos;lgan parollaringizni kiriting.
              Yangilash tugmasi bosilganda parol yangilanadi. Keyin siz ushbu
              parol bilan tizimga kirasiz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
