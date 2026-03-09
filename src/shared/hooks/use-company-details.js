/**
 * DATA layer: single company CRUD (get, edit, status, delete).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/shared/lib/api";

const NETWORK_ERR = "Tizimda nosozlik, adminga aloqaga chiqing!";
const GENERIC_ERR = "Xatolik yuz berdi qayta urunib ko'ring!";

export function useCompanyDetails(id) {
  const [details, setDetails] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [getLoading, setGetLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    if (!id) return;
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setGetLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await apiRequest(`/api/v1/company/one/${id}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const { data } = await res.json();
        setDetails({
          ...data,
          permissions: data.permissions ?? { PROHOME: true, CRM: false },
        });
      } else if (res.status === 404 || res.status === 400) {
        setNotFound(true);
      } else {
        setError(GENERIC_ERR);
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      setError("Tizimda nosozlik!");
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setGetLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  const edit = useCallback(
    async (data) => {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        formData.append(k, v);
      });

      setEditLoading(true);
      try {
        const res = await apiRequest(`/api/v1/company/${id}`, {
          method: "PATCH",
          body: formData,
        });
        if (res.ok) {
          const result = await res.json();
          setDetails({
            ...result,
            permissions: result.permissions ?? { PROHOME: true, CRM: false },
          });
          toast.success(`${result.name} ma'lumotlari yangilandi!`);
          return true;
        }
        if (res.status === 404) setNotFound(true);
        else setError(GENERIC_ERR);
        return false;
      } catch {
        setError("Tizimda nosozlik!");
        return false;
      } finally {
        setEditLoading(false);
      }
    },
    [id]
  );

  const toggleStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await apiRequest(`/api/v1/company/status/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setDetails((prev) => ({
          ...data,
          permissions: data.permissions ?? prev?.permissions ?? { PROHOME: true, CRM: false },
        }));
        toast.success(
          `${data.name} ${data.status ? "faollashtirildi" : "to'xtatildi"}!`
        );
      } else if (res.status === 404 || res.status === 400) {
        setNotFound(true);
      } else {
        setError(GENERIC_ERR);
      }
    } catch {
      setError("Tizimda nosozlik!");
    } finally {
      setStatusLoading(false);
    }
  }, [id]);

  const remove = useCallback(async () => {
    setDeleteLoading(true);
    try {
      const res = await apiRequest(`/api/v1/company/delete/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`${details?.name} kompaniyasi o'chirildi!`);
        return true;
      }
      toast.error("Kompaniyani o'chirishda xatolik yuz berdi qayta urunib ko'ring!");
      return false;
    } catch {
      toast.error(NETWORK_ERR);
      return false;
    } finally {
      setDeleteLoading(false);
    }
  }, [id, details?.name]);

  return {
    details,
    notFound,
    error,
    getLoading,
    editLoading,
    statusLoading,
    deleteLoading,
    get,
    edit,
    toggleStatus,
    remove,
  };
}
