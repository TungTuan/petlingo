import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'release') {
    const apiUrl = loadEnv(mode, process.cwd(), '').VITE_API_URL
    if (!apiUrl) throw new Error('Release build requires VITE_API_URL in .env.release')
    const parsed = new URL(apiUrl)
    if (parsed.protocol !== 'https:') throw new Error('Release VITE_API_URL must use HTTPS')
  }

  return { plugins: [react(), tailwindcss()] }
})
