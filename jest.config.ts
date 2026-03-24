import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    '^@mswjs/interceptors/ClientRequest$':
      '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/ClientRequest/index.cjs',
    '^@mswjs/interceptors/XMLHttpRequest$':
      '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/XMLHttpRequest/index.cjs',
    '^@mswjs/interceptors/fetch$':
      '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/fetch/index.cjs',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 15000,
  maxWorkers: 1,
};

// Wrap createJestConfig to add transformIgnorePatterns after Next.js processes the config
export default async () => {
  const jestConfig = await createJestConfig(config)();
  // Transform MSW's ESM-only dependencies (works on Windows with both path separators)
  jestConfig.transformIgnorePatterns = [
    '[/\\\\]node_modules[/\\\\](?!msw|@mswjs|until-async|is-network-error|path-to-regexp|@bundled-es-modules)[^/\\\\]*[/\\\\]',
  ];
  return jestConfig;
};
