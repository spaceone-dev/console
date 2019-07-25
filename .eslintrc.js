module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    'html',
    'standard',
    'vue'
  ],
  env: {
    browser: true,
    jquery: true
  },
  globals: {
    "$": true,
    "jQuery": true,
  },
  rules: {
    "indent": ["error", 4, {
      "ObjectExpression": 1,
      "flatTernaryExpressions": true,
      "ignoreComments": true,
      "ArrayExpression": 1
    }],
    'quotes': ['off', 'single'],
    'no-console': 'off',
    'comma-dangle': ['error', {
      'arrays': 'never',
      'objects': 'never',
      'imports': 'never',
      'exports': 'never',
      'functions': 'never'
    }],
    "no-irregular-whitespace": ["error", {"skipComments": true}],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    'no-empty': 'error',
    'no-duplicate-imports': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "semi": ["error", "always"],
    'vue/max-attributes-per-line': ['off', {
      'singleline': 1,
      'multiline': {
        'max': 1,
        'allowFirstLine': false
      }
    }],
  }
}
