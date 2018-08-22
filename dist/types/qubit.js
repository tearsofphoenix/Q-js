'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Qureg = exports.Qubit = exports.BasicQubit = undefined;

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
    This file defines BasicQubit, Qubit, WeakQubit and Qureg.

    A Qureg represents a list of Qubit or WeakQubit objects.
    Qubit represents a (logical-level) qubit with a unique index provided by the
    MainEngine. Qubit objects are automatically deallocated if they go out of
    scope and intented to be used within Qureg objects in user code.

 @example
      import MainEngine
      const eng = new MainEngine()
      const qubit = eng.allocateQubit()

    qubit is a Qureg of size 1 with one Qubit object which is deallocated once
    qubit goes out of scope.

    WeakQubit are used inside the Command object and are not automatically deallocated.
*/


var _polyfill = require('../libs/polyfill');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class BasicQubit
 * @desc
 * objects represent qubits. They have an id and a reference to the owning engine.
 */
var BasicQubit = exports.BasicQubit = function () {
  /**
   *  @constructor
   *  Initialize a BasicQubit object.
   *  @param {BasicEngine} engine Owning engine / engine that created the qubit
   *  @param {number} idx Unique index of the qubit referenced by this qubit
   */
  function BasicQubit(engine, idx) {
    _classCallCheck(this, BasicQubit);

    /**
     * @type {BasicEngine}
     */
    this.engine = engine;
    this.id = idx;
  }

  /**
    Return string representation of this qubit.
   @return {string}
   */


  _createClass(BasicQubit, [{
    key: 'toString',
    value: function toString() {
      return '' + this.id;
    }

    /**
     *
     * @return {string}
     */

  }, {
    key: 'inspect',
    value: function inspect() {
      return this.toString();
    }

    /**
      Access the result of a previous measurement and return false / true (0 / 1)
      @return {boolean}
    */

  }, {
    key: 'toBoolean',
    value: function toBoolean() {
      return this.engine.main.getMeasurementResult(this);
    }

    /**
     * @return {number}
     */

  }, {
    key: 'toNumber',
    value: function toNumber() {
      return this.toBoolean() ? 1 : 0;
    }

    /**
     * Compare with other qubit (Returns true if equal id and engine).
     *
     * @param other {BasicQubit|Object} BasicQubit to which to compare this one
     * @return {boolean}
     */

  }, {
    key: 'equal',
    value: function equal(other) {
      if (this === other) {
        return true;
      }
      return other instanceof BasicQubit && this.id === other.id && this.engine === other.engine;
    }
  }, {
    key: 'weakCopy',
    value: function weakCopy() {
      return new BasicQubit(this.engine, this.id);
    }
  }], [{
    key: 'copyArray',
    value: function copyArray(array) {
      return array.map(function (i) {
        return i.weakCopy();
      });
    }
  }]);

  return BasicQubit;
}();

/**
 * @class Qubit
 * @desc
    Represents a (logical-level) qubit with a unique index provided by the
    MainEngine. Once the qubit goes out of scope (and is garbage-collected),
    it deallocates itself automatically, allowing automatic resource management.

    Thus the qubit is not copyable only returns a reference to the same object.
 */


var Qubit = exports.Qubit = function (_BasicQubit) {
  _inherits(Qubit, _BasicQubit);

  function Qubit() {
    _classCallCheck(this, Qubit);

    return _possibleConstructorReturn(this, (Qubit.__proto__ || Object.getPrototypeOf(Qubit)).apply(this, arguments));
  }

  _createClass(Qubit, [{
    key: 'deallocate',
    value: function deallocate() {
      // # If a user directly calls this function, then the qubit gets id == -1
      // # but stays in active_qubits as it is not yet deleted, hence remove
      // # it manually (if the garbage collector calls this function, then the
      // # WeakRef in active qubits is already gone):
      if (this.id === -1) {
        return;
      }

      try {
        var qubits = this.engine.main.activeQubits;
        if (qubits.has(this)) {
          qubits.delete(this);
        }
        this.engine.deallocateQubit(this);
      } catch (e) {
        throw e;
      } finally {
        this.id = -1;
      }
    }

    /**
      Non-copyable (returns reference to self).
      Note:
        To prevent problems with automatic deallocation, qubits are not copyable!
    */

  }, {
    key: 'copy',
    value: function copy() {
      return this;
    }
  }]);

  return Qubit;
}(BasicQubit);

