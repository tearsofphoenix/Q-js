/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const mkdir = require('mkdirp');
const path = require('path');
const spawn = require('cross-spawn');
const ext = require('./extensions');

/**
 * After build
 *
 * @param {Object} options
 * @api private
 */

function afterBuild(options) {
  const install = ext.getBinaryPath();
  const target = path.join(__dirname, '..', 'build',
    options.debug ? 'Debug'
      : process.config.target_defaults
        ? process.config.target_defaults.default_configuration
        : 'Release',
    'binding.node');

  mkdir(path.dirname(install)).then((err) => {
    if (err && err.code !== 'EEXIST') {
      console.error(err.message);
      return;
    }

    fs.stat(target, (err) => {
      if (err) {
        console.error('Build succeeded but target not found');
        return;
      }

      fs.rename(target, install, (err) => {
        if (err) {
          console.error(err.message);
          return;
        }

        console.log('Installed to', install);
      });
    });
  });
}

/**
 * Build
 *
 * @param {Object} options
 * @api private
 */

function build(options) {
  const args = [require.resolve(path.join('node-gyp', 'bin', 'node-gyp.js')), 'rebuild', '--verbose'].concat(
    ['libq_ext', 'libq_cflags', 'libq_ldflags', 'libq_library'].map((subject) => {
      return ['--', subject, '=', process.env[subject.toUpperCase()] || ''].join('');
    })
  ).concat(options.args);

  console.log('Building:', [process.execPath].concat(args).join(' '));

  const proc = spawn(process.execPath, args, {
    stdio: [0, 1, 2]
  });

  proc.on('exit', (errorCode) => {
    if (!errorCode) {
      afterBuild(options);
      return;
    }

    if (errorCode === 127) {
      console.error('node-gyp not found!');
    } else {
      console.error('Build failed with error code:', errorCode);
    }

    process.exit(1);
  });
}

/**
 * Parse arguments
 *
 * @param {Array} args
 * @api private
 */

function parseArgs(args) {
  const options = {
    arch: process.arch,
    platform: process.platform,
    force: process.env.npm_config_force === 'true',
  };

  options.args = args.filter((arg) => {
    if (arg === '-f' || arg === '--force') {
      options.force = true;
      return false;
    } else if (arg.substring(0, 13) === '--target_arch') {
      options.arch = arg.substring(14);
    } else if (arg === '-d' || arg === '--debug') {
      options.debug = true;
    } else if (arg.substring(0, 13) === '--libq_ext' && arg.substring(14) !== 'no') {
      options.libqExt = true;
    }

    return true;
  });

  return options;
}

/**
 * Test for pre-built library
 *
 * @param {Object} options
 * @api private
 */

function testBinary(options) {
  if (options.force || process.env.Q_FORCE_BUILD) {
    return build(options);
  }

  if (!ext.hasBinary(ext.getBinaryPath())) {
    return build(options);
  }

  console.log('Binary found at', ext.getBinaryPath());
  console.log('Testing binary');

  try {
    require('../').renderSync({
      data: 's { a: ss }'
    });

    console.log('Binary is fine');
  } catch (e) {
    console.log('Binary has a problem:', e);
    console.log('Building the binary locally');

    return build(options);
  }
}

/**
 * Apply arguments and run
 */

testBinary(parseArgs(process.argv.slice(2)));
