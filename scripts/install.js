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
const eol = require('os').EOL;
const mkdir = require('mkdirp');
const path = require('path');
const request = require('request');
const log = require('npmlog');
const pq = require('./extensions');

const downloadOptions = require('./util/downloadoptions');

/**
 * Download file, if succeeds save, if not delete
 *
 * @param string url
 * @param string dest
 * @param {function} cb
 * @api private
 */

function download(url, dest, cb) {
  const reportError = function (err) {
    let timeoutMessge;

    if (err.code === 'ETIMEDOUT') {
      if (err.connect === true) {
        // timeout is hit while your client is attempting to establish a connection to a remote machine
        timeoutMessge = 'Timed out attemping to establish a remote connection';
      } else {
        timeoutMessge = 'Timed out whilst downloading the prebuilt binary';
        // occurs any time the server is too slow to send back a part of the response
      }
    }
    cb(['Cannot download "', url, '": ', eol, eol,
      typeof err.message === 'string' ? err.message : err, eol, eol,
      timeoutMessge ? timeoutMessge + eol + eol : timeoutMessge,
      'Hint: If github.com is not accessible in your location', eol,
      '      try setting a proxy via HTTP_PROXY, e.g. ', eol, eol,
      '      export HTTP_PROXY=http://example.com:1234', eol, eol,
      'or configure npm proxy via', eol, eol,
      '      npm config set proxy http://example.com:8080'].join(''));
  };

  const successful = function (response) {
    return response.statusCode >= 200 && response.statusCode < 300;
  };

  console.log('Downloading binary from', url);

  try {
    request(url, downloadOptions(), (err, response, buffer) => {
      if (err) {
        reportError(err);
      } else if (!successful(response)) {
        reportError(['HTTP error', response.statusCode, response.statusMessage].join(' '));
      } else {
        console.log('Download complete');

        if (successful(response)) {
          fs.createWriteStream(dest)
            .on('error', cb)
            .end(buffer, cb);
        } else {
          cb();
        }
      }
    })
      .on('response', (response) => {
        const length = parseInt(response.headers['content-length'], 10);
        const progress = log.newItem('', length);

        // The `progress` is true by default. However if it has not
        // been explicitly set it's `undefined` which is considered
        // as far as npm is concerned.
        if (process.env.npm_config_progress === 'true') {
          log.enableProgress();

          response.on('data', (chunk) => {
            progress.completeWork(chunk.length);
          })
            .on('end', progress.finish);
        }
      });
  } catch (err) {
    cb(err);
  }
}

/**
 * Check and download binary
 *
 * @api private
 */

function checkAndDownloadBinary() {
  if (process.env.SKIP_PROJECTQ_BINARY_DOWNLOAD_FOR_CI) {
    console.log('Skipping downloading binaries on CI builds');
    return;
  }

  let cachedBinary = pq.getCachedBinary();

  const cachePath = pq.getBinaryCachePath();

  const binaryPath = pq.getBinaryPath();

  if (pq.hasBinary(binaryPath)) {
    console.log('projectq build', 'Binary found at', binaryPath);
    return;
  }

  try {
    mkdir.sync(path.dirname(binaryPath));
  } catch (err) {
    console.error('Unable to save binary', path.dirname(binaryPath), ':', err);
    return;
  }

  if (cachedBinary) {
    console.log('Cached binary found at', cachedBinary);
    fs.createReadStream(cachedBinary).pipe(fs.createWriteStream(binaryPath));
    return;
  }

  download(pq.getBinaryUrl(), binaryPath, (err) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log('Binary saved to', binaryPath);

    cachedBinary = path.join(cachePath, pq.getBinaryName());

    if (cachePath) {
      console.log('Caching binary to', cachedBinary);

      try {
        mkdir.sync(path.dirname(cachedBinary));
        fs.createReadStream(binaryPath)
          .pipe(fs.createWriteStream(cachedBinary))
          .on('error', (err) => {
            console.log('Failed to cache binary:', err);
          });
      } catch (err) {
        console.log('Failed to cache binary:', err);
      }
    }
  });
}

/**
 * If binary does not exist, download it
 */

checkAndDownloadBinary();
