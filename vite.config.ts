import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    // PWA CONFIGURATION FOR OFFLINE SUPPORT
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'app-logo.png'],
      manifest: {
        name: 'Natpe Thunai',
        short_name: 'NatpeThunai',
        description: 'Student Community App for Buying, Selling & Connecting',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // THIS ENABLES OFFLINE STARTUP
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'], // Cache these file types
        navigateFallback: '/index.html', // Redirect all navigation to index.html when offline
        navigateFallbackDenylist: [/^\/api/], // Don't cache API routes
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
             // Cache Avatar images (optional but good for UX)
             urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
             handler: 'StaleWhileRevalidate',
             options: {
                cacheName: 'avatar-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
             }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));