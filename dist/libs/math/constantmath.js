'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add_constant = add_constant;
exports.add_constant_modN = add_constant_modN;
exports.mul_by_constant_modN = mul_by_constant_modN;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _compute = require('../../meta/compute');

var _qftgate = require('../../ops/qftgate');

var _gates = require('../../ops/gates');

var _gates2 = require('./gates');

var _util = require('../util');

var _shortcuts = require('../../ops/shortcuts');

var _control = require('../../meta/control');

var _polyfill = require('../polyfill');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @ignore
 * Adds a classical constant c to the quantum integer (qureg) quint using Draper addition.
 * Note: Uses the Fourier-transform adder
 * see https://arxiv.org/abs/quant-ph/0008033
 * @param {BasicEngine} eng
 * @param {number} c
 * @param {Array<Qubit>|Qureg} quint
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

function add_constant(eng, c, quint) {
  (0, _compute.Compute)(eng, function () {
    return _qftgate.QFT.or(quint);
  });

  for (var i = 0; i < quint.length; ++i) {
    for (var j = i; j > -1; j -= 1) {
      if (c >> j & 1) {
        new _gates.R(_mathjs2.default.pi / (1 << i - j)).or(quint[i]);
      }
    }
  }

  (0, _compute.Uncompute)(eng);
}

/**
 * @ignore
 * Modular adder by Beauregard
 * see https://arxiv.org/abs/quant-ph/0205095
Adds a classical constant c to a quantum integer (qureg) quint modulo N
using Draper addition and the construction
 * @param {BasicEngine} eng
 * @param {number} c
 * @param {number} N
 * @param {Array<Qubit>|Qureg} quint
 */
function add_constant_modN(eng, c, N, quint) {
  (0, _assert2.default)(c < N && c >= 0);

  new _gates2.AddConstant(c).or(quint);

  var ancilla = void 0;

  (0, _compute.Compute)(eng, function () {
    (0, _gates2.SubConstant)(N).or(quint);
    ancilla = eng.allocateQubit();
    _shortcuts.CNOT.or((0, _util.tuple)(quint[quint.length - 1], ancilla));
    (0, _control.Control)(eng, ancilla, function () {
      return new _gates2.AddConstant(N).or(quint);
    });
  });

  (0, _gates2.SubConstant)(c).or(quint);

  (0, _compute.CustomUncompute)(eng, function () {
    _gates.X.or(quint[quint.length - 1]);
    _shortcuts.CNOT.or((0, _util.tuple)(quint[quint.length - 1], ancilla));
    _gates.X.or(quint[quint.length - 1]);
    ancilla.deallocate();
  });

  new _gates2.AddConstant(c).or(quint);
}

// calculates the inverse of a modulo N
function inv_mod_N(a, N) {
  var s = 0;
  var old_s = 1;
  var r = N;
  var old_r = a;
  while (r !== 0) {
    var q = Math.floor(old_r / r);
    var tmp = r;
    r = old_r - q * r;
    old_r = tmp;
    tmp = s;
    s = old_s - q * s;
    old_s = tmp;
  }
  return (old_s + N) % N;
}

/**
 * @ignore
 * Modular multiplication by modular addition & shift, followed by uncompute
 https://arxiv.org/abs/quant-ph/0205095
Multiplies a quantum integer by a classical number a modulo N, i.e.,
 ```
  |x> -> |a*x mod N>
 ```
(only works if a and N are relative primes, otherwise the modular inverse does not exist).
 */
function mul_by_constant_modN(eng, c, N, quint_in) {
  (0, _assert2.default)(c < N && c >= 0);
  (0, _assert2.default)(_mathjs2.default.gcd(c, N) === 1);

  var n = (0, _polyfill.len)(quint_in);
  var quint_out = eng.allocateQureg(n + 1);

  var _loop = function _loop(i) {
    (0, _control.Control)(eng, quint_in[i], function () {
      return new _gates2.AddConstantModN((c << i) % N, N).or(quint_out);
    });
  };

  for (var i = 0; i < n; ++i) {
    _loop(i);
  }

  for (var i = 0; i < n; ++i) {
    _gates.Swap.or((0, _util.tuple)(quint_out[i], quint_in[i]));
  }

  var cinv = inv_mod_N(c, N);

  var _loop2 = function _loop2(_i) {
    (0, _control.Control)(eng, quint_in[_i], function () {
      return (0, _gates2.SubConstantModN)((cinv << _i) % N, N).or(quint_out);
    });
  };

  for (var _i = 0; _i < n; ++_i) {
    _loop2(_i);
  }

  quint_out.deallocate();
}