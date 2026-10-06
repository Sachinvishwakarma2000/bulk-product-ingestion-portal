import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API calls to whichever backend you picked.
      '/api': 'http://localhost:4000',
    },
  },
});
