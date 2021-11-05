module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:jest/recommended',
    'airbnb-typescript',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
  ],
  plugins: ['eslint-plugin-import'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      modules: true,
    },
  },
  root: true,
  env: {
    browser: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-extra-non-null-assertion': 'warn',
    'import/named': 'off',
    'import/export': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': [
      0,
      {
        caseSensitive: false,
      },
    ],
    'import/no-extraneous-dependencies': 'off',
    'import/order': 'off',
    'import/first': 'error',
    'import/no-cycle': 'off',
    'no-param-reassign': 'off',
    'no-dupe-class-members': 'off',
    'no-new': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-shadow': 'off',
    'no-undef': 'off',
    'no-unneeded-ternary': 'off',
    'no-restricted-syntax': 'off',
    'no-return-await': 'off',
    'no-useless-constructor': 'off',
    'no-debugger': process.env.NODE_ENV === 'development' ? 'off' : 'error',
    'no-alert': process.env.NODE_ENV === 'development' ? 'off' : 'error',
    'no-console': process.env.NODE_ENV === 'development' ? 'off' : 'error',
    'no-useless-return': 'off',
    'no-bitwise': 'off',
    'security/detect-unsafe-regex': 'error',
    'no-return-assign': 'off',
    'no-empty-function': 'off',
    'no-nested-ternary': 'off',
    'no-unused-expressions': 'off',
    'lines-between-class-members': 'off',
    'dot-notation': 'off',
    'prefer-destructuring': 'off',
    'prefer-spread': 'off',
    'consistent-return': 'off',
    'array-callback-return': 'off',
    'no-async-promise-executor': 'off',    
    'jsx-a11y/mouse-events-have-key-events': 'off',
    'class-methods-use-this': 'off',
    'operator-assignment': 'off',
    'operator-linebreak': 'off',
    'no-unexpected-multiline': 'off',
    'require-await': 'warn',
    'max-len': [
      'off',
      {
        code: 80,
      },
    ],
    'implicit-arrow-linebreak': 'off',
    'func-names': 'off',
    'max-classes-per-file': 'off',
    'prefer-object-spread': 'off',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        jsxSingleQuote: false,
        trailingComma: 'all',
        endOfLine: 'auto',
      },
    ],
    'import/dynamic-import-chunkname': 'warn',    
    'local-rules/handle-reaction-disposer': 'warn',
    'local-rules/handle-window-open': 'warn',    
    'import/extensions': 'off',
    'security/detect-non-literal-fs-filename': 'off',
  },
  settings: {    
    'import/ignore': ['node_modules', 'build'],
  },
  overrides: [
    {
      files: ['**/__tests__/**/*'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-extra-non-null-assertion': 'off',
        'jest/no-disabled-tests': 'off',
        'global-require': 'off',
        'import/no-dynamic-require': 'off',
        'jest/valid-expect': 'error',
        'jest/valid-expect-in-promise': 'error',
        'jest/no-identical-title': 'warn',
      },
    }    
  ],
};
