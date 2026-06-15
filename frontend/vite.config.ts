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
  // Load environment variables from system process.env and .env files
  const env = {
    ...Object.keys(process.env)
      .filter((key) => key.startsWith('REACT_APP_') || key.startsWith('VITE_'))
      .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {}),
    ...loadEnv(mode, process.cwd(), 'REACT_APP_'),
    ...loadEnv(mode, process.cwd(), 'VITE_'),
  };

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

