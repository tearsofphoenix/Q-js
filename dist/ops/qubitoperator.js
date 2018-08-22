'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PAULI_OPERATOR_PRODUCTS = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _PAULI_OPERATOR_PRODU;

exports.stringToArray = stringToArray;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _polyfill = require('../libs/polyfill');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /*
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

// QubitOperator stores a sum of Pauli operators acting on qubits."""


var mc = _mathjs2.default.complex;

var EQ_TOLERANCE = 1e-12;

/**
 * Define products of all Pauli operators for symbolic multiplication.
 * @ignore
 */
var PAULI_OPERATOR_PRODUCTS = exports.PAULI_OPERATOR_PRODUCTS = (_PAULI_OPERATOR_PRODU = {}, _defineProperty(_PAULI_OPERATOR_PRODU, ['I', 'I'], [1.0, 'I']), _defineProperty(_PAULI_OPERATOR_PRODU, ['I', 'X'], [1.0, 'X']), _defineProperty(_PAULI_OPERATOR_PRODU, ['X', 'I'], [1.0, 'X']), _defineProperty(_PAULI_OPERATOR_PRODU, ['I', 'Y'], [1.0, 'Y']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Y', 'I'], [1.0, 'Y']), _defineProperty(_PAULI_OPERATOR_PRODU, ['I', 'Z'], [1.0, 'Z']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Z', 'I'], [1.0, 'Z']), _defineProperty(_PAULI_OPERATOR_PRODU, ['X', 'X'], [1.0, 'I']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Y', 'Y'], [1.0, 'I']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Z', 'Z'], [1.0, 'I']), _defineProperty(_PAULI_OPERATOR_PRODU, ['X', 'Y'], [mc(0, 1), 'Z']), _defineProperty(_PAULI_OPERATOR_PRODU, ['X', 'Z'], [mc(0, -1), 'Y']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Y', 'X'], [mc(0, -1), 'Z']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Y', 'Z'], [mc(0, 1), 'X']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Z', 'X'], [mc(0, 1), 'Y']), _defineProperty(_PAULI_OPERATOR_PRODU, ['Z', 'Y'], [mc(0, -1), 'X']), _PAULI_OPERATOR_PRODU);

/**
 * @ignore
 * @param {string} key
 * @return {Array}
 */
function stringToArray(key) {
  var parts = key.split(',').filter(function (item) {
    return item.length > 0;
  });
  if (parts.length % 2 === 0) {
    var result = [];
    for (var i = 0; i < parts.length; i += 2) {
      result.push([parseInt(parts[i], 10), parts[i + 1]]);
    }
    return result;
  } else {
    throw new Error('invalid key ' + key);
  }
}

function checkTerm(term) {
  term.forEach(function (localOperator) {
    if (!Array.isArray(localOperator) || localOperator.length !== 2) {
      throw new Error('term specified incorrectly');
    }

    var _localOperator = _slicedToArray(localOperator, 2),
        qubitNum = _localOperator[0],
        action = _localOperator[1];

    if (typeof action !== 'string' || 'XYZ'.indexOf(action) === -1) {
      throw new Error('Invalid action provided: must be string \'X\', \'Y\', or \'Z\'.');
    }
    if (typeof qubitNum !== 'number' || qubitNum < 0) {
      throw new Error('Invalid qubit number ' + 'provided to QubitTerm: ' + 'must be a non-negative ' + 'int.');
    }
  });
}

/**
 * @class QubitOperator
 * @desc
A sum of terms acting on qubits, e.g., 0.5 * 'X0 X5' + 0.3 * 'Z1 Z2'.

    A term is an operator acting on n qubits and can be represented as:

coefficent * local_operator[0] x ... x local_operator[n-1]

where x is the tensor product. A local operator is a Pauli operator
('I', 'X', 'Y', or 'Z') which acts on one qubit. In math notation a term
is, for example, 0.5 * 'X0 X5', which means that a Pauli X operator acts
on qubit 0 and 5, while the identity operator acts on all other qubits.

    A QubitOperator represents a sum of terms acting on qubits and overloads
operations for easy manipulation of these objects by the user.

    Note for a QubitOperator to be a Hamiltonian which is a hermitian
operator, the coefficients of all terms must be real.

 @example

hamiltonian = 0.5 * QubitOperator('X0 X5') + 0.3 * QubitOperator('Z0')

Attributes:
    terms (dict): **key**: A term represented by a tuple containing all
non-trivial local Pauli operators ('X', 'Y', or 'Z').
A non-trivial local Pauli operator is specified by a
tuple with the first element being an integer
indicating the qubit on which a non-trivial local
operator acts and the second element being a string,
    either 'X', 'Y', or 'Z', indicating which non-trivial
Pauli operator acts on that qubit. Examples:
((1, 'X'),) or ((1, 'X'), (4,'Z')) or the identity ().
    The tuples representing the non-trivial local terms
are sorted according to the qubit number they act on,
    starting from 0.
**value**: Coefficient of this term as a (complex) float
 */

