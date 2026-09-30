import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Suhteellinen base: toimii GitHub Pagesin alipolulla (/Harakka/) ja paikallisesti (HashRouter, ei palvelinreititystä).
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    // `npm run dev:api` (wrangler dev, portti 8787) vastaa API:sta paikallisesti.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/img': 'http://127.0.0.1:8787',
    },
  },
})
