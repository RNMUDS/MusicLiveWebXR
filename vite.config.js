import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0', // すべてのネットワークインターフェースでリッスン
    port: 3000,
    open: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert/localhost+3-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert/localhost+3.pem'))
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three']
        }
      }
    }
  }
});
