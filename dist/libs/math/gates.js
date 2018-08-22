'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MultiplyByConstantModN = exports.AddConstantModN = exports.AddConstant = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.SubConstant = SubConstant;
exports.SubConstantModN = SubConstantModN;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _basics = require('../../ops/basics');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
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
 * @class AddConstant
 * @desc
Add a constant to a quantum number represented by a quantum register,
    stored from low- to high-bit.

    @example

qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[1] # qunum is now equal to 2
AddConstant(3) | qunum # qunum is now equal to 5
 */
var AddConstant = exports.AddConstant = function (_BasicMathGate) {
  _inherits(AddConstant, _BasicMathGate);

  /**
  Initializes the gate to the number to add.
      @param {number} a Number to add to a quantum register.
      It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  function AddConstant(a) {
    _classCallCheck(this, AddConstant);

    var _this = _possibleConstructorReturn(this, (AddConstant.__proto__ || Object.getPrototypeOf(AddConstant)).call(this, function (x) {
      return [x + a];
    }));

    _this.a = a;
    return _this;
  }

  _createClass(AddConstant, [{
    key: 'getInverse',
    value: function getInverse() {
      return SubConstant(this.a);
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'AddConstant(' + this.a + ')';
    }
  }, {
    key: 'equal',
    value: function equal(other) {
      return other instanceof AddConstant && other.a === this.a;
    }
  }]);

  return AddConstant;
}(_basics.BasicMathGate);

/**
Subtract a constant from a quantum number represented by a quantum
register, stored from low- to high-bit.

    @param {number} a Constant to subtract

    @example

qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[2] # qunum is now equal to 4
SubConstant(3) | qunum # qunum is now equal to 1
 */


function SubConstant(a) {
  return new AddConstant(-a);
}

/**
 * @class AddConstantModN
 * @desc
Add a constant to a quantum number represented by a quantum register
modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

    @example

qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[1] # qunum is now equal to 2
AddConstantModN(3, 4) | qunum # qunum is now equal to 1
 */

var AddConstantModN = exports.AddConstantModN = function (_BasicMathGate2) {
  _inherits(AddConstantModN, _BasicMathGate2);

  /**
   * @constructor
  Initializes the gate to the number to add modulo N.
      @param {number} a Number to add to a quantum register (0 <= a < N).
    @param {number} N Number modulo which the addition is carried out.
      It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  function AddConstantModN(a, N) {
    _classCallCheck(this, AddConstantModN);

    var _this2 = _possibleConstructorReturn(this, (AddConstantModN.__proto__ || Object.getPrototypeOf(AddConstantModN)).call(this, function (x) {
      return [_mathjs2.default.mod(x + a, N)];
    }));

    _this2.a = a;
    _this2.N = N;
    return _this2;
  }

  _createClass(AddConstantModN, [{
    key: 'toString',
    value: function toString() {
      return 'AddConstantModN(' + this.a + ', ' + this.N + ')';
    }
  }, {
    key: 'getInverse',
    value: function getInverse() {
      return SubConstantModN(this.a, this.N);
    }
  }, {
    key: 'equal',
    value: function equal(other) {
      return other instanceof AddConstantModN && other.a === this.a && other.N === this.N;
    }
  }]);

  return AddConstantModN;
}(_basics.BasicMathGate);

/**
Subtract a constant from a quantum number represented by a quantum
register modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

 @param {number} a Constant to add
 @param {number} N Constant modulo which the addition of a should be carried out.

    @example

qunum = eng.allocateQureg(3) # 3-qubit number
X | qunum[1] # qunum is now equal to 2
SubConstantModN(4,5) | qunum # qunum is now -2 = 6 = 1 (mod 5)
 */


function SubConstantModN(a, N) {
  return new AddConstantModN(N - a, N);
}

/**
 * @class MultiplyByConstantModN
 * @desc
Multiply a quantum number represented by a quantum register by a constant
modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

    @example
qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[2] # qunum is now equal to 4
MultiplyByConstantModN(3,5) | qunum # qunum is now 2.
 */

var MultiplyByConstantModN = exports.MultiplyByConstantModN = function (_BasicMathGate3) {
  _inherits(MultiplyByConstantModN, _BasicMathGate3);

  /**
   * @constructor
  Initializes the gate to the number to multiply with modulo N.
     @param {number} a Number by which to multiply a quantum register (0 <= a < N).
   @param {number} N Number modulo which the multiplication is carried out.
      It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  function MultiplyByConstantModN(a, N) {
    _classCallCheck(this, MultiplyByConstantModN);

    var _this3 = _possibleConstructorReturn(this, (MultiplyByConstantModN.__proto__ || Object.getPrototypeOf(MultiplyByConstantModN)).call(this, function (x) {
      return [a * x % N];
    }));

    _this3.a = a;
    _this3.N = N;
    return _this3;
  }

  _createClass(MultiplyByConstantModN, [{
    key: 'toString',
    value: function toString() {
      return 'MultiplyByConstantModN(' + this.a + ', ' + this.N + ')';
    }
  }, {
    key: 'equal',
    value: function equal(other) {
      return other instanceof MultiplyByConstantModN && other.a === this.a && other.N === this.N;
    }
  }]);

  return MultiplyByConstantModN;
}(_basics.BasicMathGate);