import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' gjør at appen fungerer både lokalt og på GitHub Pages (/julegameshow/)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
});
