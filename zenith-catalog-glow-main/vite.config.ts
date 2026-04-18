import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.warn"],
        passes: 2,
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        // Fine-grained code splitting for mobile — only load what's needed
        manualChunks(id) {
          // Core React runtime — always needed, tiny separate chunk
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
            return "react-core";
          }
          // Router — needed on first paint
          if (id.includes("node_modules/react-router-dom/") || id.includes("node_modules/react-router/") || id.includes("node_modules/@remix-run/")) {
            return "router";
          }
          // Data fetching layer
          if (id.includes("node_modules/@tanstack/")) {
            return "query";
          }
          // Framer motion — heavy, defer
          if (id.includes("node_modules/framer-motion/")) {
            return "motion";
          }
          // Radix UI — split from app code
          if (id.includes("node_modules/@radix-ui/")) {
            return "radix";
          }
          // Charts — admin only, very heavy
          if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-")) {
            return "charts";
          }
          // Everything else in node_modules gets its own vendor chunk
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
        // Use content-hash filenames for long-term caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    target: ["es2020", "chrome80", "safari14", "firefox80"],
    chunkSizeWarningLimit: 600,
    assetsInlineLimit: 4096, // Inline assets < 4KB as base64 (saves HTTP round trips)
    reportCompressedSize: false, // Speeds up build
  },
  // Optimize dependency pre-bundling for faster dev cold starts
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "axios",
      "clsx",
      "tailwind-merge",
    ],
    exclude: ["framer-motion"],
  },
});
