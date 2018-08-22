'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BarrierGate = exports.Barrier = exports.AllocateDirty = exports.AllocateDirtyQubitGate = exports.DeallocateQubitGate = exports.Allocate = exports.AllocateQubitGate = exports.Deallocate = exports.Measure = exports.MeasureGate = exports.FlushGate = exports.R = exports.Rz = exports.Ry = exports.Rx = exports.Ph = exports.Entangle = exports.EntangleGate = exports.SqrtSwap = exports.SqrtSwapGate = exports.Swap = exports.SwapGate = exports.SqrtX = exports.SqrtXGate = exports.T = exports.TGate = exports.S = exports.SGate = exports.Z = exports.ZGate = exports.Y = exports.YGate = exports.NOT = exports.X = exports.XGate = exports.H = exports.HGate = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _basics = require('./basics');

var _cycle = require('./_cycle');

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
Contains definitions of standard gates such as
* Hadamard (H)
* Pauli-X (X / NOT)
* Pauli-Z (Z)
* T and its inverse (T / Tdagger)
* Swap gate (Swap)
* Phase gate (Ph)
* Rotation-Z (Rz)
* Phase-shift (R)
* Measurement (Measure)

and meta gates, i.e.,
* Allocate / Deallocate qubits
* Flush gate (end of circuit)
*/


var mc = _mathjs2.default.complex;
var mm = _mathjs2.default.matrix;

/**
 * @class HGate
 */

var HGate = exports.HGate = function (_SelfInverseGate) {
  _inherits(HGate, _SelfInverseGate);

  function HGate() {
    _classCallCheck(this, HGate);

    return _possibleConstructorReturn(this, (HGate.__proto__ || Object.getPrototypeOf(HGate)).apply(this, arguments));
  }

  _createClass(HGate, [{
    key: 'toString',
    value: function toString() {
      return 'H';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[mc(Math.SQRT1_2, 0), mc(Math.SQRT1_2, 0)], [mc(Math.SQRT1_2, 0), mc(-Math.SQRT1_2, 0)]]);
    }
  }]);

  return HGate;
}(_basics.SelfInverseGate);

var H = exports.H = new HGate();

/**
 * @class XGate
 */
// Pauli-X gate class

var XGate = exports.XGate = function (_SelfInverseGate2) {
  _inherits(XGate, _SelfInverseGate2);

  function XGate() {
    _classCallCheck(this, XGate);

    return _possibleConstructorReturn(this, (XGate.__proto__ || Object.getPrototypeOf(XGate)).apply(this, arguments));
  }

  _createClass(XGate, [{
    key: 'toString',
    value: function toString() {
      return 'X';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[0, 1], [1, 0]]);
    }
  }]);

  return XGate;
}(_basics.SelfInverseGate);

// Shortcut (instance of) `XGate`


var X = exports.X = new XGate();
var NOT = exports.NOT = X;

/**
 * @class YGate
 */
// Pauli-Y gate class

var YGate = exports.YGate = function (_SelfInverseGate3) {
  _inherits(YGate, _SelfInverseGate3);

  function YGate() {
    _classCallCheck(this, YGate);

    return _possibleConstructorReturn(this, (YGate.__proto__ || Object.getPrototypeOf(YGate)).apply(this, arguments));
  }

  _createClass(YGate, [{
    key: 'toString',
    value: function toString() {
      return 'Y';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[0, mc(0, -1)], [mc(0, 1), 0]]);
    }
  }]);

  return YGate;
}(_basics.SelfInverseGate);

// Shortcut (instance of) `YGate`


var Y = exports.Y = new YGate();

/**
 * @class ZGate
 * Pauli-Z gate class
 */

var ZGate = exports.ZGate = function (_SelfInverseGate4) {
  _inherits(ZGate, _SelfInverseGate4);

  function ZGate() {
    _classCallCheck(this, ZGate);

    return _possibleConstructorReturn(this, (ZGate.__proto__ || Object.getPrototypeOf(ZGate)).apply(this, arguments));
  }

  _createClass(ZGate, [{
    key: 'toString',
    value: function toString() {
      return 'Z';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[1, 0], [0, -1]]);
    }
  }]);

  return ZGate;
}(_basics.SelfInverseGate);

