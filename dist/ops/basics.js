'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BasicMathGate = exports.FastForwardingGate = exports.ClassicalInstructionGate = exports.BasicPhaseGate = exports.BasicRotationGate = exports.SelfInverseGate = exports.BasicGate = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
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
Defines the BasicGate class, the base class of all gates, the
BasicRotationGate class, the SelfInverseGate, the FastForwardingGate, the
ClassicalInstruction gate, and the BasicMathGate class.

Gates overload the | operator to allow the following syntax:

 @example
Gate | (qureg1, qureg2, qureg2)
Gate | (qureg, qubit)
Gate | qureg
Gate | qubit
Gate | (qubit,)

This means that for more than one quantum argument (right side of | ), a tuple
needs to be made explicitely, while for one argument it is optional.
*/


var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _qubit = require('../types/qubit');

var _command = require('./command');

var _command2 = _interopRequireDefault(_command);

var _util = require('../libs/util');

var _error = require('../meta/error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ANGLE_PRECISION = 12;
var ANGLE_TOLERANCE = Math.pow(10, -ANGLE_PRECISION);

/**
 * @abstract
 * @class BasicGate
 * @desc Base class of all gates.
 */

var BasicGate = exports.BasicGate = function () {
  /**
   * @constructor
    Note:
  Set interchangeable qubit indices!
    (gate.interchangeable_qubit_indices)
  As an example, consider
     @example
   ExampleGate | (a,b,c,d,e)
  where a and b are interchangeable. Then, call this function as
  follows:
     @example
   this.set_interchangeable_qubit_indices([[0,1]])
  As another example, consider
     @example
   ExampleGate2 | (a,b,c,d,e)
  where a and b are interchangeable and, in addition, c, d, and e
  are interchangeable among themselves. Then, call this function as
     @example
    this.set_interchangeable_qubit_indices([[0,1],[2,3,4]])
  */
  function BasicGate() {
    _classCallCheck(this, BasicGate);

    this.interchangeableQubitIndices = [];
  }

  /**
   * @throws {Error}
   */


  _createClass(BasicGate, [{
    key: 'getInverse',
    value: function getInverse() {
      throw new Error('BasicGate: No getInverse() implemented.');
    }

    /**
     * @throws {NotMergeable}
     */

  }, {
    key: 'getMerged',
    value: function getMerged() {
      throw new _error.NotMergeable('BasicGate: No getMerged() implemented.');
    }

    /**
     * @throws {Error}
     */

  }, {
    key: 'toString',
    value: function toString() {
      throw new Error('BasicGate: No toString() implemented.');
    }

    /**
     * @return {string}
     */

  }, {
    key: 'inspect',
    value: function inspect() {
      return this.toString();
    }

    /**
      Convert quantum input of "gate | quantum input" to internal formatting.
        A Command object only accepts tuples of Quregs (list of Qubit objects)
    as qubits input parameter. However, with this function we allow the
    user to use a more flexible syntax:
        1) Gate | qubit
      2) Gate | [qubit0, qubit1]
      3) Gate | qureg
      4) Gate | (qubit, )
      5) Gate | (qureg, qubit)
    where qubit is a Qubit object and qureg is a Qureg object. This
    function takes the right hand side of | and transforms it to the
    correct input parameter of a Command object which is:
        1) -> Gate | ([qubit], )
      2) -> Gate | ([qubit0, qubit1], )
      3) -> Gate | (qureg, )
      4) -> Gate | ([qubit], )
      5) -> Gate | (qureg, [qubit])
    @param {Qubit|Qubit[]|Qureg|Qureg[]} qubits a Qubit object, a list of Qubit objects, a Qureg object,
      or a tuple of Qubit or Qureg objects (can be mixed).
    @returns {Qureg[]} Canonical representation A tuple containing Qureg (or list of Qubits) objects.
       */

  }, {
    key: 'generateCommand',


    /**
      Helper function to generate a command consisting of the gate and the qubits being acted upon.
        @param qubits {Qubit | Array.<Qubit> | Qureg} see BasicGate.makeTupleOfQureg(qubits)
      @return {Command} A Command object containing the gate and the qubits.
    */
    value: function generateCommand(qubits) {
      var qs = BasicGate.makeTupleOfQureg(qubits);
      var engines = [];
      qs.forEach(function (reg) {
        reg.forEach(function (q) {
          return engines.push(q.engine);
        });
      });
      var eng = engines[0];
      return new _command2.default(eng, this, qs);
    }

    /**
      Operator| overload which enables the syntax Gate | qubits.
        @example
    1) Gate | qubit
    2) Gate | [qubit0, qubit1]
    3) Gate | qureg
    4) Gate | (qubit, )
    5) Gate | (qureg, qubit)
       @param qubits {Qubit | Array.<Qubit> | Qureg}
     a Qubit object, a list of Qubit objects, a Qureg object,
     or a tuple of Qubit or Qureg objects (can be mixed).
    */

  }, {
    key: 'or',
    value: function or(qubits) {
      var cmd = this.generateCommand(qubits);
      cmd.apply();
    }

    /**
     * @param {BasicGate | Object} other
     * @return {boolean}
     */

  }, {
    key: 'equal',
    value: function equal(other) {
      return this.__proto__ === other.__proto__;
    }

    /**
     * @return {BasicGate}
     */

  }, {
    key: 'copy',
    value: function copy() {
      return (0, _util.ObjectCopy)(this);
    }
  }], [{
    key: 'makeTupleOfQureg',
    value: function makeTupleOfQureg(qubits) {
      var isTuple = (0, _util.arrayIsTuple)(qubits);
      if (!isTuple) {
        qubits = [qubits];
      }
      qubits.forEach(function (looper, idx) {
        if (looper instanceof _qubit.BasicQubit) {
          qubits[idx] = [looper];
        }
      });
      return qubits.slice(0);
    }
  }]);

  return BasicGate;
}();

/**
 * @class SelfInverseGate
 * @desc Self-inverse basic gate class.
 * Automatic implementation of the getInverse-member function for self-inverse gates.
 * @example
   // getInverse(H) == H, it is a self-inverse gate:
    getInverse(H) | qubit
 */


var SelfInverseGate = exports.SelfInverseGate = function (_BasicGate) {
  _inherits(SelfInverseGate, _BasicGate);

  function SelfInverseGate() {
    _classCallCheck(this, SelfInverseGate);

    return _possibleConstructorReturn(this, (SelfInverseGate.__proto__ || Object.getPrototypeOf(SelfInverseGate)).apply(this, arguments));
  }

  _createClass(SelfInverseGate, [{
    key: 'getInverse',
    value: function getInverse() {
      return (0, _util.ObjectCopy)(this);
    }
  }]);

  return SelfInverseGate;
}(BasicGate);

/**
 * @class BasicRotationGate
 * @desc
Defines a base class of a rotation gate.

    A rotation gate has a continuous parameter (the angle), labeled 'angle' /
this.angle. Its inverse is the same gate with the negated argument.
    Rotation gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 4 * pi, this.angle is in the interval
    [0, 4 * pi).
 */


var BasicRotationGate = exports.BasicRotationGate = function (_BasicGate2) {
  _inherits(BasicRotationGate, _BasicGate2);

  /**
   * @constructor
      Initialize a basic rotation gate.
    @param angle {number} Angle of rotation (saved modulo 4 * pi)
   */
  function BasicRotationGate(angle) {
    var _ref;

    _classCallCheck(this, BasicRotationGate);

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var _this2 = _possibleConstructorReturn(this, (_ref = BasicRotationGate.__proto__ || Object.getPrototypeOf(BasicRotationGate)).call.apply(_ref, [this].concat(args)));

    var rounded_angle = _mathjs2.default.round(_mathjs2.default.mod(angle, 4.0 * Math.PI), ANGLE_PRECISION);
    if (rounded_angle > 4 * Math.PI - ANGLE_TOLERANCE) {
      rounded_angle = 0.0;
    }
    _this2.angle = rounded_angle;
    return _this2;
  }

  /**
   * @return {BasicRotationGate}
  Return the inverse of this rotation gate (negate the angle, return new
  object).
     */


  _createClass(BasicRotationGate, [{
    key: 'getInverse',
    value: function getInverse() {
      if (this.angle == 0) {
        return new this.__proto__.constructor(0);
      } else {
        return new this.__proto__.constructor(-this.angle + 4 * Math.PI);
      }
    }

    /**
      Return self merged with another gate.
        Default implementation handles rotation gate of the same type, where
    angles are simply added.
        @param {BasicRotationGate|Object} other
      @throws {NotMergeable}  For non-rotation gates or rotation gates of different type.
      @return {BasicRotationGate} New object representing the merged gates.
     */

  }, {
    key: 'getMerged',
    value: function getMerged(other) {
      if (other instanceof BasicRotationGate) {
        return new this.__proto__.constructor(this.angle + other.angle);
      }
      throw new _error.NotMergeable('Can\'t merge different types of rotation gates.');
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.constructor.name + '(' + this.angle + ')';
    }

    /**
      Return the Latex string representation of a BasicRotationGate.
      Returns the class name and the angle as a subscript, i.e.
       @example
    [CLASSNAME]$_[ANGLE]$
     @return {string}
     */

  }, {
    key: 'texString',
    value: function texString() {
      return this.constructor.name + '$_{' + this.angle + '}$';
    }
  }, {
    key: 'equal',
    value: function equal(other) {
      if (other instanceof BasicRotationGate) {
        return this.angle == other.angle;
      }
      return false;
    }
  }]);

  return BasicRotationGate;
}(BasicGate);

/**
 * @class BasicPhaseGate
 * @desc
Defines a base class of a phase gate.

    A phase gate has a continuous parameter (the angle), labeled 'angle' /
this.angle. Its inverse is the same gate with the negated argument.
    Phase gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 2 * pi, this.angle is in the interval
    [0, 2 * pi).
 */


var BasicPhaseGate = exports.BasicPhaseGate = function (_BasicGate3) {
  _inherits(BasicPhaseGate, _BasicGate3);

  /**
    Initialize a basic rotation gate.
      @param {number} angle Angle of rotation (saved modulo 2 * pi)
     */
  function BasicPhaseGate(angle) {
    var _ref2;

    _classCallCheck(this, BasicPhaseGate);

    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var _this3 = _possibleConstructorReturn(this, (_ref2 = BasicPhaseGate.__proto__ || Object.getPrototypeOf(BasicPhaseGate)).call.apply(_ref2, [this].concat(args)));

    var rounded_angle = _mathjs2.default.round(_mathjs2.default.mod(angle, 2.0 * Math.PI), ANGLE_PRECISION);
    if (rounded_angle > 2 * Math.PI - ANGLE_TOLERANCE) {
      rounded_angle = 0.0;
    }
    _this3.angle = rounded_angle;
    return _this3;
  }

  /**
    Return the inverse of this rotation gate (negate the angle, return new object).
    @return {BasicPhaseGate}
   */


  _createClass(BasicPhaseGate, [{
    key: 'getInverse',
    value: function getInverse() {
      if (this.angle == 0) {
        return new this.__proto__.constructor(0);
      } else {
        return new this.__proto__.constructor(-this.angle + 2 * Math.PI);
      }
    }

    /**
      Return self merged with another gate.
        Default implementation handles rotation gate of the same type, where angles are simply added.
        @param {BasicPhaseGate} other Phase gate of same type.
      @throws NotMergeable For non-rotation gates or rotation gates of different type.
      @return {BasicPhaseGate} New object representing the merged gates.
    */

  }, {
    key: 'getMerged',
    value: function getMerged(other) {
      if (other instanceof BasicPhaseGate) {
        return new this.__proto__.constructor(this.angle + other.angle);
      }
      throw new _error.NotMergeable('Can\'t merge different types of rotation gates.');
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.constructor.name + '(' + this.angle + ')';
    }
  }, {
    key: 'texString',
    value: function texString() {
      return this.constructor.name + '$_{' + this.angle + '}$';
    }
  }, {
    key: 'equal',
    value: function equal(other) {
      if (other instanceof BasicPhaseGate) {
        return this.angle === other.angle;
      }
      return false;
    }
  }]);

  return BasicPhaseGate;
}(BasicGate);

/**
 * @class ClassicalInstructionGate
 * @desc
  Classical instruction gates never have control qubits.
    Base class for all gates which are not quantum gates in the typical sense,
    e.g., measurement, allocation/deallocation, ...
 */


var ClassicalInstructionGate = exports.ClassicalInstructionGate = function (_BasicGate4) {
  _inherits(ClassicalInstructionGate, _BasicGate4);

  function ClassicalInstructionGate() {
    _classCallCheck(this, ClassicalInstructionGate);

    return _possibleConstructorReturn(this, (ClassicalInstructionGate.__proto__ || Object.getPrototypeOf(ClassicalInstructionGate)).apply(this, arguments));
  }

  return ClassicalInstructionGate;
}(BasicGate);

/**
 * @class FastForwardingGate
 * @desc
Base class for classical instruction gates which require a fast-forward
through compiler engines that cache / buffer gates. Examples include
Measure and Deallocate, which both should be executed asap, such
that Measurement results are available and resources are freed,
    respectively.

        Note:
The only requirement is that FlushGate commands run the entire
circuit. FastForwardingGate objects can be used but the user cannot
expect a measurement result to be available for all back-ends when
calling only Measure. E.g., for the IBM Quantum Experience back-end,
    sending the circuit for each Measure-gate would be too inefficient,
    which is why a final

 @example

eng.flush()

is required before the circuit gets sent through the API.
 */


var FastForwardingGate = exports.FastForwardingGate = function (_ClassicalInstruction) {
  _inherits(FastForwardingGate, _ClassicalInstruction);

  function FastForwardingGate() {
    _classCallCheck(this, FastForwardingGate);

    return _possibleConstructorReturn(this, (FastForwardingGate.__proto__ || Object.getPrototypeOf(FastForwardingGate)).apply(this, arguments));
  }

  return FastForwardingGate;
}(ClassicalInstructionGate);

/**
 * @class BasicMathGate
 * @desc
Base class for all math gates.

    It allows efficient emulation by providing a mathematical representation
which is given by the concrete gate which derives from this base class.
The AddConstant gate, for example, registers a function of the form

 @example

function add(x)
return (x+a,)

upon initialization. More generally, the function takes integers as
parameters and returns a tuple / list of outputs, each entry corresponding
to the function input. As an example, consider out-of-place
multiplication, which takes two input registers and adds the result into a
third, i.e., (a,b,c) -> (a,b,c+a*b). The corresponding function then is

 @example

function multiply(a,b,c)
return (a,b,c+a*b)
 */


var BasicMathGate = exports.BasicMathGate = function (_BasicGate5) {
  _inherits(BasicMathGate, _BasicGate5);

  /**
   * @constructor
    Initialize a BasicMathGate by providing the mathematical function that it implements.
      @param {function} mathFunc Function which takes as many int values as
  input, as the gate takes registers. For each of these values,
    it then returns the output (i.e., it returns a list/tuple of
  output values).
  @example
  function add(a,b)
  return (a,a+b)
  BasicMathGate.__init__(self, add)
  If the gate acts on, e.g., fixed point numbers, the number of bits per
  register is also required in order to describe the action of such a
  mathematical gate. For this reason, there is
     @example
  BasicMathGate.get_math_function(qubits)
  which can be overwritten by the gate deriving from BasicMathGate.
      @example
  function get_math_function(self, qubits)
  n = len(qubits[0])
  scal = 2.**n
  function math_fun(a)
  return (int(scal * (math.sin(math.pi * a / scal))),)
  return math_fun
     */
  function BasicMathGate(mathFunc) {
    var _ref3;

    _classCallCheck(this, BasicMathGate);

    for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }

    var _this6 = _possibleConstructorReturn(this, (_ref3 = BasicMathGate.__proto__ || Object.getPrototypeOf(BasicMathGate)).call.apply(_ref3, [this].concat(args)));

    _this6.mathFunc = function (x) {
      return Array.from(mathFunc.apply(undefined, _toConsumableArray(x)));
    };
    return _this6;
  }

  /**
    Return the math function which corresponds to the action of this math
  gate, given the input to the gate (a tuple of quantum registers).
    @param {Array.<Qureg>} qubits Qubits to which the math gate is being applied.
      @return {function} javascript function describing the action of this
    gate. (See BasicMathGate.constructor for an example).
   */


  _createClass(BasicMathGate, [{
    key: 'getMathFunction',
    value: function getMathFunction(qubits) {
      return this.mathFunc;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'MATH';
    }
  }]);

  return BasicMathGate;
}(BasicGate);