import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
