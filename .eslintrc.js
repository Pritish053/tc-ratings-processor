module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true // This adds mocha globals like describe, it, before, after
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Allow console.log in development
    'no-console': 'off',
    // Allow unused vars with underscore prefix
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      env: {
        mocha: true
      },
      globals: {
        expect: 'readonly'
      }
    }
  ]
}
