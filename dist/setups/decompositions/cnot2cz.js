'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._recognize_cnot = undefined;

var _compute = require('../../meta/compute');

var _gates = require('../../ops/gates');

var _util = require('../../libs/util');

var _shortcuts = require('../../ops/shortcuts');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _decompose_cnot = function _decompose_cnot(cmd) {
  var ctrl = cmd.controlQubits;
  var eng = cmd.engine;
  (0, _compute.Compute)(eng, function () {
    _gates.H.or(cmd.qubits[0]);
  });
  _shortcuts.CZ.or((0, _util.tuple)(ctrl[0], cmd.qubits[0][0]));
  (0, _compute.Uncompute)(eng);
};

/**
 * @ignore
 * @param cmd
 * @return {boolean}
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

// Decompose CNOT gates
var _recognize_cnot = exports._recognize_cnot = function _recognize_cnot(cmd) {
  return cmd.controlCount === 1;
};

exports.default = [new _decompositionrule2.default(_gates.XGate, _decompose_cnot, _recognize_cnot)];