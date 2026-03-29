import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/onnxruntime-web/dist/*.wasm",
          dest: "",
        },
        {
          src: "node_modules/onnxruntime-web/dist/*.mjs",
          dest: "",
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
  server: {
    proxy: {
      "/api": process.env.VITE_API_URL || "http://localhost:3000",
    },
  },
});
