import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useAppStore } from "@/entities/session/model";

import Bug from "@/widgets/error/Bug";
import MainLayout from "@/widgets/layout/main-layout";
import AddCompany from "@/pages/AddCompany";
import Admin from "@/pages/Admin";
import Company from "@/pages/Company";
import CompanyDetails from "@/pages/CompanyDetails";
import Contracts from "@/pages/Contracts";
import Crm from "@/pages/Crm";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Rop from "@/pages/Rop";
import SalesManager from "@/pages/SalesManager";
import Settings from "@/pages/Settings";
import Tjm from "@/pages/Tjm";
import TjmDetails from "@/pages/TjmDetails";

const roles = {
  ADMIN: [
    {
      path: "/",
      index: true,
      element: <Home />,
    },
    {
      path: "/rop",
      element: <Rop />,
    },
    {
      path: "/salesmanager",
      element: <SalesManager />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
    {
      path: "/company",
      element: <Company />,
    },
    {
      path: "/add/company",
      element: <AddCompany />,
    },
    {
      path: "/company/:id",
      element: <CompanyDetails />,
    },
    {
      path: "/tjm",
      element: <Tjm />,
    },

    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/contracts",
      element: <Contracts />,
    },
    {
      path: "/crm",
      element: <Crm />,
    },
  ],
  SUPERADMIN: [
    {
      path: "/",
      index: true,
      element: <Home />,
    },
    {
      path: "/admin",
      element: <Admin />,
    },
    {
      path: "/rop",
      element: <Rop />,
    },
    {
      path: "/salesmanager",
      element: <SalesManager />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
    {
      path: "/company",
      element: <Company />,
    },
    {
      path: "/add/company",
      element: <AddCompany />,
    },
    {
      path: "/company/:id",
      element: <CompanyDetails />,
    },
    {
      path: "/tjm",
      element: <Tjm />,
    },

    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/contracts",
      element: <Contracts />,
    },
    {
      path: "/crm",
      element: <Crm />,
    },
  ],
  ROP: [
    {
      path: "/",
      index: true,
      element: <Home />,
    },

    {
      path: "/salesmanager",
      element: <SalesManager />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
    {
      path: "/tjm",
      element: <Tjm />,
    },

    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/contracts",
      element: <Contracts />,
    },
    {
      path: "/crm",
      element: <Crm />,
    },
  ],
  SALESMANAGER: [
    {
      path: "/",
      index: true,
      element: <Home />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
    {
      path: "/tjm",
      element: <Tjm />,
    },

    {
      path: "/contracts",
      element: <Contracts />,
    },
    {
      path: "/crm",
      element: <Crm />,
    },
  ],
};

export default function App() {
  const { user } = useAppStore();

  const routes = createBrowserRouter([
    {
      path: "/",
      element: user ? <MainLayout /> : <Navigate to="/login" />,
      children: user ? roles[user.role] : [],
      errorElement: <Bug />,
    },
    {
      path: "/tjm/:id",
      element: <TjmDetails />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "*",
      element: <NotFound user={user} />,
    },
  ]);

  return <RouterProvider router={routes} />;
}
