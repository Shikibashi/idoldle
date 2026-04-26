import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow the cloudflared tunnel hostname through Vite's host-header check.
    // Without this, requests proxied from idoldle.edriffles.us hit a 403.
    allowedHosts: ["idoldle.edriffles.us", ".edriffles.us"],
  },
  preview: {
    // `vite preview` (production static server) has its own host-header
    // allowlist that is independent from `server.allowedHosts`. Must be
    // set explicitly or the cloudflared tunnel returns 403 on every
    // request.
    allowedHosts: ["idoldle.edriffles.us", ".edriffles.us"],
  },
  build: {
    target: "es2022",
    // Disabled in production to avoid leaking original source paths and
    // un-minified logic via dist/assets/*.js.map. Set SOURCEMAP=true at
    // build time to re-enable locally for debugging.
    sourcemap: process.env.SOURCEMAP === "true",
  },
});