// Shortcut (instance of) `ZGate`


var Z = exports.Z = new ZGate();

/**
 * @class SGate
 */
// S gate class

var SGate = exports.SGate = function (_SelfInverseGate5) {
  _inherits(SGate, _SelfInverseGate5);

  function SGate() {
    _classCallCheck(this, SGate);

    return _possibleConstructorReturn(this, (SGate.__proto__ || Object.getPrototypeOf(SGate)).apply(this, arguments));
  }

  _createClass(SGate, [{
    key: 'toString',
    value: function toString() {
      return 'S';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[1, 0], [0, mc(0, 1)]]);
    }
  }]);

  return SGate;
}(_basics.SelfInverseGate);

// Shortcut (instance of) `SGate`


var S = exports.S = new SGate();

/**
 * @class TGate
 */
// T gate class

var TGate = exports.TGate = function (_BasicGate) {
  _inherits(TGate, _BasicGate);

  function TGate() {
    _classCallCheck(this, TGate);

    return _possibleConstructorReturn(this, (TGate.__proto__ || Object.getPrototypeOf(TGate)).apply(this, arguments));
  }

  _createClass(TGate, [{
    key: 'toString',
    value: function toString() {
      return 'T';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[1, 0], [0, mc(Math.SQRT1_2, Math.SQRT1_2)]]);
    }
  }]);

  return TGate;
}(_basics.BasicGate);

// Shortcut (instance of) `TGate`


var T = exports.T = new TGate();

/**
 * @class SqrtXGate
 */
// Square-root X gate class

var SqrtXGate = exports.SqrtXGate = function (_BasicGate2) {
  _inherits(SqrtXGate, _BasicGate2);

  function SqrtXGate() {
    _classCallCheck(this, SqrtXGate);

    return _possibleConstructorReturn(this, (SqrtXGate.__proto__ || Object.getPrototypeOf(SqrtXGate)).apply(this, arguments));
  }

  _createClass(SqrtXGate, [{
    key: 'toString',
    value: function toString() {
      return 'SqrtX';
    }
  }, {
    key: 'texString',
    value: function texString() {
      return '$\\sqrt{X}$';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[mc(0.5, 0.5), mc(0.5, -0.5)], [mc(0.5, -0.5), mc(0.5, 0.5)]]);
    }
  }]);

  return SqrtXGate;
}(_basics.BasicGate);

// Shortcut (instance of) `SqrtXGate`


var SqrtX = exports.SqrtX = new SqrtXGate();

/**
 * @class SwapGate
 * @desc Swap gate class (swaps 2 qubits) also self inverse gate
 */

var SwapGate = exports.SwapGate = function (_BasicMathGate) {
  _inherits(SwapGate, _BasicMathGate);

  function SwapGate() {
    _classCallCheck(this, SwapGate);

    var _this8 = _possibleConstructorReturn(this, (SwapGate.__proto__ || Object.getPrototypeOf(SwapGate)).call(this, function (x, y) {
      return [y, x];
    }));

    _this8.interchangeableQubitIndices = [[0, 1]];
    return _this8;
  }

  _createClass(SwapGate, [{
    key: 'toString',
    value: function toString() {
      return 'Swap';
    }
  }, {
    key: 'getInverse',
    value: function getInverse() {
      var inv = new SwapGate();
      inv.interchangeableQubitIndices = this.interchangeableQubitIndices.slice(0);
      return inv;
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]);
    }
  }]);

  return SwapGate;
}(_basics.BasicMathGate);

// Shortcut (instance of) `SwapGate`


var Swap = exports.Swap = new SwapGate();

/**
 * @class SqrtSwapGate
 * @desc Square-root Swap gate class
 */

