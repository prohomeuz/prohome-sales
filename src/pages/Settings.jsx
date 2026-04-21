import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ArrowLeft, Check, Eye, EyeOff, GlobeLockIcon, KeyRound, Moon, Palette, RefreshCcw, Sun } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { apiRequest } from "@/shared/lib/api";
import { getFormData } from "@/shared/lib/utils";
import { useAppStore } from "@/entities/session/model";

const INITIAL_ERRORS = { oldPassword: null, newPassword: null, confirmPassword: null, form: null };

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

const BULLET = "•";

function PasswordInput({ id, name, placeholder, autoComplete, onChange }) {
  const [real, setReal] = useState("");
  const [peekLast, setPeekLast] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const peekTimer = useRef(null);

  useEffect(() => () => clearTimeout(peekTimer.current), []);

  // Ko'rsatiladigan qiymat: oxirgi belgi peek paytida ko'rinadi, qolganlari •
  const displayValue = forceShow
    ? real
    : peekLast && real.length > 0
      ? BULLET.repeat(real.length - 1) + real.slice(-1)
      : BULLET.repeat(real.length);

  const handleChange = useCallback(
    (e) => {
      const newDisplay = e.target.value;
      const diff = newDisplay.length - real.length;
      const cursor = e.target.selectionEnd ?? newDisplay.length;
      let newReal = real;

      if (forceShow) {
        newReal = newDisplay;
      } else if (diff > 0) {
        // Belgi qo'shildi
        const insertAt = cursor - diff;
        const inserted = newDisplay.slice(insertAt, cursor).replace(new RegExp(BULLET, "g"), "");
        newReal =
          real.slice(0, insertAt) +
          (inserted || newDisplay.slice(insertAt, cursor)) +
          real.slice(insertAt);
        clearTimeout(peekTimer.current);
        setPeekLast(true);
        peekTimer.current = setTimeout(() => setPeekLast(false), 600);
      } else if (diff < 0) {
        // Belgi o'chirildi
        newReal = real.slice(0, cursor) + real.slice(cursor - diff);
        setPeekLast(false);
      }

      setReal(newReal);
      onChange?.();
    },
    [real, forceShow, onChange],
  );

  return (
    <div className="relative">
      {/* Ko'rinadigan input — formga kirmaydi (name yo'q) */}
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="pr-10"
      />
      {/* Haqiqiy qiymat — faqat form submit uchun */}
      <input type="hidden" name={name} value={real} readOnly />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => { setForceShow((v) => !v); setPeekLast(false); }}
        className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        aria-label={forceShow ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        {forceShow ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, setUser } = useAppStore();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const { dark, updateModal, updateLoading, errors } = state;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleChange = useCallback(() => dispatch({ type: "TOGGLE_DARK" }), []);
  const handleUpdateModal = useCallback(() => dispatch({ type: "TOGGLE_UPDATE_MODAL" }), []);
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
      const confirmP = (result.confirmPassword ?? "").trim();

      const nextErrors = { ...INITIAL_ERRORS };
      if (!oldP) nextErrors.oldPassword = "Amaldagi parolni kiriting!";
      if (!newP) nextErrors.newPassword = "Yangi parolni kiriting!";
      else if (newP.length < 6) nextErrors.newPassword = "Parol eng kamida 6 belgidan iborat bo'lishi kerak!";
      else if (oldP === newP) nextErrors.newPassword = "Yangi parol avvalgisidan farq qilishi kerak!";
      if (!confirmP) nextErrors.confirmPassword = "Parolni tasdiqlang!";
      else if (newP && confirmP !== newP) nextErrors.confirmPassword = "Parollar mos kelmaydi!";

      dispatch({ type: "SET_ERRORS", payload: nextErrors });
      if (nextErrors.oldPassword) { form.oldPassword?.focus(); return; }
      if (nextErrors.newPassword) { form.newPassword?.focus(); return; }
      if (nextErrors.confirmPassword) { form.confirmPassword?.focus(); return; }

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
            setUser({ user: data.user ?? user, accessToken: data.accessToken });
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
        dispatch({ type: "PATCH_ERRORS", payload: { form: "Tizimda nosozlik!" } });
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
        <div className="mb-10 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 [&_svg]:size-5!"
            onClick={() => navigate(-1)}
            aria-label="Orqaga"
          >
            <ArrowLeft />
          </Button>
          <h2 className="text-3xl font-bold">Sozlamalar</h2>
        </div>

        <div className="h-full max-h-96 overflow-y-auto py-3 pr-2">
          <div className="relative mb-8 rounded border px-3 py-6">
            <h3 className="bg-background text-muted-foreground absolute left-5 top-0 flex -translate-y-2/4 gap-2 px-2 font-bold">
              <Palette /> Mavzu
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => dark && handleChange()}
                className={`relative flex w-36 flex-col overflow-hidden rounded-lg border-2 transition-all ${
                  !dark ? "border-primary" : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="flex h-16 items-start gap-1 bg-[#f1f5f9] p-2">
                  <div className="flex h-full w-8 flex-col gap-1 rounded bg-white p-1">
                    <div className="h-1 w-full rounded-full bg-[#94a3b8]" />
                    <div className="h-1 w-3/4 rounded-full bg-[#94a3b8]" />
                    <div className="h-1 w-1/2 rounded-full bg-[#94a3b8]" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="h-5 rounded bg-white" />
                    <div className="h-5 rounded bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1.5">
                  <span className="flex items-center gap-1 text-xs font-medium text-[#0f172a]">
                    <Sun size={12} /> Yorug&apos;
                  </span>
                  {!dark && <Check size={12} className="text-primary" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => dark || handleChange()}
                className={`relative flex w-36 flex-col overflow-hidden rounded-lg border-2 transition-all ${
                  dark ? "border-primary" : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="flex h-16 items-start gap-1 bg-[#0f172a] p-2">
                  <div className="flex h-full w-8 flex-col gap-1 rounded bg-[#1e293b] p-1">
                    <div className="h-1 w-full rounded-full bg-[#475569]" />
                    <div className="h-1 w-3/4 rounded-full bg-[#475569]" />
                    <div className="h-1 w-1/2 rounded-full bg-[#475569]" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="h-5 rounded bg-[#1e293b]" />
                    <div className="h-5 rounded bg-[#1e293b]" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#1e293b] px-2 py-1.5">
                  <span className="flex items-center gap-1 text-xs font-medium text-[#f1f5f9]">
                    <Moon size={12} /> Qorong&apos;u
                  </span>
                  {dark && <Check size={12} className="text-primary" />}
                </div>
              </button>
            </div>
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
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Amaldagi parol */}
            <div className="grid gap-2">
              <Label htmlFor="oldPassword">Amaldagi parol*</Label>
              <PasswordInput
                id="oldPassword"
                name="oldPassword"
                placeholder="********"
                autoComplete="current-password"
                onChange={() => clearFieldError("oldPassword")}
              />
              {errors.oldPassword && (
                <p className="text-destructive text-xs">{errors.oldPassword}</p>
              )}
            </div>

            {/* Yangi parol */}
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Yangi parol*</Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                placeholder="Kamida 6 ta belgi"
                autoComplete="new-password"
                onChange={() => clearFieldError("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-destructive text-xs">{errors.newPassword}</p>
              )}
            </div>

            {/* Parolni tasdiqlash */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Parolni tasdiqlang*</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Yangi parolni qayta kiriting"
                autoComplete="new-password"
                onChange={() => clearFieldError("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-xs">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.form && (
              <p className="text-destructive text-xs">{errors.form}</p>
            )}

            <Button disabled={updateLoading}>
              {updateLoading ? (
                <><RefreshCcw className="animate-spin" /> Yangilanmoqda...</>
              ) : (
                <><RefreshCcw /> Yangilash</>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
