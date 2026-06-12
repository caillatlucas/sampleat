import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/sampleat/',
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Sampleat',
        short_name: 'Sampleat',
        description: 'A web-based sample player and sequencer',
        theme_color: '#FF3131',
        icons: [
          {
            src: 'apple-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'apple-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
