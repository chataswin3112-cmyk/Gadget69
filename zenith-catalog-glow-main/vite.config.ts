import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const criticalCss = `
:root{--background:40 33% 97%;--foreground:20 25% 10%;--card:0 0% 100%;--border:38 18% 88%;--surface-paper:42 42% 99%;--surface-pearl:32 36% 98%;--surface-soft-gold:38 56% 73%}
html{background:hsl(var(--background));-webkit-text-size-adjust:100%}
body{margin:0;min-width:320px;background:hsl(var(--background));color:hsl(var(--foreground));font-family:'Satoshi',system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
#root{min-height:100vh}
.section-container{max-width:1400px;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
.glass-solid{background:hsl(var(--card)/.96);border-bottom:1px solid hsl(var(--border)/.5);backdrop-filter:blur(16px)}
.home-hero{aspect-ratio:4/3;min-height:260px;background:linear-gradient(180deg,hsl(var(--surface-pearl)),hsl(var(--surface-paper)))}
.home-hero-overlay{background:linear-gradient(95deg,hsl(24 28% 12%/.76),hsl(28 26% 18%/.36) 46%,transparent 75%),radial-gradient(circle at top right,hsl(38 62% 76%/.22),transparent 34%)}
.home-hero-content{max-width:42rem;border-radius:1.25rem;border:1px solid hsl(0 0% 100%/.12);background:linear-gradient(135deg,hsl(25 22% 15%/.78),hsl(28 24% 20%/.42));padding:clamp(.875rem,3.5vw,2.5rem);box-shadow:0 28px 60px -36px hsl(24 22% 8%/.48);backdrop-filter:blur(18px)}
.home-hero-kicker{margin-bottom:.75rem;color:hsl(var(--surface-soft-gold));font-size:.7rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase}
@media (min-width:640px){.section-container{padding-left:1.5rem;padding-right:1.5rem}}
@media (min-width:768px){.section-container{padding-left:2rem;padding-right:2rem}.home-hero{aspect-ratio:21/9}}
`.trim();

const criticalCssPlugin = () => ({
  name: "inline-critical-css",
  transformIndexHtml(html: string) {
    return html.replace("</head>", `<style id="critical-css">${criticalCss}</style></head>`);
  },
});

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
  plugins: [react(), criticalCssPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    modulePreload: {
      polyfill: false,
    },
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
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
  esbuild: {
    legalComments: "none",
  },
  // Optimize dependency pre-bundling for faster dev cold starts
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "clsx",
      "tailwind-merge",
    ],
    exclude: ["framer-motion"],
  },
});
