import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // O 'prompt' si prefereixes notificar l'usuari
      devOptions: {
        enabled: true, // Permet proves en localhost
        type: 'module',
      },
      manifest: { // Web App Manifest
        name: 'HandballStats',
        short_name: 'HStats',
        description: 'Gestió d\'equips de handbol',
        theme_color: '#4f8ef7', // Canvia pel teu color principal
        background_color: '#0a0d12',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico', // La teva icona! Has d'indicar la ruta correcta.
            sizes: '64x64 32x32 24x24 16x16', // El plugin no redimensiona; fem referència a mides que pot tenir el teu .ico
            type: 'image/x-icon',
            purpose: 'any'
          },
          // Per a dispositius moderns, és recomanable afegir icones PNG addicionals. Si no en tens, pots ometre-les.
        ]
      }
    })
  ]
})