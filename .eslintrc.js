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
    'prettier/prettier': 'error',
    // fix: eslint should be listed in the project's dependencies, not devDependencies
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-underscore-dangle': 'off'
  },
  settings: {
    'import/resolver': {
      node: {}, // fix: https://github.com/benmosher/eslint-plugin-import/issues/1396
      webpack: {
        config: './build/webpack.base.conf.js'
      }
    }
  },
  overrides: [
    {
      files: ['docs/**/*.js'],
      rules: {
        'max-classes-per-file': 'off',
        'class-methods-use-this': 'off'
      }
    },
    {
      files: ['src/utils/index.js'],
      rules: {
        'class-methods-use-this': 'off'
      }
    }
  ]
}
