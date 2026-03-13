import {
  defineConfig as defineViteConfig,
  defineProject,
  mergeConfig,
} from 'vitest/config'

const excludedPaths = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/.history/**',
  '**/coverage/**',
  '**/*.config.*',
  '**/*.test.*',
  '**/*.spec.*',
  '**/types/**',
  '**/__tests__/**',
  '**/test/**',
  '**/tests/**',
]

const baseConfig = defineViteConfig({
  test: {
    exclude: excludedPaths,
    coverage: {
      exclude: [
        ...excludedPaths,
        '**/src/index.ts',
        '**/types.ts',
        '**/services/*/index.ts',
        '**/services/shared/**',
      ],
      include: ['**/src/**/*.{ts,tsx}'],
      excludeNodeModules: true,
      cleanOnRerun: true,
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      provider: 'v8',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})

export default mergeConfig(
  baseConfig,
  defineViteConfig({
    test: {
      projects: [
        defineProject({
          test: {
            extends: true,
            name: 'unit',
            include: ['**/src/**/*.spec.ts'],
          },
        }),
        defineProject({
          test: {
            extends: true,
            name: 'integration',
            include: ['**/src/**/*.test.ts'],
          },
        }),
      ],
    },
  }),
)
