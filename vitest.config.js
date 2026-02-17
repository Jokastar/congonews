import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./jest.setup.js'],
    include: ['__tests__/**/*.test.js'],
  },
})