var SqrtSwapGate = exports.SqrtSwapGate = function (_BasicGate3) {
  _inherits(SqrtSwapGate, _BasicGate3);

  function SqrtSwapGate() {
    _classCallCheck(this, SqrtSwapGate);

    var _this9 = _possibleConstructorReturn(this, (SqrtSwapGate.__proto__ || Object.getPrototypeOf(SqrtSwapGate)).call(this));

    _this9.interchangeableQubitIndices = [[0, 1]];
    return _this9;
  }

  _createClass(SqrtSwapGate, [{
    key: 'toString',
    value: function toString() {
      return 'SqrtSwap';
    }
  }, {
    key: 'matrix',
    get: function get() {
      return mm([[1, 0, 0, 0], [0, mc(0.5, 0.5), mc(0.5, -0.5), 0], [0, mc(0.5, -0.5), mc(0.5, 0.5), 0], [0, 0, 0, 1]]);
    }
  }]);

  return SqrtSwapGate;
}(_basics.BasicGate);

// Shortcut (instance of) `SqrtSwapGate`


var SqrtSwap = exports.SqrtSwap = new SqrtSwapGate();

/**
 * @class EntangleGate
 * @desc gate (Hadamard on first qubit, followed by CNOTs applied to all other qubits).
*/

var EntangleGate = exports.EntangleGate = function (_BasicGate4) {
  _inherits(EntangleGate, _BasicGate4);

  function EntangleGate() {
    _classCallCheck(this, EntangleGate);

    return _possibleConstructorReturn(this, (EntangleGate.__proto__ || Object.getPrototypeOf(EntangleGate)).apply(this, arguments));
  }

  _createClass(EntangleGate, [{
    key: 'toString',
    value: function toString() {
      return 'Entangle';
    }
  }, {
    key: 'matrix',
    get: function get() {
      throw new Error('No Attribute');
    }
  }]);

  return EntangleGate;
}(_basics.BasicGate);

// Shortcut (instance of) `EntangleGate`


var Entangle = exports.Entangle = new EntangleGate();

/**
 * @class Ph
 * @desc Phase gate (global phase)
 */

var Ph = exports.Ph = function (_BasicPhaseGate) {
  _inherits(Ph, _BasicPhaseGate);

  function Ph() {
    _classCallCheck(this, Ph);

    return _possibleConstructorReturn(this, (Ph.__proto__ || Object.getPrototypeOf(Ph)).apply(this, arguments));
  }

  _createClass(Ph, [{
    key: 'matrix',
    get: function get() {
      return mm([[mc(Math.cos(this.angle), Math.sin(this.angle)), 0], [0, mc(Math.cos(this.angle), Math.sin(this.angle))]]);
    }
  }]);

  return Ph;
}(_basics.BasicPhaseGate);

/**
 * @class Rx
 */


var Rx = exports.Rx = function (_BasicRotationGate) {
  _inherits(Rx, _BasicRotationGate);

  function Rx() {
    _classCallCheck(this, Rx);

    return _possibleConstructorReturn(this, (Rx.__proto__ || Object.getPrototypeOf(Rx)).apply(this, arguments));
  }

  _createClass(Rx, [{
    key: 'matrix',
    get: function get() {
      return mm([[Math.cos(0.5 * this.angle), mc(0, -1 * Math.sin(0.5 * this.angle))], [mc(0, -1 * Math.sin(0.5 * this.angle)), Math.cos(0.5 * this.angle)]]);
    }
  }]);

  return Rx;
}(_basics.BasicRotationGate);

/**
 * @class Ry
 */


var Ry = exports.Ry = function (_BasicRotationGate2) {
  _inherits(Ry, _BasicRotationGate2);

  function Ry() {
    _classCallCheck(this, Ry);

    return _possibleConstructorReturn(this, (Ry.__proto__ || Object.getPrototypeOf(Ry)).apply(this, arguments));
  }

  _createClass(Ry, [{
    key: 'matrix',
    get: function get() {
      return mm([[Math.cos(0.5 * this.angle), -Math.sin(0.5 * this.angle)], [Math.sin(0.5 * this.angle), Math.cos(0.5 * this.angle)]]);
    }
  }]);

  return Ry;
}(_basics.BasicRotationGate);

/**
 * @class Rz
 * @desc RotationZ gate class
 */


