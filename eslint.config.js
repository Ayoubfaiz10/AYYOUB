module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        Notification: 'readonly',
        URL: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_'
        }
      ],
      'no-console': 'off',
      eqeqeq: ['warn', 'always'],
      'no-var': 'warn',
      'prefer-const': 'warn'
    },
    ignores: ['node_modules/**', 'dist/**', 'storage/**', 'modules_backup/**']
  }
];