/**
 * Quantum register class.
Simplifies accessing measured values for single-qubit registers (no []-access necessary)
 and enables pretty-printing of general quantum registers).
 @class Qureg
 */


var Qureg = exports.Qureg = function (_Array) {
  _inherits(Qureg, _Array);

  /**
   * a little different with `Array`: when pass an array as argument, will copy the passed array
   * @constructor
   * @param {...any|number|Array} args
   */
  function Qureg() {
    _classCallCheck(this, Qureg);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var arg0 = args[0];
    if (Array.isArray(arg0)) {
      var _ref;

      var _this2 = _possibleConstructorReturn(this, (_ref = Qureg.__proto__ || Object.getPrototypeOf(Qureg)).call.apply(_ref, [this].concat(_toConsumableArray(arg0))));
    } else {
      var _ref2;

      var _this2 = _possibleConstructorReturn(this, (_ref2 = Qureg.__proto__ || Object.getPrototypeOf(Qureg)).call.apply(_ref2, [this].concat(args)));
    }
    /**
     * @ignore
     * @private
     */
    _this2.__proto__ = Qureg.prototype;
    return _possibleConstructorReturn(_this2);
  }

  /**
   * test if two Quregs are equal
   * @param {Qureg|Object} other
   * @return {boolean}
   */


  _createClass(Qureg, [{
    key: 'equal',
    value: function equal(other) {
      if (other instanceof Qureg) {
        return (0, _polyfill.arrayEqual)(this, other, function (x, y) {
          return x.equal(y);
        });
      }
      return false;
    }

    /**
     * only supported when `length === 1`, use the qubit value as qureg value
     * @throws {Error} will throw when `length !== 1`
     * @return {boolean}
     */

  }, {
    key: 'toBoolean',
    value: function toBoolean() {
      if (this.length === 1) {
        return this[0].toBoolean();
      }
      throw new Error('qureg.toBoolean(): Quantum register contains more "\n' + '"than 1 qubit. Use qureg[idx].toBoolean() instead.');
    }

    /**
     * number representation
     * @return {number}
     */

  }, {
    key: 'toNumber',
    value: function toNumber() {
      return this.toBoolean() ? 1 : 0;
    }

    /**
     * add qubits from `other`, return a new Qureg instance
     * @param {Array<Qubit>|Qureg} other
     * @return {Qureg}
     */

  }, {
    key: 'add',
    value: function add(other) {
      var array = this.concat(other);
      return new Qureg(array);
    }

    /**
     * string description
     * @return {string}
     */

  }, {
    key: 'toString',
    value: function toString() {
      if (this.length === 0) return 'Qureg[]';
      var ids = this.slice(1).map(function (_ref3) {
        var id = _ref3.id;
        return id;
      });
      ids.push(null); // Forces a flush on last loop iteration.

      var out_list = [];
      var start_id = this[0].id;
      var count = 1;
      ids.forEach(function (qubit_id) {
        if (qubit_id === start_id + count) {
          count += 1;
        } else {
          // TODO
          if (count > 1) {
            out_list.push(start_id + '-' + (start_id + count - 1));
          } else {
            out_list.push('' + start_id);
          }
          start_id = qubit_id;
          count = 1;
        }
      });

      return 'Qureg[' + out_list.join(', ') + ']';
    }

    /**
     * deallocate all qubit, then clear the qureg
     */

  }, {
    key: 'deallocate',
    value: function deallocate() {
      this.forEach(function (qubit) {
        return qubit.deallocate();
      });
      this.length = 0;
    }

    /**
     * @return {BasicEngine}
     */

  }, {
    key: 'engine',
    get: function get() {
      return this[0].engine;
    }

    /**
     * @param {BasicEngine} newEngine
     */
    ,
    set: function set(newEngine) {
      this.forEach(function (looper) {
        return looper.engine = newEngine;
      });
    }
  }]);

  return Qureg;
}(Array);