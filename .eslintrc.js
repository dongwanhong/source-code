module.exports = {
  parser: 'babel-eslint',
  env: {
    browser: true,
    es6: true
  },
  extends: [
    'airbnb-base', // Airbnb's base JS .eslintrc (without React plugins)
    'prettier' // Use prettier, it can disable all rules which conflict with prettier
  ],
  plugins: ['prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'prettier/prettier': 'error'
  }
}
