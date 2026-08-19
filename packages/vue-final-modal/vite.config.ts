import path from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

const name = 'index'

export default defineConfig({
  resolve: {
    alias: {
      '~': `${path.resolve(__dirname, 'src')}`,
    },
  },
  plugins: [
    Vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
    }),
  ],
  publicDir: false,
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name,
      // Vite >=6 names the library stylesheet after the package ("vue-final-modal.css").
      // `vue-final-modal/style.css` is public API, so keep the original filename.
      cssFileName: 'style',
      fileName: format => `${name}.${format}.${format === 'es' ? 'm' : ''}js`,
    },
    rollupOptions: {
      external: [
        'vue',
        '@vueuse/core',
        '@vueuse/integrations/useFocusTrap',
        'focus-trap',
      ],
      output: {
        globals: {
          'vue': 'Vue',
          '@vueuse/core': 'VueUse',
          '@vueuse/integrations/useFocusTrap': 'VueUseFocusTrap',
          'focus-trap': 'FocusTrap',
        },
      },
    },
  },
  define: {
    __DEV__: JSON.stringify(!process.env.prod),
  },
})
