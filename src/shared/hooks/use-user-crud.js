/**
 * DATA + thin BUSINESS: CRUD for admin / rop / sales-manager.
 * Single hook to avoid duplication (YAGNI/KISS).
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/shared/lib/api";

const CONFIG = {
  admin: {
    createPath: "/api/v1/user/admin",
    listPath: "/api/v1/user/all/admin",
    removePath: (id) => `/api/v1/user/remove-admin/${id}`,
    conflictMsg: "Bu email bilan admin ro'yhatdan o'tgan!",
    removeSuccess: (name) => `${name} o'chirildi!`,
    removeError: "Adminni o'chirishda xatolik yuz berdi qayta urunib ko'ring!",
  },
  rop: {
    createPath: "/api/v1/user/rop",
    listPath: "/api/v1/user/all/rop",
    removePath: (id) => `/api/v1/user/remove-rop/${id}`,
    conflictMsg: "Bu email bilan rop ro'yhatdan o'tgan!",
    removeSuccess: () => "Rop o'chirildi!",
    removeError: "Ropni o'chirishda xatolik yuz berdi qayta urunib ko'ring!",
  },
  "sales-manager": {
    createPath: "/api/v1/user/sales-manager",
    listPath: "/api/v1/user/all/sales-manager",
    removePath: (id) => `/api/v1/user/remove-sales-maneger/${id}`,
    conflictMsg: "Bu email bilan sotuv menejeri ro'yhatdan o'tgan!",
    removeSuccess: () => "Sotuvchi o'chirildi!",
    removeError:
      "Sotuvchini o'chirishda xatolik yuz berdi qayta urunib ko'ring!",
  },
};

const TOAST_OPTS = { position: "top-center" };
const NETWORK_ERR = "Tizimda nosozlik, adminga aloqaga chiqing!";
const GENERIC_ERR = "Xatolik yuz berdi, qayta urunib ko'ring!";

/**
 * @param {'admin' | 'rop' | 'sales-manager'} type
 */
export function useUserCrud(type) {
  const config = CONFIG[type];
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const [getLoading, setGetLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const get = useCallback(async () => {
    setGetLoading(true);
    setError(null);
    try {
      const res = await apiRequest(config.listPath);
      if (res.ok) {
        const { users } = await res.json();
        setList(users ?? []);
      } else {
        setError(GENERIC_ERR);
      }
    } catch {
      setError("Tizimda nosozlik!");
    } finally {
      setGetLoading(false);
    }
  }, [config.listPath]);

  useEffect(() => {
    get();
  }, [get]);

  const add = useCallback(
    async (data) => {
      setAddLoading(true);
      try {
        const res = await apiRequest(config.createPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.status === 201) {
          const newUser = await res.json();
          setList((prev) => [newUser, ...prev]);
          toast.success(`${newUser.fullName} qo'shildi!`);
          return true;
        }
        if (res.status === 409) {
          toast.error(config.conflictMsg, TOAST_OPTS);
          return false;
        }
        toast.error(GENERIC_ERR, TOAST_OPTS);
        return false;
      } catch {
        toast.error(NETWORK_ERR, TOAST_OPTS);
        return false;
      } finally {
        setAddLoading(false);
      }
    },
    [config.createPath, config.conflictMsg]
  );

  const remove = useCallback(
    async (id, fullName = "") => {
      setRemoveLoading(true);
      try {
        const res = await apiRequest(config.removePath(id), { method: "DELETE" });
        if (res.ok) {
          setList((prev) => prev.filter((u) => u.id !== id));
          const msg =
            typeof config.removeSuccess === "function"
              ? config.removeSuccess.length > 0
                ? config.removeSuccess(fullName)
                : config.removeSuccess()
              : config.removeSuccess;
          toast.success(msg);
        } else {
          toast.error(config.removeError);
        }
      } catch {
        toast.error(NETWORK_ERR);
      } finally {
        setRemoveLoading(false);
      }
    },
    [config.removePath, config.removeSuccess, config.removeError]
  );

  return {
    list,
    error,
    getLoading,
    addLoading,
    removeLoading,
    get,
    add,
    remove,
  };
}
