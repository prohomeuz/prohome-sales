import { Label } from "@/shared/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { apiRequest } from "@/shared/lib/api";
import { getFormData } from "@/shared/lib/utils";
import { useAppStore } from "@/entities/session/model";

const SUCCESS_STATUS = 201;
const BAD_REQUEST_STATUSES = new Set([400, 404]);

const INITIAL_ERRORS = { email: null, password: null, form: null };
const INITIAL_STATE = {
  loading: false,
  errors: INITIAL_ERRORS,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERRORS":
      return {
        ...state,
        errors:
          typeof action.payload === "function"
            ? action.payload(state.errors)
            : action.payload,
      };
    case "PATCH_ERRORS":
      return {
        ...state,
        errors: { ...state.errors, ...action.payload },
      };
    case "CLEAR_ERROR":
      return state.errors[action.payload] === null
        ? state
        : {
            ...state,
            errors: { ...state.errors, [action.payload]: null },
          };
    default:
      return state;
  }
}

const BULLET = "•";

function PasswordInput({ id, name, placeholder, autoComplete, onChange, ariaInvalid, ariaDescribedby }) {
  const [real, setReal] = useState("");
  const [peekLast, setPeekLast] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const peekTimer = useRef(null);

  useEffect(() => () => clearTimeout(peekTimer.current), []);

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
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="pr-10"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
      />
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

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-destructive mt-1 text-xs">
      {children}
    </p>
  );
}

export default function Login() {
  const { user, setUser } = useAppStore();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { loading, errors } = state;
  const abortRef = useRef(null);

  const clearError = useCallback((field) => {
    dispatch({ type: "CLEAR_ERROR", payload: field });
  }, []);

  const setFieldErrors = useCallback((next) => {
    dispatch({ type: "PATCH_ERRORS", payload: next });
  }, []);

  const login = useCallback(
    async (userData) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERRORS", payload: INITIAL_ERRORS });

      try {
        const res = await apiRequest("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
          signal,
        });

        if (res.status === SUCCESS_STATUS) {
          const data = await res.json();
          setUser(data);
          toast.success("Tizimga xush kelibsiz!");
          navigate("/dashboard", { replace: true });
          return;
        }

        if (BAD_REQUEST_STATUSES.has(res.status)) {
          setFieldErrors({
            password: "Kiritilgan email yoki parol nato'g'ri",
            form: null,
          });
          return;
        }

        setFieldErrors({ form: "Xatolik yuz berdi, qayta urunib ko'ring!" });
      } catch (err) {
        if (err?.name === "AbortError") return;
        setFieldErrors({
          form: "Tizimda nosozlik, adminga aloqaga chiqing!",
        });
      } finally {
        abortRef.current = null;
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [setUser, setFieldErrors],
  );

  const handleSubmit = useCallback(
    (evt) => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const { email, password } = getFormData(form);

      const trimmedEmail = email?.trim() ?? "";
      const trimmedPassword = password?.trim() ?? "";

      if (!trimmedEmail) {
        setFieldErrors({ email: "Email kiriting!" });
        form.email?.focus();
        return;
      }
      if (!trimmedPassword) {
        setFieldErrors({ password: "Parol kiriting!" });
        form.password?.focus();
        return;
      }

      login({ email: trimmedEmail, password: trimmedPassword });
    },
    [login, setFieldErrors],
  );

  const handleEmailChange = useCallback(
    () => clearError("email"),
    [clearError],
  );
  const handlePasswordChange = useCallback(
    () => clearError("password"),
    [clearError],
  );

  if (user !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="grid h-full min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="bg-accent relative hidden h-full md:flex md:items-center md:justify-center">
        <img
          className="size-96"
          src="/login.svg"
          alt="Kirish"
          fetchPriority="high"
        />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-background flex h-full items-center justify-center p-5"
        noValidate
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Prohome Boshqaruv paneli</CardTitle>
            <CardDescription>
              Prohome loyihasining boshqaruv paneliga xush kelibsiz!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.form && (
              <div
                role="alert"
                className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
              >
                {errors.form}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="m@prohome.uz"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={handleEmailChange}
              />
              <FieldError id="email-error">{errors.email}</FieldError>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Parol</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="********"
                autoComplete="current-password"
                ariaInvalid={!!errors.password}
                ariaDescribedby={errors.password ? "password-error" : undefined}
                onChange={handlePasswordChange}
              />
              <FieldError id="password-error">{errors.password}</FieldError>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? (
                <>
                  <Spinner />
                  Kirilmoqda...
                </>
              ) : (
                "Kirish"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </section>
  );
}
