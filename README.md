# Q-js
NodeJS version of [ProjectQ](https://github.com/ProjectQ-Framework/ProjectQ)

CircleCI build status: [![CircleCI](https://circleci.com/gh/tearsofphoenix/Q-js/tree/master.svg?style=svg)](https://circleci.com/gh/tearsofphoenix/Q-js/tree/master)

[![NPM](https://nodei.co/npm/projectq.png)](https://nodei.co/npm/projectq/)

### install
 1. use `git` to clone the repository 
 2. run `yarn install` 
 3. run `yarn build` to build native cpp simulator 
 4. run `yarn test`, check examples 
 
### notice
  1. Most of the `class` have same name with the original ProjectQ project
  2. Using `camelcase` rules to renamed most class methods. `get_inverse`
     has been changed to `getInverse`.
  3. Some class (like `GridMapper`) have too much arguments for it's constructor,
     so changed to only pass an `Object` which contains all original arguments.
  4. Python `tuple` type has been ported to Javascript `Array`. It's the programmer's
     responsibility to make sure not to mutate immutable object, but not the language.  
  5. `ibm` and `GridMapper` is still under porting. 
  6. Issues and pull requests are welcome.      