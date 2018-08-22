'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _constantmath = require('./constantmath');

var _control = require('../../meta/control');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _gates = require('./gates');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

function _replace_addconstant(cmd) {
  var eng = cmd.engine;
  var c = cmd.gate.a;
  var quint = cmd.qubits[0];

  (0, _control.Control)(eng, cmd.controlQubits, function () {
    return (0, _constantmath.add_constant)(eng, c, quint);
  });
}

function _replace_addconstmodN(cmd) {
  var eng = cmd.engine;
  var c = cmd.gate.a;
  var N = cmd.gate.N;
  var quint = cmd.qubits[0];

  (0, _control.Control)(eng, cmd.controlQubits, function () {
    return (0, _constantmath.add_constant_modN)(eng, c, N, quint);
  });
}

function _replace_multiplybyconstantmodN(cmd) {
  var eng = cmd.engine;
  var c = cmd.gate.a;
  var N = cmd.gate.N;
  var quint = cmd.qubits[0];

  (0, _control.Control)(eng, cmd.controlQubits, function () {
    return (0, _constantmath.mul_by_constant_modN)(eng, c, N, quint);
  });
}

exports.default = [new _decompositionrule2.default(_gates.AddConstant, _replace_addconstant), new _decompositionrule2.default(_gates.AddConstantModN, _replace_addconstmodN), new _decompositionrule2.default(_gates.MultiplyByConstantModN, _replace_multiplybyconstantmodN)];