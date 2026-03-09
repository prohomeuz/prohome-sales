import { Label } from "@radix-ui/react-label";
import { Eye, EyeClosed } from "lucide-react";
import { useCallback, useReducer, useRef } from "react";
import { Navigate } from "react-router-dom";
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
import { useBoolean } from "@/shared/hooks/use-boolean";
import { getFormData } from "@/shared/lib/utils";
import { useAppStore } from "@/entities/session/model";

const LOGIN_API = `${import.meta.env.VITE_BASE_URL}/api/v1/auth/login`;
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
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { loading, errors } = state;
  const [passwordShow, { toggle }] = useBoolean();
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
        const res = await fetch(LOGIN_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
          signal,
        });

        if (res.status === SUCCESS_STATUS) {
          const data = await res.json();
          setUser(data);
          toast.success("Tizimga xush kelibsiz!");
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
    return <Navigate to="/" replace />;
  }

  return (
    <section className="grid h-full min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="bg-accent relative hidden h-full md:flex md:items-center md:justify-center">
        <img
          className="size-96"
          src="/login.svg"
          alt="Login"
          fetchPriority="high"
        />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex h-full items-center justify-center p-5"
        noValidate
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Prohome Admin Panel</CardTitle>
            <CardDescription>
              Prohome loyihasining admin paneliga xush kelibsiz!
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
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={passwordShow ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="********"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  onChange={handlePasswordChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0"
                  onClick={toggle}
                  aria-label={
                    passwordShow ? "Parolni yashirish" : "Parolni ko'rsatish"
                  }
                >
                  {passwordShow ? <Eye /> : <EyeClosed />}
                </Button>
              </div>
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
