module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/lib/**',
  ],
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 70,
      lines: 55,
      statements: 55,
    },
  },
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: false,
          skipLibCheck: true,
        },
      },
    ],
  },
};
