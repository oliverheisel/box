import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        generator: fileURLToPath(new URL("./index.html", import.meta.url)),
        guide: fileURLToPath(new URL("./info.html", import.meta.url)),
      },
    },
  },
  worker: {
    format: "es",
  },
});
