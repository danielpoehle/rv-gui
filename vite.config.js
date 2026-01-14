import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
      allowedHosts: true,
      port: 5173,
      host: '0.0.0.0',
  },
})