var QubitOperator = function () {
  /**
   * @constructor
    The init function only allows to initialize one term. Additional terms
  have to be added using += (which is fast) or using + of two
  QubitOperator objects:
      @example
  ham = ((QubitOperator('X0 Y3', 0.5)
    + 0.6 * QubitOperator('X0 Y3')))
  # Equivalently
  ham2 = QubitOperator('X0 Y3', 0.5)
  ham2 += 0.6 * QubitOperator('X0 Y3')
  Note:
    Adding terms to QubitOperator is faster using += (as this is done
  by in-place addition). Specifying the coefficient in the __init__
  is faster than by multiplying a QubitOperator with a scalar as
  calls an out-of-place multiplication.
      @param {number|Complex} coefficient The coefficient of the
  first term of this QubitOperator. Default is 1.0.
    @param {Array.<Array>|string} term (optional, empy array, a array of arrays, or a string):
  1) Default is None which means there are no terms in the
  QubitOperator hence it is the "zero" Operator
  2) An empty tuple means there are no non-trivial Pauli
  operators acting on the qubits hence only identities
  with a coefficient (which by default is 1.0).
  3) A sorted tuple of tuples. The first element of each tuple
  is an integer indicating the qubit on which a non-trivial
  local operator acts, starting from zero. The second element
  of each tuple is a string, either 'X', 'Y' or 'Z',
    indicating which local operator acts on that qubit.
  4) A string of the form 'X0 Z2 Y5', indicating an X on
  qubit 0, Z on qubit 2, and Y on qubit 5. The string should
  be sorted by the qubit number. '' is the identity.
      @throws {QubitOperatorError} Invalid operators provided to QubitOperator.
     */
  function QubitOperator(term) {
    var coefficient = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;

    _classCallCheck(this, QubitOperator);

    // assert coefficient as numeric
    this.terms = {};
    if (!(0, _polyfill.isNumeric)(coefficient)) {
      throw new Error('Coefficient must be a numeric type.');
    }

    if (typeof term === 'undefined') {
      // leave it empty
    } else if (Array.isArray(term)) {
      if (term.length === 0) {
        this.terms[[]] = coefficient;
      } else {
        checkTerm(term);
        term = term.sort(function (a, b) {
          return a[0] - b[0];
        });
        this.terms[term] = coefficient;
      }
    } else if (typeof term === 'string') {
      var listOPs = [];
      var parts = term.split(/\s+/).filter(function (item) {
        return item.length > 0;
      });
      parts.forEach(function (el) {
        if (el.length < 2) {
          throw new Error('term specified incorrectly.');
        }
        listOPs.push([parseInt(el.substring(1), 10), el[0]]);
      });

      checkTerm(listOPs);

      term = listOPs.sort(function (a, b) {
        return a[0] - b[0];
      });
      this.terms[term] = coefficient;
    } else {
      throw new Error('term specified incorrectly.');
    }
  }

  /**
    Eliminates all terms with coefficients close to zero and removes
  imaginary parts of coefficients that are close to zero.
      @param {number} absTolerance Absolute tolerance, must be at least 0.0
     */


  _createClass(QubitOperator, [{
    key: 'compress',
    value: function compress() {
      var _this = this;

      var absTolerance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1e-12;

      var new_terms = {};
      Object.keys(this.terms).forEach(function (key) {
        var coeff = _this.terms[key];
        if (_mathjs2.default.abs(_mathjs2.default.im(coeff)) <= absTolerance) {
          coeff = _mathjs2.default.re(coeff);
        }
        if (_mathjs2.default.abs(coeff) > absTolerance) {
          new_terms[key] = coeff;
        }
      });
      this.terms = new_terms;
    }

    /**
      Returns true if other (QubitOperator) is close to this.
        Comparison is done for each term individually. Return true
    if the difference between each term in self and other is
    less than the relative tolerance w.r.t. either other or self
    (symmetric test) or if the difference is less than the absolute
    tolerance.
        @param {QubitOperator} other QubitOperator to compare against.
      @param {number} realTolerance Relative tolerance, must be greater than 0.0
      @param {number} absTolerance Absolute tolerance, must be at least 0.0
    */

  }, {
    key: 'isClose',
    value: function isClose(other) {
      var realTolerance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : EQ_TOLERANCE;
      var absTolerance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : EQ_TOLERANCE;

      // terms which are in both
      var otherKeys = new Set(Object.keys(other.terms));
      var myKeys = Object.keys(this.terms);
      var intersection = new Set(myKeys.filter(function (x) {
        return otherKeys.has(x);
      }));
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = intersection[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var term = _step.value;

          var a = this.terms[term];
          var b = other.terms[term];
          //
          var tmp = _mathjs2.default.multiply(realTolerance, _mathjs2.default.max(_mathjs2.default.abs(a), _mathjs2.default.abs(b)));
          if (_mathjs2.default.abs(_mathjs2.default.subtract(a, b)) > _mathjs2.default.max(tmp, absTolerance)) {
            return false;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var diff = (0, _polyfill.symmetricDifference)(new Set(myKeys), otherKeys);
      // terms only in one (compare to 0.0 so only abs_tol)
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = diff[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _term = _step2.value;

          var value = this.terms[_term];
          if (typeof value !== 'undefined') {
            if (_mathjs2.default.abs(value) > absTolerance) {
              return false;
            }
          } else if (_mathjs2.default.abs(other.terms[_term]) > absTolerance) {
            return false;
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return true;
    }

    /**
      In-place multiply (*=) terms with scalar or QubitOperator.
      @param {Complex|number|QubitOperator} multiplier
    */

  }, {
    key: 'imul',
    value: function imul(multiplier) {
      var _this2 = this;

      // Handle QubitOperator.
      if (multiplier instanceof QubitOperator) {
        var result_terms = {};
        Object.keys(this.terms).forEach(function (left_term) {
          var leftKey = stringToArray(left_term);
          Object.keys(multiplier.terms).forEach(function (right_term) {
            var new_coefficient = _mathjs2.default.multiply(_this2.terms[left_term], multiplier.terms[right_term]);
            // Loop through local operators and create new sorted list
            // of representing the product local operator
            var product_operators = [];
            var left_operator_index = 0;
            var right_operator_index = 0;
            var rightKey = stringToArray(right_term);
            var n_operators_left = leftKey.length;
            var n_operators_right = rightKey.length;

            while (left_operator_index < n_operators_left && right_operator_index < n_operators_right) {
              var _leftKey$left_operato = _slicedToArray(leftKey[left_operator_index], 2),
                  left_qubit = _leftKey$left_operato[0],
                  left_loc_op = _leftKey$left_operato[1];

              var _rightKey$right_opera = _slicedToArray(rightKey[right_operator_index], 2),
                  right_qubit = _rightKey$right_opera[0],
                  right_loc_op = _rightKey$right_opera[1];

              // Multiply local operators acting on the same qubit


              if (left_qubit === right_qubit) {
                left_operator_index += 1;
                right_operator_index += 1;

                var _PAULI_OPERATOR_PRODU2 = _slicedToArray(PAULI_OPERATOR_PRODUCTS[[left_loc_op, right_loc_op]], 2),
                    scalar = _PAULI_OPERATOR_PRODU2[0],
                    loc_op = _PAULI_OPERATOR_PRODU2[1];

                // Add new term.


                if (loc_op !== 'I') {
                  product_operators.push([left_qubit, loc_op]);
                  new_coefficient = _mathjs2.default.multiply(new_coefficient, scalar);
                }
                // Note if loc_op == 'I', then scalar == 1.0

                // If left_qubit > right_qubit, add right_loc_op; else,
                // add left_loc_op.
              } else if (left_qubit > right_qubit) {
                product_operators.push([right_qubit, right_loc_op]);
                right_operator_index += 1;
              } else {
                product_operators.push([left_qubit, left_loc_op]);
                left_operator_index += 1;
              }
            }

            // Finish the remainding operators
            if (left_operator_index === n_operators_left) {
              product_operators = product_operators.concat(rightKey.slice(right_operator_index));
            } else if (right_operator_index === n_operators_right) {
              product_operators = product_operators.concat(leftKey.slice(left_operator_index));
            }

            // Add to result dict
            var tmp_key = product_operators;
            if (tmp_key in result_terms) {
              result_terms[tmp_key] = _mathjs2.default.add(result_terms[tmp_key], new_coefficient);
            } else {
              result_terms[tmp_key] = new_coefficient;
            }
          });
        });
        this.terms = result_terms;
        return this;
      } else // Handle scalars.
        if ((0, _polyfill.isNumeric)(multiplier)) {
          Object.keys(this.terms).forEach(function (key) {
            _this2.terms[key] = _mathjs2.default.multiply(_this2.terms[key], multiplier);
          });
          return this;
        } else {
          throw new Error('Cannot in-place multiply term of invalid type ' + 'to QubitTerm.');
        }
    }

    /**
    Return self * multiplier for a scalar, or a QubitOperator.
        @param {Complex|number|QubitOperator} multiplier A scalar, or a QubitOperator.
        @return {QubitOperator}
        @throws {Error} Invalid type cannot be multiply with QubitOperator.
     */

  }, {
    key: 'mul',
    value: function mul(multiplier) {
      if ((0, _polyfill.isNumeric)(multiplier) || multiplier instanceof QubitOperator) {
        var product = this.copy();
        return product.imul(multiplier);
      }
      throw new Error('Object of invalid type cannot multiply with QubitOperator.');
    }

    /**
     * in-Place add
     * @param {Complex|number|QubitOperator} addend
     * @return {QubitOperator}
     */

  }, {
    key: 'iadd',
    value: function iadd(addend) {
      var _this3 = this;

      if (addend instanceof QubitOperator) {
        Object.keys(addend.terms).forEach(function (key) {
          var value = _this3.terms[key];
          var ov = addend.terms[key];
          if (typeof value !== 'undefined') {
            var tmp = _mathjs2.default.add(ov, value);
            if (_mathjs2.default.abs(tmp) > 0) {
              _this3.terms[key] = tmp;
            } else {
              delete _this3.terms[key];
            }
          } else {
            _this3.terms[key] = ov;
          }
        });
      } else {
        throw new Error('Cannot add invalid type to QubitOperator.');
      }
      return this;
    }

    /**
     *
     * @param {Complex|number|QubitOperator} addend
     * @return {QubitOperator}
     */

  }, {
    key: 'add',
    value: function add(addend) {
      var inst = this.copy();
      inst.iadd(addend);
      return inst;
    }
  }, {
    key: 'div',
    value: function div(divisor) {
      if ((0, _polyfill.isNumeric)(divisor)) {
        return this.mul(_mathjs2.default.divide(1.0, divisor));
      } else {
        throw new Error('Cannot divide QubitOperator by non-scalar type.');
      }
    }

    /**
     * in-Place dived by divisor
     * @param {(Complex|number|QubitOperator)} divisor
    * @return {QubitOperator}
     */

  }, {
    key: 'idiv',
    value: function idiv(divisor) {
      if ((0, _polyfill.isNumeric)(divisor)) {
        return this.imul(_mathjs2.default.divide(1.0, divisor));
      } else {
        throw new Error('Cannot divide QubitOperator by non-scalar type.');
      }
    }

    /**
     * in-Place subtract
     * @param {Complex|number|QubitOperator} subtrahend
     * @return {QubitOperator}
     */

  }, {
    key: 'isub',
    value: function isub(subtrahend) {
      var _this4 = this;

      if (subtrahend instanceof QubitOperator) {
        Object.keys(subtrahend.terms).forEach(function (key) {
          var ov = subtrahend.terms[key];
          var v = _this4.terms[key];
          if (typeof v !== 'undefined') {
            if (_mathjs2.default.abs(_mathjs2.default.subtract(v, ov)) > 0) {
              _this4.terms[key] = _mathjs2.default.subtract(v, ov);
            } else {
              delete _this4.terms[key];
            }
          } else {
            _this4.terms[key] = _mathjs2.default.subtract(0, ov);
          }
        });
      } else {
        throw new Error('Cannot subtract invalid type from QubitOperator.');
      }
      return this;
    }
  }, {
    key: 'sub',
    value: function sub(subtrahend) {
      var ret = this.copy();
      return ret.isub(subtrahend);
    }

    /**
     * return negative of current qubit operator
     * @return {QubitOperator}
     */

  }, {
    key: 'negative',
    value: function negative() {
      return this.mul(-1.0);
    }

    /**
     * return copy of current qubit operator
     * @return {QubitOperator}
     */

  }, {
    key: 'copy',
    value: function copy() {
      var terms = {};
      Object.assign(terms, this.terms);
      var inst = new QubitOperator([]);
      inst.terms = terms;
      return inst;
    }

    /**
     * string description of current qubit operator
     * @return {string}
     */

  }, {
    key: 'toString',
    value: function toString() {
      var _this5 = this;

      var keys = Object.keys(this.terms);
      if (keys.length === 0) {
        return '0';
      }
      var string_rep = '';
      keys.forEach(function (term) {
        var parts = stringToArray(term);
        var v = _this5.terms[term];
        var tmp_string = '' + v;
        if (parts.length === 0) {
          tmp_string += ' I';
        }
        parts.forEach(function (operator) {
          switch (operator[1]) {
            case 'X':
            case 'Y':
            case 'Z':
              {
                tmp_string += ' ' + operator[1] + operator[0];
                break;
              }
            default:
              {
                throw new Error('invalid operator');
                break;
              }
          }
        });
        string_rep += tmp_string + ' +\n';
      });

      return string_rep.substring(0, string_rep.length - 3);
    }
  }]);

  return QubitOperator;
}();

exports.default = QubitOperator;