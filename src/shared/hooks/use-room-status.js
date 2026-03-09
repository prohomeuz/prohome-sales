/**
 * DATA layer: room status update.
 */

import { useCallback, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function normalizeApiMessage(message) {
  return String(message ?? "")
    .trim()
    .replace(/downPayment/g, "Boshlang'ich to'lov")
    .replace(/installments/g, "Muddat")
    .replace(/discountValue/g, "Chegirma")
    .replace(/firstName/g, "Ism")
    .replace(/lastName/g, "Familiya")
    .replace(/phone/g, "Telefon")
    .replace(/description/g, "Izoh")
    .replace(/must be a positive number/g, "musbat raqam bo'lishi kerak")
    .replace(
      /must be a number conforming to the specified constraints/g,
      "raqam formatida bo'lishi kerak",
    )
    .replace(/([a-z])([A-Z])/g, "$1, $2")
    .replace(/bo'lishi kerak(?=[A-ZА-Я])/g, "bo'lishi kerak. ");
}

export function useRoomStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = useCallback(async (id, payload) => {
    const formData = new FormData();
    Object.entries(payload ?? {}).forEach(([key, value]) => {
      appendFormValue(formData, key, value);
    });

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest(`/api/v1/room/update-status/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        return { ok: true };
      }

      let message = "";
      try {
        const data = await res.json();
        message = normalizeApiMessage(
          data?.message ??
          data?.error ??
          data?.detail ??
          data?.details ??
          "",
        );
      } catch {
        message = "";
      }

      const fallback =
        res.status === 404 || res.status === 400
          ? "Xatolik yuz berdi qayta urunib ko'ring!"
          : "Status yangilanmadi.";

      setError(message || fallback);
      return { ok: false, message: message || fallback, status: res.status };
    } catch {
      const message = "Tizimda nosozlik!";
      setError(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateStatus, loading, error };
}
