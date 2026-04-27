import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/lib': path.resolve(__dirname, './lib'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text-summary'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts', 'app/**/*.ts', 'components/**/*.ts'],
      exclude: [
        'lib/blog-posts/**',
        'lib/vehicle-data.ts',
        'lib/blog-data.ts',
        '**/*.d.ts',
        '**/node_modules/**',
      ],
    },
  },
})
