import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'generate-firebase-sw',
        writeBundle() {
          const swTemplate = readFileSync('public/firebase-messaging-sw.js', 'utf-8')
          const swOutput = swTemplate
            .replace("self.__FIREBASE_API_KEY__ || ''", `'${env.VITE_FIREBASE_API_KEY || ''}'`)
            .replace("self.__FIREBASE_AUTH_DOMAIN__ || ''", `'${env.VITE_FIREBASE_AUTH_DOMAIN || ''}'`)
            .replace("self.__FIREBASE_PROJECT_ID__ || ''", `'${env.VITE_FIREBASE_PROJECT_ID || ''}'`)
            .replace("self.__FIREBASE_STORAGE_BUCKET__ || ''", `'${env.VITE_FIREBASE_STORAGE_BUCKET || ''}'`)
            .replace("self.__FIREBASE_MESSAGING_SENDER_ID__ || ''", `'${env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}'`)
            .replace("self.__FIREBASE_APP_ID__ || ''", `'${env.VITE_FIREBASE_APP_ID || ''}'`)
          writeFileSync('dist/firebase-messaging-sw.js', swOutput)
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/messaging', 'firebase/analytics'],
            'vendor-ui': ['framer-motion', '@radix-ui/react-accordion', '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/react-tooltip'],
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet', 'react-leaflet'],
            'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers'],
          },
        },
      },
    },
  }
})
