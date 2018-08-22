'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.All = exports.Tensor = exports.ControlledGate = exports.DaggeredGate = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.C = C;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _basics = require('./basics');

var _control = require('../meta/control');

var _cycle = require('./_cycle');

var _cycle2 = _interopRequireDefault(_cycle);

var _util = require('../libs/util');

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
* Contains meta gates, i.e.,
* DaggeredGate (Represents the inverse of an arbitrary gate)
* ControlledGate (Represents a controlled version of an arbitrary gate)
* Tensor/All (Applies a single qubit gate to all supplied qubits), e.g.,
    @example

Tensor(H) | (qubit1, qubit2) # apply H to qubit #1 and #2

As well as the meta functions
* getInverse (Tries to access the getInverse member function of a gate
and upon failure returns a DaggeredGate)
* C (Creates an n-ary controlled version of an arbitrary gate)
*/


/**
 * @class DaggeredGate
 * @desc
Wrapper class allowing to execute the inverse of a gate, even when it does
not define one.

    If there is a replacement available, then there is also one for the
    inverse, namely the replacement function run in reverse, while inverting
    all gates. This class enables using this emulation automatically.

    A DaggeredGate is returned automatically when employing the getInverse-
function on a gate which does not provide a getInverse() member function.

@example

with Dagger(eng)
MySpecialGate | qubits

will create a DaggeredGate if MySpecialGate does not implement
getInverse. If there is a decomposition function available, an auto-
replacer engine can automatically replace the inverted gate by a call to
the decomposition function inside a "with Dagger"-statement.
 */
var DaggeredGate = exports.DaggeredGate = function (_BasicGate) {
  _inherits(DaggeredGate, _BasicGate);

  /**
   * @constructor
    Initialize a DaggeredGate representing the inverse of the gate 'gate'.
      @param {BasicGate} gate Any gate object of which to represent the inverse.
     */
  function DaggeredGate(gate) {
    _classCallCheck(this, DaggeredGate);

    var _this = _possibleConstructorReturn(this, (DaggeredGate.__proto__ || Object.getPrototypeOf(DaggeredGate)).call(this));

    _this.gate = gate;
    try {
      _this._matrix = _mathjs2.default.ctranspose(gate.matrix);
    } catch (e) {}
    return _this;
  }

  _createClass(DaggeredGate, [{
    key: 'getInverse',
    value: function getInverse() {
      return this.gate;
    }
  }, {
    key: 'equal',


    /**
      Return true if self is equal to other, i.e., same type and representing the inverse of the same gate.
    */
    value: function equal(other) {
      return other instanceof DaggeredGate && other.gate.equal(this.gate);
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.gate.toString() + '^\\dagger';
    }
  }, {
    key: 'texString',
    value: function texString() {
      if (this.gate.texString) {
        return '$' + this.gate.texString() + '^\\dagger$';
      } else {
        return '$' + this.gate.toString() + '^\\dagger$';
      }
    }
  }, {
    key: 'matrix',
    get: function get() {
      if (!this._matrix) {
        throw new Error('No this attribute');
      }
      return this._matrix;
    }
  }]);

  return DaggeredGate;
}(_basics.BasicGate);

_cycle2.default.add('DaggeredGate', DaggeredGate);

/**
 * @class ControlledGate
 * @desc
Controlled version of a gate.

    Note:
Use the meta function :func:`C()` to create a controlled gate

A wrapper class which enables (multi-) controlled gates. It overloads
the __or__-operator, using the first qubits provided as control qubits.
    The n control-qubits need to be the first n qubits. They can be in
separate quregs.

    @example

ControlledGate(gate, 2) | (qb0, qb2, qb3) # qb0 & qb2 are controls
C(gate, 2) | (qb0, qb2, qb3) # This is much nicer.
C(gate, 2) | ([qb0,qb2], qb3) # Is equivalent

Note:
    Use :func:`C` rather than ControlledGate, i.e.,

 @example

C(X, 2) == Toffoli
 */

