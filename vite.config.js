import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const pdfProxyTarget =
    env.VITE_PDF_SERVICE_PROXY_TARGET?.trim() || "https://contract.prohome.uz";

  const pdfProxyConfig = {
    "/pdf-service": {
      target: pdfProxyTarget,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/pdf-service/, "") || "/",
    },
    "/api": {
      target: env.VITE_BASE_URL?.trim() || "https://backend.prohome.uz",
      changeOrigin: true,
      secure: false,
      ws: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: pdfProxyConfig,
    },
    preview: {
      proxy: pdfProxyConfig,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            if (
              id.includes("/react/") ||
              id.includes("react-dom") ||
              id.includes("scheduler")
            ) {
              return "vendor-react";
            }

            if (id.includes("react-router") || id.includes("@remix-run")) {
              return "vendor-router";
            }

            if (id.includes("@dnd-kit")) {
              return "vendor-dnd";
            }

            if (id.includes("@radix-ui") || id.includes("/vaul/")) {
              return "vendor-ui";
            }

            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-charts";
            }

            if (
              id.includes("react-photo-view") ||
              id.includes("canvas-confetti")
            ) {
              return "vendor-media";
            }
          },
        },
      },
    },
  };
});
