import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: "main",
    },
    rollupOptions: {
      external: (id) => {
        return (
          id === "electron" ||
          id === "electron-squirrel-startup" ||
          id.startsWith("node:") ||
          (!id.startsWith(".") && !id.startsWith("/"))
        );
      },
      output: {
        format: "es",
        entryFileNames: "main.js",
      },
    },
  },
});
