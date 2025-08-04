import security from 'eslint-plugin-security';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    // Only scan source files in apps and libs
    files: ['apps/**/src/**/*.{js,ts,tsx}', 'libs/**/src/**/*.{js,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      security
    },
    settings: {
      // Ignore undefined rules from inline comments
      'import/resolver': {
        typescript: true
      }
    },
    rules: {
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-bidi-characters': 'error',
      // Disable object injection as it has too many false positives
      'security/detect-object-injection': 'off'
    }
  },
  {
    // Ignore all build artifacts, cache, generated files, and scripts
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/tmp/**',
      '**/*.d.ts',
      '**/test-output/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/scripts/**',
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/jest.config.ts'
    ]
  }
];
