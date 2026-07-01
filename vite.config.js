import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   port: 5173,
  //   // Set to true or '0.0.0.0' to allow external tunnels
  //   host: true,
  //   // Vite 6+ requires you to explicitly allow hostnames to prevent 403 errors
  //   allowedHosts: true,
  // },
});
