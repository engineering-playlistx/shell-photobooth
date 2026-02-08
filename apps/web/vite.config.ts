import path from 'node:path'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
// import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    devtools(),
    nitro(),
    // cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    // @ts-expect-error - Tailwind has its own Vite version causing type conflicts
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },
})

export default config
