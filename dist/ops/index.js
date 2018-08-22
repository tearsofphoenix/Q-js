'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tensor = exports.C = exports.DaggeredGate = exports.ControlledGate = exports.All = exports.Gates = exports.ZGate = exports.YGate = exports.Y = exports.XGate = exports.TGate = exports.T = exports.SqrtXGate = exports.SqrtX = exports.SqrtSwapGate = exports.SqrtSwap = exports.SGate = exports.S = exports.Ph = exports.NOT = exports.EntangleGate = exports.DeallocateQubitGate = exports.BarrierGate = exports.AllocateDirtyQubitGate = exports.AllocateDirty = exports.AllocateQubitGate = exports.MeasureGate = exports.Barrier = exports.Swap = exports.SwapGate = exports.Allocate = exports.Deallocate = exports.FlushGate = exports.HGate = exports.H = exports.Z = exports.X = exports.Measure = exports.Entangle = exports.Rz = exports.Ry = exports.Rx = exports.R = exports.SelfInverseGate = exports.ClassicalInstructionGate = exports.FastForwardingGate = exports.BasicPhaseGate = exports.BasicRotationGate = exports.BasicMathGate = exports.BasicGate = exports.Command = exports.QFT = exports.QFTGate = exports.QubitOperator = exports.CZ = exports.CX = exports.Toffoli = exports.CRz = exports.CNOT = exports.TimeEvolution = undefined;

var _shortcuts = require('./shortcuts');

Object.defineProperty(exports, 'CNOT', {
  enumerable: true,
  get: function get() {
    return _shortcuts.CNOT;
  }
});
Object.defineProperty(exports, 'CRz', {
  enumerable: true,
  get: function get() {
    return _shortcuts.CRz;
  }
});
Object.defineProperty(exports, 'Toffoli', {
  enumerable: true,
  get: function get() {
    return _shortcuts.Toffoli;
  }
});
Object.defineProperty(exports, 'CX', {
  enumerable: true,
  get: function get() {
    return _shortcuts.CX;
  }
});
Object.defineProperty(exports, 'CZ', {
  enumerable: true,
  get: function get() {
    return _shortcuts.CZ;
  }
});

var _qftgate = require('./qftgate');

Object.defineProperty(exports, 'QFT', {
  enumerable: true,
  get: function get() {
    return _qftgate.QFT;
  }
});

var _basics = require('./basics');

Object.defineProperty(exports, 'BasicGate', {
  enumerable: true,
  get: function get() {
    return _basics.BasicGate;
  }
});
Object.defineProperty(exports, 'BasicMathGate', {
  enumerable: true,
  get: function get() {
    return _basics.BasicMathGate;
  }
});
Object.defineProperty(exports, 'BasicRotationGate', {
  enumerable: true,
  get: function get() {
    return _basics.BasicRotationGate;
  }
});
Object.defineProperty(exports, 'BasicPhaseGate', {
  enumerable: true,
  get: function get() {
    return _basics.BasicPhaseGate;
  }
});
Object.defineProperty(exports, 'FastForwardingGate', {
  enumerable: true,
  get: function get() {
    return _basics.FastForwardingGate;
  }
});
Object.defineProperty(exports, 'ClassicalInstructionGate', {
  enumerable: true,
  get: function get() {
    return _basics.ClassicalInstructionGate;
  }
});
Object.defineProperty(exports, 'SelfInverseGate', {
  enumerable: true,
  get: function get() {
    return _basics.SelfInverseGate;
  }
});

var _gates = require('./gates');

