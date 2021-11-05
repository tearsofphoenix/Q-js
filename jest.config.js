// https://jestjs.io/docs/configuration#collectcoveragefrom-array
// https://jestjs.io/docs/configuration#modulepathignorepatterns-arraystring
// `collectCoverageFrom` is an array of `glob pattern`, but `modulePathIgnorePatterns` is an array of `regexp pattern`
// so these two configure can not use `process.env.APP` at the same time, should transform `glob pattern` to `regexp pattern`

process.env.APP = process.env.APP || '<rootDir>';

module.exports = {
  roots: [
    'src'
  ],
  clearMocks: true,
  collectCoverageFrom: [
    `${process.env.APP}/src/**/*.(js|ts)`,
  ],
  transform: {
    '^.+\\.(jsx?|tsx?)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: [
  ],

  transformIgnorePatterns: [
  ],

  moduleFileExtensions: [
    'ts',
    'js',
    'json',
    'node',
    'mjs',
    'd.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: 'utReport',
      },
    ],
  ],
  setupFilesAfterEnv: ['jest-extended'],
};
