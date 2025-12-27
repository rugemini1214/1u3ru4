import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 設定為您的 repo 名稱
  base: '/1u3ru4/', 

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'LiteNote',
        short_name: 'LiteNote',
        description: '極簡、安全、無後台的個人筆記 PWA',
        theme_color: '#f9fafb',
        background_color: '#f9fafb',
        display: 'standalone', 
        orientation: 'portrait',
        // PWA 範圍設定
        scope: '/1u3ru4/',
        start_url: '/1u3ru4/',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
})