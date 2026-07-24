import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/components": resolve(__dirname, "src/components"),
      "@/features": resolve(__dirname, "src/features"),
      "@/services": resolve(__dirname, "src/services"),
      "@/hooks": resolve(__dirname, "src/hooks"),
      "@/store": resolve(__dirname, "src/store"),
      "@/lib": resolve(__dirname, "src/lib"),
      "@/utils": resolve(__dirname, "src/utils")
    }
  },
  server: {
    port: 3000,
    strictPort: false
  },
  preview: {
    port: 3000,
    strictPort: false
  }
});

