import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load environment variables prefixed with REACT_APP_ from the root folder
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');
  // Also load VITE_ prefixed vars (e.g. VITE_GOOGLE_CLIENT_ID)
  const viteEnv = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    define: {
      'process.env': env,
    },
    plugins: [
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/app'),
      },
    },
  };
})

