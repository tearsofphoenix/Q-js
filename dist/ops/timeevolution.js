'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _basics = require('./basics');

var _qubitoperator = require('./qubitoperator');

var _qubitoperator2 = _interopRequireDefault(_qubitoperator);

var _polyfill = require('../libs/polyfill');

var _gates = require('./gates');

var _error = require('../meta/error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
 * @class TimeEvolution
 * @desc
Gate for time evolution under a Hamiltonian (QubitOperator object).

This gate is the unitary time evolution propagator:
    exp(-i * H * t),
        where H is the Hamiltonian of the system and t is the time. Note that -i
factor is stored implicitely.

    @example

wavefunction = eng.allocateQureg(5)
hamiltonian = 0.5 * QubitOperator("X0 Z1 Y5")
# Apply exp(-i * H * t) to the wavefunction:
    TimeEvolution(time=2.0, hamiltonian=hamiltonian) | wavefunction

Attributes:
    time(float, int): time t
hamiltonian(QubitOperator): hamiltonaian H
 */
var TimeEvolution = function (_BasicGate) {
  _inherits(TimeEvolution, _BasicGate);

  /**
   * @constructor
    Note:
  The hamiltonian must be hermitian and therefore only terms with
    real coefficients are allowed.
    Coefficients are internally converted to float.
      @param {number} time time to evolve under (can be negative).
    @param {QubitOperator} hamiltonian hamiltonian to evolve under.
      @throws {Error} If time is not a numeric type and hamiltonian is not a QubitOperator.
    @throws {NotHermitianOperatorError} If the input hamiltonian is not hermitian (only real coefficients).
   */
  function TimeEvolution(time, hamiltonian) {
    _classCallCheck(this, TimeEvolution);

    var _this = _possibleConstructorReturn(this, (TimeEvolution.__proto__ || Object.getPrototypeOf(TimeEvolution)).call(this));

    if (typeof time !== 'number') {
      throw new Error('time needs to be a (real) numeric type.');
    }

    if (!(hamiltonian instanceof _qubitoperator2.default)) {
      throw new Error('hamiltonian needs to be QubitOperator object.');
    }

    _this.time = time;
    _this.hamiltonian = hamiltonian.copy();
    Object.keys(hamiltonian.terms).forEach(function (term) {
      var item = _this.hamiltonian.terms[term];
      if ((0, _polyfill.isNumeric)(item)) {
        if ((0, _polyfill.isComplex)(item)) {
          if (_mathjs2.default.im(item) === 0) {
            _this.hamiltonian.terms[term] = _mathjs2.default.re(item);
          } else {
            throw new Error('hamiltonian must be ' + 'hermitian and hence only ' + 'have real coefficients.');
          }
        } else {
          _this.hamiltonian.terms[term] = item;
        }
      } else {
        throw new Error('hamiltonian must be ' + 'hermitian and hence only ' + 'have real coefficients.');
      }
    });
    return _this;
  }

  _createClass(TimeEvolution, [{
    key: 'getInverse',
    value: function getInverse() {
      return new TimeEvolution(-this.time, this.hamiltonian);
    }

    /**
    Return self merged with another TimeEvolution gate if possible.
        Two TimeEvolution gates are merged if:
    1) both have the same terms
    2) the proportionality factor for each of the terms
    must have relative error <= 1e-9 compared to the
    proportionality factors of the other terms.
        Note:
    While one could merge gates for which both hamiltonians commute,
      we are not doing this as in general the resulting gate would have
    to be decomposed again.
        Note:
    We are not comparing if terms are proportional to each other with
      an absolute tolerance. It is up to the user to remove terms close
    to zero because we cannot choose a suitable absolute error which
    works for everyone. Use, e.g., a decomposition rule for that.
       @param {TimeEvolution} other TimeEvolution gate
       @throws {NotMergeable} If the other gate is not a TimeEvolution gate or
      hamiltonians are not suitable for merging.
       @return {TimeEvolution} New TimeEvolution gate equivalent to the two merged gates.
     */

  }, {
    key: 'getMerged',
    value: function getMerged(other) {
      var _this2 = this;

      var rel_tol = 1e-9;
      if (!(other instanceof TimeEvolution)) {
        throw new _error.NotMergeable('Cannot merge these two gates.');
      }
      var k1 = Object.keys(this.hamiltonian.terms);
      var k2 = Object.keys(other.hamiltonian.terms);
      if ((0, _polyfill.setEqual)(new Set(k1), new Set(k2))) {
        var factor = void 0;
        Object.keys(this.hamiltonian.terms).forEach(function (term) {
          var v1 = _this2.hamiltonian.terms[term];
          var v2 = other.hamiltonian.terms[term];
          if (typeof factor === 'undefined') {
            factor = _mathjs2.default.divide(v1, v2);
          } else {
            var tmp = _mathjs2.default.divide(v1, v2);
            if (_mathjs2.default.abs(_mathjs2.default.subtract(factor, tmp)) > rel_tol * _mathjs2.default.max(_mathjs2.default.abs(factor), _mathjs2.default.abs(tmp))) {
              throw new _error.NotMergeable('Cannot merge these two gates.');
            }
          }
        });

        var newTime = this.time + other.time / factor;
        return new TimeEvolution(newTime, this.hamiltonian);
      } else {
        throw new _error.NotMergeable('Cannot merge these two gates.');
      }
    }

    /**
    Operator| overload which enables the following syntax:
       @example
    TimeEvolution(...) | qureg
    TimeEvolution(...) | (qureg,)
    TimeEvolution(...) | qubit
    TimeEvolution(...) | (qubit,)
    Unlike other gates, this gate is only allowed to be applied to one
    quantum register or one qubit.
        @example
    wavefunction = eng.allocateQureg(5)
    hamiltonian = QubitOperator("X1 Y3", 0.5)
    TimeEvolution(time=2.0, hamiltonian=hamiltonian) | wavefunction
    While in the above example the TimeEvolution gate is applied to 5
    qubits, the hamiltonian of this TimeEvolution gate acts only
    non-trivially on the two qubits wavefunction[1] and wavefunction[3].
      Therefore, the operator| will rescale the indices in the hamiltonian
    and sends the equivalent of the following new gate to the MainEngine:
       @example
    h = QubitOperator("X0 Y1", 0.5)
    TimeEvolution(2.0, h) | [wavefunction[1], wavefunction[3]]
    which is only a two qubit gate.
        @param {Array.<Qubit>|Qureg|Qubit} qubits one Qubit object, one list of Qubit objects, one Qureg
        object, or a tuple of the former three cases.
    */

  }, {
    key: 'or',
    value: function or(qubits) {
      var _this3 = this;

      // Check that input is only one qureg or one qubit
      qubits = _basics.BasicGate.makeTupleOfQureg(qubits);
      if (qubits.length !== 1) {
        throw new Error('Only one qubit or qureg allowed.');
      }
      // Check that if hamiltonian has only an identity term,
      // apply a global phase
      var keys = Object.keys(this.hamiltonian.terms);
      var v = this.hamiltonian.terms[[]];
      if (keys.length === 1 && typeof v !== 'undefined') {
        new _gates.Ph(_mathjs2.default.multiply(-this.time, v)).or(qubits[0][0]);
        return;
      }
      var num_qubits = qubits[0].length;
      var non_trivial_qubits = new Set();

      keys.forEach(function (key) {
        var term = (0, _qubitoperator.stringToArray)(key);
        term.forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              index = _ref2[0],
              action = _ref2[1];

          non_trivial_qubits.add(index);
        });
      });

      if (Math.max.apply(Math, _toConsumableArray(non_trivial_qubits)) >= num_qubits) {
        throw new Error('hamiltonian acts on more qubits than the gate is applied to.');
      }
      // create new TimeEvolution gate with rescaled qubit indices in
      // this.hamiltonian which are ordered from
      // 0,...,len(non_trivial_qubits) - 1
      var new_index = {};
      non_trivial_qubits = Array.from(non_trivial_qubits).sort();

      non_trivial_qubits.forEach(function (looper, i) {
        new_index[looper] = i;
      });

      var new_hamiltonian = new _qubitoperator2.default();
      (0, _assert2.default)(Object.keys(new_hamiltonian.terms).length === 0, '');

      Object.keys(this.hamiltonian.terms).forEach(function (term) {
        var parts = (0, _qubitoperator.stringToArray)(term);
        var newTerm = parts.map(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
              index = _ref4[0],
              action = _ref4[1];

          return [new_index[index], action];
        });
        new_hamiltonian.terms[newTerm] = _this3.hamiltonian.terms[term];
      });

      var new_gate = new TimeEvolution(this.time, new_hamiltonian);
      var new_qubits = non_trivial_qubits.map(function (looper) {
        return qubits[0][looper];
      });
      // Apply new gate
      var cmd = new_gate.generateCommand(new_qubits);
      cmd.apply();
    }
  }, {
    key: 'equal',
    value: function equal() {
      throw new Error('Not implemented');
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'exp(' + -this.time + 'j * (' + this.hamiltonian + '))';
    }
  }]);

  return TimeEvolution;
}(_basics.BasicGate);

exports.default = TimeEvolution;