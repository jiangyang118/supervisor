import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [VantResolver()], dts: false }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: '@import (reference) "src/styles/variables.less";',
      },
    },
  },
  server: {
    host: true,
    port: 4220,
    proxy: {
      '/api': {
        target: 'http://localhost:3300',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
