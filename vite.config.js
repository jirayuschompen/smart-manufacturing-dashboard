import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/smart-manufacturing-dashboard/',
  server: {
    proxy: {
      '/sungrow': {
        target: 'https://web3.isolarcloud.com.hk',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/sungrow/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // ลบ origin header ที่ทำให้ Sungrow block
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            console.log('[Sungrow Proxy] →', req.method, proxyReq.path);
          });
          proxy.on('error', (err) => {
            console.error('[Sungrow Proxy] Error:', err.message);
          });
        },
      },
    },
  },
});