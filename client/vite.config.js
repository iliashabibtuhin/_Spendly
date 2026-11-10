import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // In development the client calls /api on its own origin and Vite
      // forwards it to the Express server.
      proxy: {
        "/api": { target: env.API_PROXY_TARGET || "http://localhost:4000", changeOrigin: true },
      },
    },
  };
});