var Rz = exports.Rz = function (_BasicRotationGate3) {
  _inherits(Rz, _BasicRotationGate3);

  function Rz() {
    _classCallCheck(this, Rz);

    return _possibleConstructorReturn(this, (Rz.__proto__ || Object.getPrototypeOf(Rz)).apply(this, arguments));
  }

  _createClass(Rz, [{
    key: 'matrix',
    get: function get() {
      return mm([[mc(Math.cos(-0.5 * this.angle), Math.sin(-0.5 * this.angle)), 0], [0, mc(Math.cos(0.5 * this.angle), Math.sin(0.5 * this.angle))]]);
    }
  }]);

  return Rz;
}(_basics.BasicRotationGate);

/**
 * @class R
 * @desc Phase-shift gate (equivalent to Rz up to a global phase)
 */


var R = exports.R = function (_BasicPhaseGate2) {
  _inherits(R, _BasicPhaseGate2);

  function R() {
    _classCallCheck(this, R);

    return _possibleConstructorReturn(this, (R.__proto__ || Object.getPrototypeOf(R)).apply(this, arguments));
  }

  _createClass(R, [{
    key: 'matrix',
    get: function get() {
      return mm([[1, 0], [0, mc(Math.cos(this.angle), Math.sin(this.angle))]]);
    }
  }]);

  return R;
}(_basics.BasicPhaseGate);

/**
 * @class FlushGate
 * @desc
Flush gate (denotes the end of the circuit).

Note:
    All compiler engines (cengines) which cache/buffer gates are obligated
to flush and send all gates to the next compiler engine (followed by
the flush command).

Note:
    This gate is sent when calling

 @example

eng.flush()

on the MainEngine `eng`.

 */


var FlushGate = exports.FlushGate = function (_FastForwardingGate) {
  _inherits(FlushGate, _FastForwardingGate);

  function FlushGate() {
    _classCallCheck(this, FlushGate);

    return _possibleConstructorReturn(this, (FlushGate.__proto__ || Object.getPrototypeOf(FlushGate)).apply(this, arguments));
  }

  _createClass(FlushGate, [{
    key: 'toString',
    value: function toString() {
      return '';
    }
  }]);

  return FlushGate;
}(_basics.FastForwardingGate);

/**
 * @class MeasureGate
 * @desc Measurement gate class (for single qubits).
 */


var MeasureGate = exports.MeasureGate = function (_FastForwardingGate2) {
  _inherits(MeasureGate, _FastForwardingGate2);

  function MeasureGate() {
    _classCallCheck(this, MeasureGate);

    return _possibleConstructorReturn(this, (MeasureGate.__proto__ || Object.getPrototypeOf(MeasureGate)).apply(this, arguments));
  }

  _createClass(MeasureGate, [{
    key: 'toString',
    value: function toString() {
      return 'Measure';
    }

    /**
      Previously (ProjectQ <= v0.3.6) MeasureGate/Measure was allowed to be
      applied to any number of quantum registers. Now the MeasureGate/Measure
      is strictly a single qubit gate. In the coming releases the backward
      compatibility will be removed!
         */

  }, {
    key: 'or',
    value: function or(qubits) {
      var _this18 = this;

      var num_qubits = 0;
      var qs = _basics.BasicGate.makeTupleOfQureg(qubits);
      qs.forEach(function (qureg) {
        qureg.forEach(function (qubit) {
          num_qubits += 1;
          var cmd = _this18.generateCommand([qubit]);
          cmd.apply();
        });
      });
      if (num_qubits > 1) {
        console.warn('Pending syntax change in future versions of ' + 'ProjectQ: \n Measure will be a single qubit gate ' + 'only. Use `All(Measure) | qureg` instead to ' + 'measure multiple qubits.');
      }
    }
  }]);

  return MeasureGate;
}(_basics.FastForwardingGate);

// Shortcut (instance of) `MeasureGate`


var Measure = exports.Measure = new MeasureGate();

var Deallocate = exports.Deallocate = void 0;

/**
 * @class AllocateQubitGate
 */

