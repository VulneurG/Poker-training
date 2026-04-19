import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimalPreset,
    apple: {
      sizes: [180],
      padding: 0.12,
      resizeOptions: { background: '#15803d' },
    },
  },
  images: ['public/icon.svg'],
})
