import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "src/manifest.json",
          dest: "."
        },
        {
          src: "src/assets", // if you have icons or assets
          dest: "assets"
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background/index") {
            return "background.js";
          }
          return "[name].js";
        }
      }
    },
    outDir: "dist",
    emptyOutDir: true,
  }
});
