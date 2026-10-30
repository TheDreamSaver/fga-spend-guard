import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['http', 'https', 'url', 'util', 'stream', 'crypto', 'buffer', 'events', 'fs', 'path', 'os', 'net', 'tls', 'zlib', 'querystring'],
  },
  build: {
    rollupOptions: {
      external: ['http', 'https', 'url', 'util', 'stream', 'crypto', 'buffer', 'events', 'fs', 'path', 'os', 'net', 'tls', 'zlib', 'querystring'],
    },
  },
}));
