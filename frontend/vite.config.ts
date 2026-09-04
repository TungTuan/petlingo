import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'release') {
    const env = loadEnv(mode, process.cwd(), '')
    const apiUrl = env.VITE_API_URL
    if (!apiUrl) throw new Error('Release build requires VITE_API_URL in .env.release')
    const parsed = new URL(apiUrl)
    if (parsed.protocol !== 'https:') throw new Error('Release VITE_API_URL must use HTTPS')
    const legalEntity = env.VITE_LEGAL_ENTITY?.trim()
    if (!legalEntity || /replace_with|example/i.test(legalEntity)) throw new Error('Release build requires a real VITE_LEGAL_ENTITY')
    const legalEmail = env.VITE_LEGAL_CONTACT_EMAIL?.trim()
    if (!legalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(legalEmail) || /example\.com$|your-domain\.com$/i.test(legalEmail)) {
      throw new Error('Release build requires a real VITE_LEGAL_CONTACT_EMAIL')
    }
  }

  return { plugins: [react(), tailwindcss()] }
})
