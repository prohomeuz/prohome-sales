import { useCallback, useState } from "react";

const PDF_RENDER_URL =
  import.meta.env.VITE_PDF_RENDER_URL ?? "http://127.0.0.1:3000/api/render-pdf";

export function useRenderPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const renderPdf = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(PDF_RENDER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload ?? {}),
      });

      if (!res.ok) {
        let message = "PDF yaratib bo'lmadi.";
        try {
          const text = await res.text();
          if (text) {
            message = text;
          }
        } catch {
          // Ignore body parsing errors and keep fallback message.
        }

        setError(message);
        return { ok: false, message };
      }

      const blob = await res.blob();
      return {
        ok: true,
        blob,
        fileName: payload?.fileName || "reservation.pdf",
      };
    } catch {
      const message = "PDF servisiga ulanib bo'lmadi.";
      setError(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { renderPdf, loading, error };
}
