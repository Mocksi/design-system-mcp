import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    pool: 'forks',
    typecheck: {
      enabled: true
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'examples/',
        'bin/',
        '**/*.test.ts',
        '**/*.config.ts'
      ]
    }
  },
  build: {
    target: 'node18',
    lib: {
      entry: 'src/server.ts',
      formats: ['es'],
      fileName: 'server'
    },
    rollupOptions: {
      external: ['@modelcontextprotocol/sdk', 'zod', 'fs', 'path']
    }
  }
})