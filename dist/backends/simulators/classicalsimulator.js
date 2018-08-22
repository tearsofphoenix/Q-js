'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _bigInteger = require('big-integer');

var _bigInteger2 = _interopRequireDefault(_bigInteger);

var _basics = require('../../cengines/basics');

var _qubit = require('../../types/qubit');

var _gates = require('../../ops/gates');

var _basics2 = require('../../ops/basics');

var _tag = require('../../meta/tag');

var _util = require('../../libs/util');

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
 * @class ClassicalSimulator
 * @desc
A simple introspective simulator that only permits classical operations.

  Allows allocation, deallocation, measuring (no-op), flushing (no-op),
  controls, NOTs, and any BasicMathGate. Supports reading/writing directly
from/to bits and registers of bits.
 */
var ClassicalSimulator = function (_BasicEngine) {
  _inherits(ClassicalSimulator, _BasicEngine);

  /**
   * @constructor
   */
  function ClassicalSimulator() {
    _classCallCheck(this, ClassicalSimulator);

    var _this = _possibleConstructorReturn(this, (ClassicalSimulator.__proto__ || Object.getPrototypeOf(ClassicalSimulator)).call(this));

    _this._state = (0, _bigInteger2.default)(0);
    _this._bit_positions = {};
    return _this;
  }

  /**
  Converts a qubit from a logical to a mapped qubit if there is a mapper.
    @param {Qubit} qubit Logical quantum bit
   */


  _createClass(ClassicalSimulator, [{
    key: 'convertLogicalToMappedQubit',
    value: function convertLogicalToMappedQubit(qubit) {
      var mapper = this.main.mapper;

      if (mapper) {
        var v = mapper.currentMapping[qubit.id];
        if (typeof v === 'undefined') {
          throw new Error('Unknown qubit id. ' + 'Please make sure you have called ' + 'eng.flush().');
        }
        return new _qubit.BasicQubit(qubit.engine, v);
      } else {
        return qubit;
      }
    }

    /**
    Reads a bit.
      Note:
    If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
    the qureg argument.
      @param {Qubit} qubit The bit to read.
      @return {number} 0 if the target bit is off, 1 if it's on.
     */

  }, {
    key: 'readBit',
    value: function readBit(qubit) {
      qubit = this.convertLogicalToMappedQubit(qubit);
      return this.readMappedBit(qubit);
    }

    // Internal use only. Does not change logical to mapped qubits.

  }, {
    key: 'readMappedBit',
    value: function readMappedBit(mappedQubit) {
      var p = this._bit_positions[mappedQubit.id];
      return this._state.shiftRight(p).and(1).toJSNumber();
    }

    /**
    Resets/sets a bit to the given value.
      Note:
    If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
    the qureg argument.
        @param {Qubit} qubit The bit to write.
      @param {boolean|number} value Writes 1 if this value is truthy, else 0.
    */

  }, {
    key: 'writeBit',
    value: function writeBit(qubit, value) {
      qubit = this.convertLogicalToMappedQubit(qubit);
      this.writeMappedBit(qubit, value);
    }

    // Internal use only. Does not change logical to mapped qubits.

  }, {
    key: 'writeMappedBit',
    value: function writeMappedBit(mappedQubit, value) {
      var p = this._bit_positions[mappedQubit.id];
      if (value) {
        this._state = this._state.or((0, _bigInteger2.default)(1).shiftLeft(p));
      } else {
        var temp = (0, _bigInteger2.default)(1).shiftLeft(p).not();
        this._state = this._state.and(temp);
      }
    }

    /**
    Returns a mask, to compare against the state, with bits from the
    register set to 1 and other bits set to 0.
    @param {Qureg} qureg The bits whose positions should be set.
      @return {number} The mask.
     */

  }, {
    key: 'mask',
    value: function mask(qureg) {
      var _this2 = this;

      var t = 0;
      qureg.forEach(function (q) {
        return t |= 1 << _this2._bit_positions[q.id];
      });
      return t;
    }

    /**
    Reads a group of bits as a little-endian integer.
      Note:
    If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
    the qureg argument.
      @param {Qureg} qureg The group of bits to read, in little-endian order.
      @return {number} Little-endian register value.
     */

  }, {
    key: 'readRegister',
    value: function readRegister(qureg) {
      var _this3 = this;

      var new_qureg = [];
      qureg.forEach(function (qubit) {
        return new_qureg.push(_this3.convertLogicalToMappedQubit(qubit));
      });
      return this.readMappedRegister(new_qureg);
    }
  }, {
    key: 'readMappedRegister',
    value: function readMappedRegister(mappedQureg) {
      var _this4 = this;

      var t = 0;
      mappedQureg.forEach(function (_, i) {
        return t |= _this4.readMappedBit(mappedQureg[i]) << i;
      });
      return t;
    }

    /**
    Sets a group of bits to store a little-endian integer value.
      Note:
    If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
    the qureg argument.
       @param {Qureg} qureg  The bits to write, in little-endian order.
     @param {number} value  The integer value to store. Must fit in the register.
     */

  }, {
    key: 'writeRegister',
    value: function writeRegister(qureg, value) {
      var _this5 = this;

      var new_qureg = [];
      qureg.forEach(function (qubit) {
        return new_qureg.push(_this5.convertLogicalToMappedQubit(qubit));
      });
      this.writeMappedRegister(new_qureg, value);
    }
  }, {
    key: 'writeMappedRegister',
    value: function writeMappedRegister(mappedQureg, value) {
      var _this6 = this;

      if (value < 0 || value >= Math.pow(2, mappedQureg.length)) {
        throw new Error("Value won't fit in register.");
      }
      mappedQureg.forEach(function (_, i) {
        return _this6.writeMappedBit(mappedQureg[i], value >> i & 1);
      });
    }
  }, {
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      return (0, _util.instanceOf)(cmd.gate, [_gates.MeasureGate, _gates.AllocateQubitGate, _gates.DeallocateQubitGate, _basics2.BasicMathGate, _gates.FlushGate, _gates.XGate]);
    }
  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this7 = this;

      commandList.forEach(function (cmd) {
        _this7.handle(cmd);
      });
      if (!this.isLastEngine) {
        this.send(commandList);
      }
    }

    /**
     *
     * @param {Command} cmd
     */

  }, {
    key: 'handle',
    value: function handle(cmd) {
      var _this8 = this;

      if (cmd.gate instanceof _gates.FlushGate) {
        return;
      }

      if (cmd.gate.equal(_gates.Measure)) {
        cmd.qubits.forEach(function (qr) {
          return qr.forEach(function (qb) {
            // Check if a mapper assigned a different logical id
            var logical_id_tag = void 0;
            cmd.tags.forEach(function (tag) {
              if (tag instanceof _tag.LogicalQubitIDTag) {
                logical_id_tag = tag;
              }
            });
            var log_qb = qb;
            if (logical_id_tag) {
              log_qb = new _qubit.BasicQubit(qb.engine, logical_id_tag.logical_qubit_id);
            }
            _this8.main.setMeasurementResult(log_qb, _this8.readMappedBit(qb));
          });
        });
        return;
      }

      if (cmd.gate.equal(_gates.Allocate)) {
        var newID = cmd.qubits[0][0].id;
        this._bit_positions[newID] = Object.keys(this._bit_positions).length;
        return;
      }
      if (cmd.gate.equal(_gates.Deallocate)) {
        var old_id = cmd.qubits[0][0].id;
        var pos = this._bit_positions[old_id];
        var low = (1 << pos) - 1;
        this._state = this._state.and(low).or(this._state.shiftRight(1).and(~low));
        var newpos = {};
        Object.keys(this._bit_positions).forEach(function (k) {
          var b = _this8._bit_positions[k];
          if (b < pos) {
            newpos[k] = b;
          } else {
            newpos[k] = b - 1;
          }
        });
        this._bit_positions = newpos;
        return;
      }

      var controls_mask = this.mask(cmd.controlQubits);
      var meets_controls = this._state.and(controls_mask).eq((0, _bigInteger2.default)(controls_mask));

      if (cmd.gate instanceof _gates.XGate) {
        (0, _assert2.default)(cmd.qubits.length === 1 && cmd.qubits[0].length === 1);
        var target = cmd.qubits[0][0];
        if (meets_controls) {
          this.writeMappedBit(target, !this.readMappedBit(target));
        }
        return;
      }

      if (cmd.gate instanceof _basics2.BasicMathGate) {
        if (meets_controls) {
          var ins = cmd.qubits.map(function (reg) {
            return _this8.readMappedRegister(reg);
          });
          var outs = cmd.gate.getMathFunction(cmd.qubits)(ins);
          cmd.qubits.forEach(function (reg, index) {
            var out = outs[index];
            _this8.writeMappedRegister(reg, out & (1 << reg.length) - 1);
          });
        }
        return;
      }
      throw new Error('Only support alloc/dealloc/measure/not/math ops.');
    }
  }]);

  return ClassicalSimulator;
}(_basics.BasicEngine);

exports.default = ClassicalSimulator;