var AllocateQubitGate = exports.AllocateQubitGate = function (_ClassicalInstruction) {
  _inherits(AllocateQubitGate, _ClassicalInstruction);

  function AllocateQubitGate() {
    _classCallCheck(this, AllocateQubitGate);

    return _possibleConstructorReturn(this, (AllocateQubitGate.__proto__ || Object.getPrototypeOf(AllocateQubitGate)).apply(this, arguments));
  }

  _createClass(AllocateQubitGate, [{
    key: 'toString',
    value: function toString() {
      return 'Allocate';
    }
  }, {
    key: 'getInverse',
    value: function getInverse() {
      return Deallocate;
    }
  }]);

  return AllocateQubitGate;
}(_basics.ClassicalInstructionGate);

// Shortcut (instance of) `AllocateQubitGate`


var Allocate = exports.Allocate = new AllocateQubitGate();

/**
 * @class DeallocateQubitGate
 */

var DeallocateQubitGate = exports.DeallocateQubitGate = function (_FastForwardingGate3) {
  _inherits(DeallocateQubitGate, _FastForwardingGate3);

  function DeallocateQubitGate() {
    _classCallCheck(this, DeallocateQubitGate);

    return _possibleConstructorReturn(this, (DeallocateQubitGate.__proto__ || Object.getPrototypeOf(DeallocateQubitGate)).apply(this, arguments));
  }

  _createClass(DeallocateQubitGate, [{
    key: 'toString',
    value: function toString() {
      return 'Deallocate';
    }
  }, {
    key: 'getInverse',
    value: function getInverse() {
      return Allocate;
    }
  }]);

  return DeallocateQubitGate;
}(_basics.FastForwardingGate);

// Shortcut (instance of) `DeallocateQubitGate`


exports.Deallocate = Deallocate = new DeallocateQubitGate();

/**
 * @class AllocateDirtyQubitGate
 */

var AllocateDirtyQubitGate = exports.AllocateDirtyQubitGate = function (_ClassicalInstruction2) {
  _inherits(AllocateDirtyQubitGate, _ClassicalInstruction2);

  function AllocateDirtyQubitGate() {
    _classCallCheck(this, AllocateDirtyQubitGate);

    return _possibleConstructorReturn(this, (AllocateDirtyQubitGate.__proto__ || Object.getPrototypeOf(AllocateDirtyQubitGate)).apply(this, arguments));
  }

  _createClass(AllocateDirtyQubitGate, [{
    key: 'toString',
    value: function toString() {
      return 'AllocateDirty';
    }
  }, {
    key: 'getInverse',
    value: function getInverse() {
      return Deallocate;
    }
  }]);

  return AllocateDirtyQubitGate;
}(_basics.ClassicalInstructionGate);

// Shortcut (instance of) AllocateDirtyQubitGate


var AllocateDirty = exports.AllocateDirty = new AllocateDirtyQubitGate();

var Barrier = exports.Barrier = void 0;

var BarrierGate = exports.BarrierGate = function (_BasicGate5) {
  _inherits(BarrierGate, _BasicGate5);

  function BarrierGate() {
    _classCallCheck(this, BarrierGate);

    return _possibleConstructorReturn(this, (BarrierGate.__proto__ || Object.getPrototypeOf(BarrierGate)).apply(this, arguments));
  }

  _createClass(BarrierGate, [{
    key: 'toString',
    value: function toString() {
      return 'Barrier';
    }
  }, {
    key: 'getInverse',
    value: function getInverse() {
      return Barrier;
    }
  }]);

  return BarrierGate;
}(_basics.BasicGate);

// Shortcut (instance of) BarrierGate


exports.Barrier = Barrier = new BarrierGate();

var obj = {};
var _sdag = null;
var _tdag = null;
Object.defineProperties(obj, {
  Sdag: {
    get: function get() {
      if (!_sdag) {
        _sdag = (0, _cycle.getInverse)(S);
      }
      return _sdag;
    }
  },
  Sdagger: {
    get: function get() {
      return obj.Sdag;
    }
  },
  Tdag: {
    get: function get() {
      if (!_tdag) {
        _tdag = (0, _cycle.getInverse)(T);
      }
      return _tdag;
    }
  },
  Tdagger: {
    get: function get() {
      return obj.Tdag;
    }
  }
});

/**
 * @ignore
 */
exports.default = obj;