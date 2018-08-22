'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Toffoli = exports.CZ = exports.CX = exports.CNOT = undefined;
exports.CRz = CRz;

var _metagates = require('./metagates');

var _gates = require('./gates');

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

function CRz(angle) {
  return (0, _metagates.C)(new _gates.Rz(angle), 1);
}

var CNOT = exports.CNOT = (0, _metagates.C)(_gates.NOT);

var CX = exports.CX = CNOT;

var CZ = exports.CZ = (0, _metagates.C)(_gates.Z);

var Toffoli = exports.Toffoli = (0, _metagates.C)(CNOT);