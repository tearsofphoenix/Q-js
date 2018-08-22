'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEngineList = getEngineList;

var _decompositionruleset = require('../cengines/replacer/decompositionruleset');

var _decompositionruleset2 = _interopRequireDefault(_decompositionruleset);

var _tagremover = require('../cengines/tagremover');

var _tagremover2 = _interopRequireDefault(_tagremover);

var _decompositions = require('./decompositions');

var _decompositions2 = _interopRequireDefault(_decompositions);

var _optimize = require('../cengines/optimize');

var _optimize2 = _interopRequireDefault(_optimize);

var _replacer = require('../cengines/replacer/replacer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 * @return {BasicEngine[]}
 */
function getEngineList() {
  var rule_set = new _decompositionruleset2.default(_decompositions2.default);
  return [new _tagremover2.default(), new _optimize2.default(10), new _replacer.AutoReplacer(rule_set), new _tagremover2.default(), new _optimize2.default(10)];
} /*
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