import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias cloakscreen to the built library for examples
      'cloakscreen': path.resolve(__dirname, './dist/index.esm.js'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    exclude: ['cloakscreen'], // Exclude our own library from optimization
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    https: {
      key: './certs/key.pem',
      cert: './certs/cert.pem',
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Only proxy UMD build for HTML examples
      '/cloakscreen.min.js': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist-examples',
    rollupOptions: {
      input: {
        main: 'index.html',
        'basic-protection': 'examples/basic-protection.html',
      },
    },
  },
});
