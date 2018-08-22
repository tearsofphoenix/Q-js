'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arb1qubit2rzandry = require('./arb1qubit2rzandry');

var _arb1qubit2rzandry2 = _interopRequireDefault(_arb1qubit2rzandry);

var _barrier = require('./barrier');

var _barrier2 = _interopRequireDefault(_barrier);

var _cnot2cz = require('./cnot2cz');

var _cnot2cz2 = _interopRequireDefault(_cnot2cz);

var _carb1qubit2cnotrzandry = require('./carb1qubit2cnotrzandry');

var _carb1qubit2cnotrzandry2 = _interopRequireDefault(_carb1qubit2cnotrzandry);

var _entangle = require('./entangle');

var _entangle2 = _interopRequireDefault(_entangle);

var _globalphase = require('./globalphase');

var _globalphase2 = _interopRequireDefault(_globalphase);

var _ph2r = require('./ph2r');

var _ph2r2 = _interopRequireDefault(_ph2r);

var _toffoli2cnotandtgate = require('./toffoli2cnotandtgate');

var _toffoli2cnotandtgate2 = _interopRequireDefault(_toffoli2cnotandtgate);

var _crz2cxandrz = require('./crz2cxandrz');

var _crz2cxandrz2 = _interopRequireDefault(_crz2cxandrz);

var _cnu2toffoliandcu = require('./cnu2toffoliandcu');

var _cnu2toffoliandcu2 = _interopRequireDefault(_cnu2toffoliandcu);

var _qft2crandhadamard = require('./qft2crandhadamard');

var _qft2crandhadamard2 = _interopRequireDefault(_qft2crandhadamard);

var _r2rzandph = require('./r2rzandph');

var _r2rzandph2 = _interopRequireDefault(_r2rzandph);

var _rx2rz = require('./rx2rz');

var _rx2rz2 = _interopRequireDefault(_rx2rz);

var _ry2rz = require('./ry2rz');

var _ry2rz2 = _interopRequireDefault(_ry2rz);

var _swap2cnot = require('./swap2cnot');

var _swap2cnot2 = _interopRequireDefault(_swap2cnot);

var _time_evolution = require('./time_evolution');

var _time_evolution2 = _interopRequireDefault(_time_evolution);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /*
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


exports.default = [].concat(_toConsumableArray(_arb1qubit2rzandry2.default), _toConsumableArray(_barrier2.default), _toConsumableArray(_carb1qubit2cnotrzandry2.default), _toConsumableArray(_cnot2cz2.default), _toConsumableArray(_cnu2toffoliandcu2.default), _toConsumableArray(_crz2cxandrz2.default), _toConsumableArray(_entangle2.default), _toConsumableArray(_globalphase2.default), _toConsumableArray(_ph2r2.default), _toConsumableArray(_qft2crandhadamard2.default), _toConsumableArray(_r2rzandph2.default), _toConsumableArray(_rx2rz2.default), _toConsumableArray(_ry2rz2.default), _toConsumableArray(_swap2cnot2.default), _toConsumableArray(_time_evolution2.default), _toConsumableArray(_toffoli2cnotandtgate2.default));