Object.defineProperty(exports, 'R', {
  enumerable: true,
  get: function get() {
    return _gates.R;
  }
});
Object.defineProperty(exports, 'Rx', {
  enumerable: true,
  get: function get() {
    return _gates.Rx;
  }
});
Object.defineProperty(exports, 'Ry', {
  enumerable: true,
  get: function get() {
    return _gates.Ry;
  }
});
Object.defineProperty(exports, 'Rz', {
  enumerable: true,
  get: function get() {
    return _gates.Rz;
  }
});
Object.defineProperty(exports, 'Entangle', {
  enumerable: true,
  get: function get() {
    return _gates.Entangle;
  }
});
Object.defineProperty(exports, 'Measure', {
  enumerable: true,
  get: function get() {
    return _gates.Measure;
  }
});
Object.defineProperty(exports, 'X', {
  enumerable: true,
  get: function get() {
    return _gates.X;
  }
});
Object.defineProperty(exports, 'Z', {
  enumerable: true,
  get: function get() {
    return _gates.Z;
  }
});
Object.defineProperty(exports, 'H', {
  enumerable: true,
  get: function get() {
    return _gates.H;
  }
});
Object.defineProperty(exports, 'HGate', {
  enumerable: true,
  get: function get() {
    return _gates.HGate;
  }
});
Object.defineProperty(exports, 'FlushGate', {
  enumerable: true,
  get: function get() {
    return _gates.FlushGate;
  }
});
Object.defineProperty(exports, 'Deallocate', {
  enumerable: true,
  get: function get() {
    return _gates.Deallocate;
  }
});
Object.defineProperty(exports, 'Allocate', {
  enumerable: true,
  get: function get() {
    return _gates.Allocate;
  }
});
Object.defineProperty(exports, 'SwapGate', {
  enumerable: true,
  get: function get() {
    return _gates.SwapGate;
  }
});
Object.defineProperty(exports, 'Swap', {
  enumerable: true,
  get: function get() {
    return _gates.Swap;
  }
});
Object.defineProperty(exports, 'Barrier', {
  enumerable: true,
  get: function get() {
    return _gates.Barrier;
  }
});
Object.defineProperty(exports, 'MeasureGate', {
  enumerable: true,
  get: function get() {
    return _gates.MeasureGate;
  }
});
Object.defineProperty(exports, 'AllocateQubitGate', {
  enumerable: true,
  get: function get() {
    return _gates.AllocateQubitGate;
  }
});
Object.defineProperty(exports, 'AllocateDirty', {
  enumerable: true,
  get: function get() {
    return _gates.AllocateDirty;
  }
});
Object.defineProperty(exports, 'AllocateDirtyQubitGate', {
  enumerable: true,
  get: function get() {
    return _gates.AllocateDirtyQubitGate;
  }
});
Object.defineProperty(exports, 'BarrierGate', {
  enumerable: true,
  get: function get() {
    return _gates.BarrierGate;
  }
});
Object.defineProperty(exports, 'DeallocateQubitGate', {
  enumerable: true,
  get: function get() {
    return _gates.DeallocateQubitGate;
  }
});
Object.defineProperty(exports, 'EntangleGate', {
  enumerable: true,
  get: function get() {
    return _gates.EntangleGate;
  }
});
Object.defineProperty(exports, 'NOT', {
  enumerable: true,
  get: function get() {
    return _gates.NOT;
  }
});
Object.defineProperty(exports, 'Ph', {
  enumerable: true,
  get: function get() {
    return _gates.Ph;
  }
});
Object.defineProperty(exports, 'S', {
  enumerable: true,
  get: function get() {
    return _gates.S;
  }
});
Object.defineProperty(exports, 'SGate', {
  enumerable: true,
  get: function get() {
    return _gates.SGate;
  }
});
Object.defineProperty(exports, 'SqrtSwap', {
  enumerable: true,
  get: function get() {
    return _gates.SqrtSwap;
  }
});
Object.defineProperty(exports, 'SqrtSwapGate', {
  enumerable: true,
  get: function get() {
    return _gates.SqrtSwapGate;
  }
});
Object.defineProperty(exports, 'SqrtX', {
  enumerable: true,
  get: function get() {
    return _gates.SqrtX;
  }
});
Object.defineProperty(exports, 'SqrtXGate', {
  enumerable: true,
  get: function get() {
    return _gates.SqrtXGate;
  }
});
Object.defineProperty(exports, 'T', {
  enumerable: true,
  get: function get() {
    return _gates.T;
  }
});
Object.defineProperty(exports, 'TGate', {
  enumerable: true,
  get: function get() {
    return _gates.TGate;
  }
});
Object.defineProperty(exports, 'XGate', {
  enumerable: true,
  get: function get() {
    return _gates.XGate;
  }
});
Object.defineProperty(exports, 'Y', {
  enumerable: true,
  get: function get() {
    return _gates.Y;
  }
});
Object.defineProperty(exports, 'YGate', {
  enumerable: true,
  get: function get() {
    return _gates.YGate;
  }
});
Object.defineProperty(exports, 'ZGate', {
  enumerable: true,
  get: function get() {
    return _gates.ZGate;
  }
});

var _metagates = require('./metagates');

Object.defineProperty(exports, 'All', {
  enumerable: true,
  get: function get() {
    return _metagates.All;
  }
});
Object.defineProperty(exports, 'ControlledGate', {
  enumerable: true,
  get: function get() {
    return _metagates.ControlledGate;
  }
});
Object.defineProperty(exports, 'DaggeredGate', {
  enumerable: true,
  get: function get() {
    return _metagates.DaggeredGate;
  }
});
Object.defineProperty(exports, 'C', {
  enumerable: true,
  get: function get() {
    return _metagates.C;
  }
});
Object.defineProperty(exports, 'Tensor', {
  enumerable: true,
  get: function get() {
    return _metagates.Tensor;
  }
});

var _timeevolution = require('./timeevolution');

var _timeevolution2 = _interopRequireDefault(_timeevolution);

var _qubitoperator = require('./qubitoperator');

var _qubitoperator2 = _interopRequireDefault(_qubitoperator);

var _qftgate2 = _interopRequireDefault(_qftgate);

var _command = require('./command');

var _command2 = _interopRequireDefault(_command);

var _gates2 = _interopRequireDefault(_gates);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.TimeEvolution = _timeevolution2.default; /*
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

exports.QubitOperator = _qubitoperator2.default;
exports.QFTGate = _qftgate2.default;
exports.Command = _command2.default;
exports.Gates = _gates2.default;