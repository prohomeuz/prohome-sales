import { useMemo } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useAppStore } from "@/entities/session/model";
import Bug from "@/widgets/error/Bug";
import { PageFallback } from "@/shared/ui/suspense-fallback";
import MainLayout from "@/widgets/layout/main-layout";

function lazyRoute(importer, getProps) {
  return async () => {
    const module = await importer();
    const Component = module.default;
    if (!getProps) {
      return { Component };
    }

    return {
      Component() {
        return <Component {...getProps()} />;
      },
    };
  };
}

function indexRoute(importer) {
  return { index: true, lazy: lazyRoute(importer) };
}

function pageRoute(path, importer) {
  return { path, lazy: lazyRoute(importer) };
}

function getRoleRoutes(role) {
  switch (role) {
    case "SUPERADMIN":
      return [
        indexRoute(() => import("@/pages/Home")),
        pageRoute("admin", () => import("@/pages/Admin")),
        pageRoute("rop", () => import("@/pages/Rop")),
        pageRoute("salesmanager", () => import("@/pages/SalesManager")),
        pageRoute("settings", () => import("@/pages/Settings")),
        pageRoute("company", () => import("@/pages/Company")),
        pageRoute("add/company", () => import("@/pages/AddCompany")),
        pageRoute("company/:id", () => import("@/pages/CompanyDetails")),
        pageRoute("tjm", () => import("@/pages/Tjm")),
        pageRoute("dashboard", () => import("@/pages/Dashboard")),
        pageRoute("contracts", () => import("@/pages/Contracts")),
        pageRoute("crm", () => import("@/pages/Crm")),
      ];
    case "ADMIN":
      return [
        indexRoute(() => import("@/pages/Home")),
        pageRoute("rop", () => import("@/pages/Rop")),
        pageRoute("salesmanager", () => import("@/pages/SalesManager")),
        pageRoute("settings", () => import("@/pages/Settings")),
        pageRoute("company", () => import("@/pages/Company")),
        pageRoute("add/company", () => import("@/pages/AddCompany")),
        pageRoute("company/:id", () => import("@/pages/CompanyDetails")),
        pageRoute("tjm", () => import("@/pages/Tjm")),
        pageRoute("dashboard", () => import("@/pages/Dashboard")),
        pageRoute("contracts", () => import("@/pages/Contracts")),
        pageRoute("crm", () => import("@/pages/Crm")),
      ];
    case "ROP":
      return [
        indexRoute(() => import("@/pages/Home")),
        pageRoute("salesmanager", () => import("@/pages/SalesManager")),
        pageRoute("settings", () => import("@/pages/Settings")),
        pageRoute("tjm", () => import("@/pages/Tjm")),
        pageRoute("dashboard", () => import("@/pages/Dashboard")),
        pageRoute("contracts", () => import("@/pages/Contracts")),
        pageRoute("crm", () => import("@/pages/Crm")),
      ];
    case "SALESMANAGER":
      return [
        indexRoute(() => import("@/pages/Home")),
        pageRoute("settings", () => import("@/pages/Settings")),
        pageRoute("tjm", () => import("@/pages/Tjm")),
        pageRoute("contracts", () => import("@/pages/Contracts")),
        pageRoute("crm", () => import("@/pages/Crm")),
      ];
    default:
      return [];
  }
}

export default function App() {
  const { user } = useAppStore();

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: user
            ? <MainLayout />
            : <Navigate to="/login" replace />,
          children: getRoleRoutes(user?.role),
          errorElement: <Bug />,
        },
        {
          path: "/tjm/:id",
          lazy: lazyRoute(() => import("@/pages/TjmDetails")),
        },
        {
          path: "/login",
          lazy: lazyRoute(() => import("@/pages/Login")),
        },
        {
          path: "*",
          lazy: lazyRoute(() => import("@/pages/NotFound"), () => ({ user })),
        },
      ]),
    [user],
  );

  return <RouterProvider router={router} fallbackElement={<PageFallback />} />;
}
