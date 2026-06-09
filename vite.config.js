import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: false,
      filename: 'bundle-report.html',
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'CRAVZO - Food Delivery',
        short_name: 'CRAVZO',
        description: 'Order food from your favorite restaurants with fast delivery',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Only precache the HTML shell + CSS + fonts — not large images/icons
        globPatterns: ['**/*.{html,css,woff2}'],
        // Exclude oversized public files from SW precache
        globIgnores: [
          '**/favicon.svg',
          '**/cravzologo.png',
          '**/icon-512.png',
          '**/node_modules/**',
        ],
        maximumFileSizeToCacheInBytes: 500 * 1024, // 500KB
        runtimeCaching: [
          // JS chunks — cache as they're fetched (StaleWhileRevalidate)
          {
            urlPattern: /\/assets\/.*\.js$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-chunks',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images-cache',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API — stale while revalidate: show cached instantly, fetch fresh in background
          {
            urlPattern: /\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    // Treeshake aggressively
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      treeshake: {
        // Do NOT disable moduleSideEffects globally — React depends on them
        // for its internal singleton (window.__REACT__, dispatcher, etc.)
        preset: 'recommended',
      },
      output: {
        // Fine-grained manual chunks so each route only loads what it needs
        manualChunks(id) {
          // Firebase — loaded dynamically, keep in own chunk
          if (id.includes('firebase')) return 'vendor-firebase';

          // Recharts — only Rider pages need it
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';

          // Leaflet — only RiderMap needs it
          if (id.includes('leaflet')) return 'vendor-map';

          // socket.io — chat and admin only
          if (id.includes('socket.io') || id.includes('engine.io')) return 'vendor-socket';

          // React core — always needed, keep react + react-dom + scheduler + router
          // all in ONE chunk to prevent duplicate React instance error
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/') ||
            id.includes('/node_modules/react-router') ||
            id.includes('/node_modules/react-is/')
          ) return 'vendor-react';

          // lucide icons — shared UI
          if (id.includes('lucide-react')) return 'vendor-icons';

          // Everything else in node_modules (zod, date-fns, etc.)
          if (id.includes('node_modules')) return 'vendor-misc';
        },
      },
    },
  },
})
