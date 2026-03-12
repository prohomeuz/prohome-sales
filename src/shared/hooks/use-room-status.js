/**
 * DATA layer: room status update.
 */

import { useCallback, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (value instanceof Blob) {
    const fileName =
      typeof value.name === "string" && value.name.trim()
        ? value.name
        : `${key}.pdf`;
    formData.append(key, value, fileName);
    return;
  }

  formData.append(key, String(value));
}

function createStatusFormData(payload) {
  if (payload instanceof FormData) {
    return payload;
  }

  const formData = new FormData();
  Object.entries(payload ?? {}).forEach(([key, value]) => {
    appendFormValue(formData, key, value);
  });

  return formData;
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
    const formData = createStatusFormData(payload);

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest(`/api/v1/room/update-status/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        return { ok: true, data };
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
