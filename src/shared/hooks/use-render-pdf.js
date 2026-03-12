import { useCallback, useState } from "react";

const PDF_BASE_URL = import.meta.env.VITE_PDF_RENDER_URL ?? "http://localhost:3000";

function resolvePdfCandidateUrls() {
  if (PDF_BASE_URL.includes("/api/render-pdf")) {
    return [PDF_BASE_URL];
  }

  const normalizedBase = PDF_BASE_URL.endsWith("/")
    ? PDF_BASE_URL.slice(0, -1)
    : PDF_BASE_URL;

  return [`${normalizedBase}/api/render-pdf`, normalizedBase];
}

export function useRenderPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const renderPdf = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      let res = null;
      const candidates = resolvePdfCandidateUrls();

      for (const url of candidates) {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload ?? {}),
        });

        if (res.ok || (res.status !== 404 && res.status !== 405)) {
          break;
        }
      }

      if (!res?.ok) {
        let message = "PDF yaratib bo'lmadi.";
        try {
          const text = await res?.text();
          if (text) {
            message = text;
          }
        } catch {
          // Ignore body parsing errors and keep fallback message.
        }

        setError(message);
        return { ok: false, message };
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("pdf")) {
        let message = "PDF servis noto'g'ri javob qaytardi.";
        try {
          const text = await res.text();
          if (text) {
            message = text;
          }
        } catch {
          // Keep fallback message.
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
