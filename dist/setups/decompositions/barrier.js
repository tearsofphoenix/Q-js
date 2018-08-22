'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._decompose_barrier = _decompose_barrier;
exports._recognize_barrier = _recognize_barrier;

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _gates = require('../../ops/gates');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @ignore
 * @param cmd
 * @private
 */
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

function _decompose_barrier(cmd) {}
// Throw out all barriers if they are not supported.


/**
 * @ignore
 * @param cmd
 * @return {boolean}
 * @private
 */
function _recognize_barrier(cmd) {
  // Recognize all barriers. "
  return true;
}

exports.default = [new _decompositionrule2.default(_gates.BarrierGate, _decompose_barrier, _recognize_barrier)];