var ControlledGate = exports.ControlledGate = function (_BasicGate2) {
  _inherits(ControlledGate, _BasicGate2);

  /**
   * @constructor
    @param {BasicGate} gate Gate to wrap.
    @param {number} n Number of control qubits.
  */
  function ControlledGate(gate) {
    var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

    _classCallCheck(this, ControlledGate);

    var _this2 = _possibleConstructorReturn(this, (ControlledGate.__proto__ || Object.getPrototypeOf(ControlledGate)).call(this));

    if (gate instanceof ControlledGate) {
      _this2.gate = gate.gate;
      _this2.n = gate.n + n;
    } else {
      _this2.gate = gate;
      _this2.n = n;
    }
    return _this2;
  }

  _createClass(ControlledGate, [{
    key: 'getInverse',
    value: function getInverse() {
      return new ControlledGate((0, _cycle.getInverse)(this.gate), this.n);
    }

    /**
      Apply the controlled gate to qubits, using the first n qubits as
    controls.
        Note: The control qubits can be split across the first quregs.
      However, the n-th control qubit needs to be the last qubit in a
    qureg. The following quregs belong to the gate.
        @param {Array.<Qureg>} qubits qubits to which to apply the gate.
       */

  }, {
    key: 'or',
    value: function or(qubits) {
      var _this3 = this;

      qubits = _basics.BasicGate.makeTupleOfQureg(qubits);
      var ctrl = [];
      var gateQuregs = [];
      var addingToControls = true;
      qubits.forEach(function (reg) {
        if (addingToControls) {
          ctrl = ctrl.concat(reg);
          addingToControls = ctrl.length < _this3.n;
        } else {
          gateQuregs.push(reg);
        }
      });

      // Test that there were enough control quregs and that that
      // the last control qubit was the last qubit in a qureg.
      if (ctrl.length !== this.n) {
        throw new Error('Wrong number of control qubits. ' + 'First qureg(s) need to contain exactly ' + 'the required number of control quregs.');
      }

      (0, _control.Control)(gateQuregs[0][0].engine, ctrl, function () {
        return _this3.gate.or(gateQuregs);
      });
    }
  }, {
    key: 'toString',
    value: function toString() {
      var prefix = '';
      for (var i = 0; i < this.n; ++i) {
        prefix += 'C';
      }
      return '' + prefix + this.gate.toString();
    }
  }, {
    key: 'equal',
    value: function equal(other) {
      if (other instanceof this.__proto__.constructor) {
        return this.gate.equal(other.gate) && this.n === other.n;
      }
      return false;
    }
  }]);

  return ControlledGate;
}(_basics.BasicGate);

/**
Return n-controlled version of the provided gate.

    @param {BasicGate} gate Gate to turn into its controlled version
    @param {number} n Number of controls (default: 1)

@example

C(NOT) | (c, q) # equivalent to CNOT | (c, q)
 */


function C(gate) {
  var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

  return new ControlledGate(gate, n);
}

/**
 * @class Tensor
 * @desc
Wrapper class allowing to apply a (single-qubit) gate to every qubit in a
quantum register. Allowed syntax is to supply either a qureg or a tuple
which contains only one qureg.

    @example

Tensor(H) | x # applies H to every qubit in the list of qubits x
Tensor(H) | (x,) # alternative to be consistent with other syntax
 */

var Tensor = exports.Tensor = function (_BasicGate3) {
  _inherits(Tensor, _BasicGate3);

  /**
   * @constructor
   * @param {BasicGate} gate
   */
  function Tensor(gate) {
    _classCallCheck(this, Tensor);

    var _this4 = _possibleConstructorReturn(this, (Tensor.__proto__ || Object.getPrototypeOf(Tensor)).call(this));

    _this4.gate = gate;
    return _this4;
  }

  _createClass(Tensor, [{
    key: 'getInverse',
    value: function getInverse() {
      return new Tensor((0, _cycle.getInverse)(this.gate));
    }
  }, {
    key: 'or',
    value: function or(qubits) {
      var _this5 = this;

      var isTuple = (0, _util.arrayIsTuple)(qubits);
      var array = null;
      if (isTuple) {
        if (qubits.length !== 1) {
          throw new Error('wrong length');
        }
        array = qubits[0];
      } else {
        array = qubits;
      }
      if (!Array.isArray(array)) {
        throw new Error('should be array type!');
      }
      array.forEach(function (q) {
        return _this5.gate.or(q);
      });
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'Tensor(' + this.gate.toString() + ')';
    }
  }]);

  return Tensor;
}(_basics.BasicGate);

var All = exports.All = Tensor;