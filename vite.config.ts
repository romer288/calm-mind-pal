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
  // Add support for GLB and WASM files
  assetsInclude: ['**/*.glb', '**/*.wasm', '**/*.onnx'],
  build: { 
    target: 'es2022',
    rollupOptions: {
      external: (id) => {
        // Keep WASM files as external assets
        return id.includes('.wasm') || id.includes('.onnx');
      }
    }
  }
}));
