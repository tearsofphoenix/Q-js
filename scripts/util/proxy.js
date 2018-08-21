
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

/**
 * Determine the proxy settings configured by npm
 *
 * It's possible to configure npm to use a proxy different
 * from the system defined proxy. This can be done via the
 * `npm config` CLI or the `.npmrc` config file.
 *
 * If a proxy has been configured in this way we must
 * tell request explicitly to use it.
 *
 * Otherwise we can trust request to the right thing.
 *
 * @return string the proxy configured by npm or an empty string
 * @api private
 */
module.exports = function() {
  return process.env.npm_config_https_proxy ||
    process.env.npm_config_proxy ||
    process.env.npm_config_http_proxy ||
    '';
};
