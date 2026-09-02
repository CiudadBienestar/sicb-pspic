import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/sheets': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const match = path.match(/^\/api\/sheets\/([^/]+)\/([^/]+)/);
          if (!match) return path;
          const [, sheetId, gid] = match;
          return `/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&usp=sharing`;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Referer', 'https://docs.google.com/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
          });
        },
      },
    },
  },
})