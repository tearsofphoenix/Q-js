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

var _basics = require('../../cengines/basics');

var _jssim = require('./jssim');

var _jssim2 = _interopRequireDefault(_jssim);

var _cppsim = require('./cppsim');

var _cppsim2 = _interopRequireDefault(_cppsim);

var _gates = require('../../ops/gates');

var _basics2 = require('../../ops/basics');

var _timeevolution = require('../../ops/timeevolution');

var _timeevolution2 = _interopRequireDefault(_timeevolution);

var _qubit = require('../../types/qubit');

var _qubitoperator = require('../../ops/qubitoperator');

var _tag = require('../../meta/tag');

var _util = require('../../libs/util');

var _polyfill = require('../../libs/polyfill');

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
 * @class Simulator
 * @desc
Simulator is a compiler engine which simulates a quantum computer using
C++-based kernels.

    OpenMP is enabled and the number of threads can be controlled using the
OMP_NUM_THREADS environment variable, i.e.

    @example

export OMP_NUM_THREADS=4 # use 4 threads
export OMP_PROC_BIND=spread # bind threads to processors by spreading
 */
var Simulator = function (_BasicEngine) {
  _inherits(Simulator, _BasicEngine);

  /**
   * @constructor
  Construct the C++/JavaScript-simulator object and initialize it with a
  random seed.
      @param {boolean} gate_fusion If true, gates are cached and only executed
  once a certain gate-size has been reached (only has an effect
  for the c++ simulator).
    @param {number} rnd_seed Random seed (uses random.randint(0, 4294967295) by default). Ignored currently!!!
    @param {boolean} forceSimulation if true, will force use cpp simulator
  Example of gate_fusion Instead of applying a Hadamard gate to 5
  qubits, the simulator calculates the kronecker product of the 1-qubit
  gate matrices and then applies one 5-qubit gate. This increases
  operational intensity and keeps the simulator from having to iterate
  through the state vector multiple times. Depending on the system (and,
    especially, number of threads), this may or may not be beneficial.
      Note:
  If the C++ Simulator extension was not built or cannot be found,
    the Simulator defaults to a Javascript implementation of the kernels.
    While this is much slower, it is still good enough to run basic
  quantum algorithms.
      If you need to run large simulations, check out the tutorial in
  the docs which gives futher hints on how to build the C++
  extension.
   */
  function Simulator() {
    var gate_fusion = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var rnd_seed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var forceSimulation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    _classCallCheck(this, Simulator);

    var _this = _possibleConstructorReturn(this, (Simulator.__proto__ || Object.getPrototypeOf(Simulator)).call(this));

    if (!rnd_seed) {
      rnd_seed = Math.random();
    }

    if (!forceSimulation && _cppsim2.default) {
      var S = _cppsim2.default.Simulator;
      _this._simulator = new S(rnd_seed);
    } else {
      _this._simulator = new _jssim2.default(rnd_seed);
    }
    _this._gate_fusion = gate_fusion;
    return _this;
  }

  /**
  Specialized implementation of isAvailable: The simulator can deal
  with all arbitrarily-controlled gates which provide a
  gate-matrix (via gate.matrix) and acts on 5 or less qubits (not
  counting the control qubits).
    @param {Command} cmd Command for which to check availability (single-qubit gate, arbitrary controls)
    @return {boolean} true if it can be simulated and false otherwise.
  */


  _createClass(Simulator, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      if ((0, _util.instanceOf)(cmd.gate, [_gates.MeasureGate, _gates.AllocateQubitGate, _gates.DeallocateQubitGate, _basics2.BasicMathGate, _timeevolution2.default])) {
        return true;
      }
      try {
        var m = cmd.gate.matrix;
        // Allow up to 5-qubit gates

        var _m$size = m.size(),
            _m$size2 = _slicedToArray(_m$size, 2),
            row = _m$size2[0],
            col = _m$size2[1];

        if (row > Math.pow(2, 5) || col > Math.pow(2, 5)) return false;
        return true;
      } catch (e) {
        return false;
      }
    }

    /**
      Converts a qureg from logical to mapped qubits if there is a mapper.
      @param {Array.<Qubit>|Qureg} qureg Logical quantum bits
    */

  }, {
    key: 'convertLogicalToMappedQureg',
    value: function convertLogicalToMappedQureg(qureg) {
      var mapper = this.main.mapper;

      if (mapper) {
        var mapped_qureg = [];
        qureg.forEach(function (qubit) {
          var v = mapper.currentMapping[qubit.id];
          if (typeof v === 'undefined') {
            throw new Error('Unknown qubit id. ' + 'Please make sure you have called ' + 'eng.flush().');
          }
          var new_qubit = new _qubit.BasicQubit(qubit.engine, mapper.currentMapping[qubit.id]);
          mapped_qureg.push(new_qubit);
        });
        return mapped_qureg;
      }
      return qureg;
    }

    /**
    Get the expectation value of qubit_operator w.r.t. the current wave
    function represented by the supplied quantum register.
        @param {QubitOperator} qubitOperator  Operator to measure.
      @param {Array.<Qubit>|Qureg} qureg  Quantum bits to measure.
        @return Expectation value
    Note:
      Make sure all previous commands (especially allocations) have
    passed through the compilation chain (call main.flush() to
    make sure).
    Note:
      If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
      the qureg argument.
        @throws {Error} If `qubit_operator` acts on more qubits than present in the `qureg` argument.
     */

  }, {
    key: 'getExpectationValue',
    value: function getExpectationValue(qubitOperator, qureg) {
      qureg = this.convertLogicalToMappedQureg(qureg);
      var operator = [];
      var num_qubits = qureg.length;
      Object.keys(qubitOperator.terms).forEach(function (term) {
        var keys = (0, _qubitoperator.stringToArray)(term);
        if (term !== '' && keys[keys.length - 1][0] >= num_qubits) {
          throw new Error('qubit_operator acts on more qubits than contained in the qureg.');
        }
        operator.push([keys, qubitOperator.terms[term]]);
      });
      return this._simulator.getExpectationValue(operator, qureg.map(function (qb) {
        return qb.id;
      }));
    }

    /**
    Apply a (possibly non-unitary) qubit_operator to the current wave
    function represented by the supplied quantum register.
        @param {QubitOperator} qubitOperator  Operator to apply.
      @param {Array.<Qubit>|Qureg} qureg Quantum bits to which to apply the
    operator.
        @throws {Error} If `qubit_operator` acts on more qubits than present in the `qureg` argument.
        Warning:
    This function allows applying non-unitary gates and it will not
    re-normalize the wave function! It is for numerical experiments
    only and should not be used for other purposes.
        Note:
    Make sure all previous commands (especially allocations) have
    passed through the compilation chain (call main.flush() to
    make sure).
    Note:
      If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
      the qureg argument.
     */

  }, {
    key: 'applyQubitOperator',
    value: function applyQubitOperator(qubitOperator, qureg) {
      qureg = this.convertLogicalToMappedQureg(qureg);
      var num_qubits = qureg.length;
      var operator = [];
      Object.keys(qubitOperator.terms).forEach(function (term) {
        var keys = (0, _qubitoperator.stringToArray)(term);
        if (term !== '' && keys[keys.length - 1][0] >= num_qubits) {
          throw new Error('qubit_operator acts on more qubits than contained in the qureg.');
        }
        operator.push([keys, qubitOperator.terms[term]]);
      });
      return this._simulator.applyQubitOperator(operator, qureg.map(function (qb) {
        return qb.id;
      }));
    }

    /**
    Return the probability of the outcome `bit_string` when measuring
    the quantum register `qureg`.
        @param {number[]|string} bitString  Measurement outcome.
      @param {Qureg|Array.<Qubit>} qureg Quantum register.
        @returns {number} Probability of measuring the provided bit string.
        Note:
    Make sure all previous commands (especially allocations) have
    passed through the compilation chain (call main.flush() to
    make sure).
    Note:
      If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
      the qureg argument.
     */

  }, {
    key: 'getProbability',
    value: function getProbability(bitString, qureg) {
      qureg = this.convertLogicalToMappedQureg(qureg);
      var bit_string = (0, _polyfill.stringToBitArray)(bitString);
      return this._simulator.getProbability(bit_string, qureg.map(function (qb) {
        return qb.id;
      }));
    }

    /**
    Return the probability amplitude of the supplied `bit_string`.
      The ordering is given by the quantum register `qureg`, which must
    contain all allocated qubits.
       @param {number[]|string} bitString Computational basis state
     @param {Qureg|Array.<Qubit>} qureg Quantum register determining the
    ordering. Must contain all allocated qubits.
        @returns {number}
    Probability amplitude of the provided bit string.
        Note:
    Make sure all previous commands (especially allocations) have
    passed through the compilation chain (call main.flush() to
    make sure).
    Note:
      If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
      the qureg argument.
     */

  }, {
    key: 'getAmplitude',
    value: function getAmplitude(bitString, qureg) {
      qureg = this.convertLogicalToMappedQureg(qureg);
      var bit_string = (0, _polyfill.stringToBitArray)(bitString);
      return this._simulator.getAmplitude(bit_string, qureg.map(function (qb) {
        return qb.id;
      }));
    }

    /**
    Set the wavefunction and the qubit ordering of the simulator.
        The simulator will adopt the ordering of qureg (instead of reordering
    the wavefunction).
      @param {Complex[]} wavefunction  Array of complex amplitudes describing the wavefunction (must be normalized).
    @param {Qureg|Array.<Qubit>} qureg  Quantum register determining the ordering. Must contain all allocated qubits.
        Note:
    Make sure all previous commands (especially allocations) have
    passed through the compilation chain (call main.flush() to
    make sure).
    Note:
      If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
      the qureg argument.
     */

  }, {
    key: 'setWavefunction',
    value: function setWavefunction(wavefunction, qureg) {
      qureg = this.convertLogicalToMappedQureg(qureg);
      this._simulator.setWavefunction(wavefunction, qureg.map(function (qb) {
        return qb.id;
      }));
    }

    /**
    Collapse a quantum register onto a classical basis state.
        @param {Qureg|Array.<Qubit>} qureg Qubits to collapse.
      @param {boolean[]} values  Measurement outcome for each of the qubits
    in `qureg`.
        @throws {Error} If an outcome has probability (approximately) 0 or
    if unknown qubits are provided (see note).
    Note:
      Make sure all previous commands have passed through the
    compilation chain (call main.flush() to make sure).
    Note:
      If there is a mapper present in the compiler, this function
    automatically converts from logical qubits to mapped qubits for
      the qureg argument.
     */

  }, {
    key: 'collapseWavefunction',
    value: function collapseWavefunction(qureg, values) {
      qureg = this.convertLogicalToMappedQureg(qureg);
      return this._simulator.collapseWavefunction(qureg.map(function (qb) {
        return qb.id;
      }), values);
    }

    /**
    Access the ordering of the qubits and the state vector directly.
        This is a cheat function which enables, e.g., more efficient
    evaluation of expectation values and debugging.
        @return {Array}
    A tuple where the first entry is a dictionary mapping qubit
    indices to bit-locations and the second entry is the corresponding
    state vector.
        Note:
    Make sure all previous commands have passed through the
    compilation chain (call main.flush() to make sure).
    Note:
      If there is a mapper present in the compiler, this function
    DOES NOT automatically convert from logical qubits to mapped
    qubits.
     */

  }, {
    key: 'cheat',
    value: function cheat() {
      return this._simulator.cheat();
    }

    /**
    Handle all commands, i.e., call the member functions of the C++-
    simulator object corresponding to measurement, allocation/
    deallocation, and (controlled) single-qubit gate.
        @param {Command} cmd Command to handle.
        @throws Error If a non-single-qubit gate needs to be processed (which should never happen due to isAvailable).
     */

  }, {
    key: 'handle',
    value: function handle(cmd) {
      var _this2 = this;

      if (cmd.gate instanceof _timeevolution2.default) {
        var terms = cmd.gate.hamiltonian.terms;

        var op = [];
        Object.keys(terms).forEach(function (k) {
          var v = terms[k];
          op.push([(0, _qubitoperator.stringToArray)(k), v]);
        });
        var t = cmd.gate.time;
        var qubitids = cmd.qubits[0].map(function (qb) {
          return qb.id;
        });
        var ctrlids = cmd.controlQubits.map(function (qb) {
          return qb.id;
        });
        this._simulator.emulateTimeEvolution(op, t, qubitids, ctrlids);
      } else if (cmd.gate.equal(_gates.Measure)) {
        (0, _assert2.default)(cmd.controlCount === 0);
        var ids = [];
        cmd.qubits.forEach(function (qr) {
          return qr.forEach(function (qb) {
            return ids.push(qb.id);
          });
        });
        var out = this._simulator.measureQubits(ids);
        var i = 0;
        cmd.qubits.forEach(function (qr) {
          qr.forEach(function (qb) {
            // Check if a mapper assigned a different logical id
            var logical_id_tag = void 0;
            cmd.tags.forEach(function (tag) {
              if (tag instanceof _tag.LogicalQubitIDTag) {
                logical_id_tag = tag;
              }
            });
            if (logical_id_tag) {
              qb = new _qubit.BasicQubit(qb.engine, logical_id_tag.logical_qubit_id);
            }
            _this2.main.setMeasurementResult(qb, out[i]);
            i += 1;
          });
        });
      } else if (cmd.gate.equal(_gates.Allocate)) {
        var ID = cmd.qubits[0][0].id;
        this._simulator.allocateQubit(ID);
      } else if (cmd.gate.equal(_gates.Deallocate)) {
        var _ID = cmd.qubits[0][0].id;
        this._simulator.deallocateQubit(_ID);
      } else if (cmd.gate instanceof _basics2.BasicMathGate) {
        var _qubitids = [];
        cmd.qubits.forEach(function (qr) {
          var latest = [];
          _qubitids.push(latest);
          qr.forEach(function (qb) {
            latest.push(qb.id);
          });
        });

        var math_fun = cmd.gate.getMathFunction(cmd.qubits);
        this._simulator.emulateMath(math_fun, _qubitids, cmd.controlQubits.map(function (qb) {
          return qb.id;
        }));
      } else if ((0, _polyfill.len)(cmd.gate.matrix) <= Math.pow(2, 5)) {
        var matrix = cmd.gate.matrix;
        var _ids = [];
        cmd.qubits.forEach(function (qr) {
          return qr.forEach(function (qb) {
            return _ids.push(qb.id);
          });
        });
        if (Math.pow(2, _ids.length) !== (0, _polyfill.len)(matrix)) {
          throw new Error('Simulator: Error applying ' + cmd.gate.toString() + ' gate: ' + _mathjs2.default.log((0, _polyfill.len)(cmd.gate.matrix), 2) + '-qubit gate applied to ' + _ids.length + ' qubits.');
        }
        var m = _mathjs2.default.clone(matrix)._data;
        var ctrls = cmd.controlQubits.map(function (qb) {
          return qb.id;
        });
        this._simulator.applyControlledGate(m, _ids, ctrls);
        if (!this._gate_fusion) {
          this._simulator.run();
        }
      } else {
        throw new Error('This simulator only supports controlled k-qubit' + ' gates with k < 6!\nPlease add an auto-replacer' + ' engine to your list of compiler engines.');
      }
    }

    /**
    Receive a list of commands from the previous engine and handle them
    (simulate them classically) prior to sending them on to the next
    engine.
        @param {Command[]} commandList List of commands to execute on the simulator.
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      commandList.forEach(function (cmd) {
        if (!(cmd.gate instanceof _gates.FlushGate)) {
          _this3.handle(cmd);
        } else {
          _this3._simulator.run();
        }
        if (!_this3.isLastEngine) {
          _this3.send([cmd]);
        }
      });
    }
  }]);

  return Simulator;
}(_basics.BasicEngine);

exports.default = Simulator;