import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    video: false,
    // Screenshots are the only failure artifact CI can hand back; keep local runs clean.
    screenshotOnRunFailure: !!process.env.CI,
    specPattern: 'cypress/components/**/*.spec.ts',
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
})
