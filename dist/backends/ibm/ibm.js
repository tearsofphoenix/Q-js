'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _IBMBackend$gateNames;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _basics = require('../../cengines/basics');

var _gates = require('../../ops/gates');

var _gates2 = _interopRequireDefault(_gates);

var _tag = require('../../meta/tag');

var _ibmhttpclient = require('./ibmhttpclient');

var _ibmhttpclient2 = _interopRequireDefault(_ibmhttpclient);

var _util = require('../../libs/util');

require('../../ops/metagates');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

var Tdag = _gates2.default.Tdag,
    Sdag = _gates2.default.Sdag;
/**
 * @class IBMBackend
 * @desc
The IBM Backend class, which stores the circuit, transforms it to JSON
QASM, and sends the circuit through the IBM API.
 */

var IBMBackend = function (_BasicEngine) {
  _inherits(IBMBackend, _BasicEngine);

  /**
   * @constructor
  @param {{use_hardware: boolean, num_runs: number, verbose: boolean, user: string, password: string, device: string, retrieve_execution: ?string}} args
    use_hardware: If true, the code is run on the IBM quantum chip (instead of using the IBM simulator)
    num_runs: Number of runs to collect statistics. (default is 1024)
    verbose: If true, statistics are printed, in addition to the measurement result being registered (at the end of the circuit).
    user: IBM Quantum Experience user name
    password: IBM Quantum Experience password
    device: Device to use ('ibmqx4', or 'ibmqx5') if use_hardware is set to true. Default is ibmqx4.
    retrieve_execution: Job ID to retrieve instead of re-running the circuit (e.g., if previous run timed out).
  */
  function IBMBackend() {
    _classCallCheck(this, IBMBackend);

    var _this = _possibleConstructorReturn(this, (IBMBackend.__proto__ || Object.getPrototypeOf(IBMBackend)).call(this));

    _this._reset();
    _this._errors = [];
    var use_hardware = false;
    var num_runs = 1024;
    var verbose = false;
    var user = null;
    var password = null;
    var device = 'ibmqx4';
    var retrieve_execution = null;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (_typeof(args[0]) === 'object') {
      var obj = args[0];
      use_hardware = use_hardware || obj.use_hardware;
      num_runs = num_runs || obj.num_runs;
      verbose = verbose || obj.verbose;
      user = user || obj.user;
      password = password || obj.password;
      device = device || obj.device;
      retrieve_execution = retrieve_execution || obj.retrieve_execution;
    } else {
      use_hardware = args[0];
      num_runs = args[1];
      verbose = args[2];
      user = args[3];
      password = args[4];
      device = args[5];
      retrieve_execution = args[6];
    }

    num_runs = num_runs || 1024;
    device = device || 'ibmqx4';
    if (use_hardware) {
      _this.device = device;
    } else {
      _this.device = 'simulator';
    }
    _this._num_runs = num_runs;
    _this._verbose = verbose;
    _this._user = user;
    _this._password = password;
    _this._probabilities = {};
    _this.qasm = '';
    _this._measured_ids = [];
    _this._allocated_qubits = new Set();
    _this._retrieve_execution = retrieve_execution;
    return _this;
  }

  /**
  Return true if the command can be executed.
      The IBM quantum chip can do X, Y, Z, T, Tdag, S, Sdag,
    rotation gates, barriers, and CX / CNOT.
      @param {Command} cmd Command for which to check availability
    @return {boolean}
   */


  _createClass(IBMBackend, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      var g = cmd.gate;
      var controlCount = cmd.controlCount;
      if (g.equal(_gates.NOT) && controlCount <= 1) {
        return true;
      }
      if (controlCount === 0) {
        var _set = [_gates.T, Tdag, _gates.S, Sdag, _gates.H, _gates.Y, _gates.Z];
        if (_set.includes(g)) {
          return true;
        }
        if (g instanceof _gates.Rx || g instanceof _gates.Ry || g instanceof _gates.Rz) {
          return true;
        }
      }
      var set = [_gates.Measure, _gates.Allocate, _gates.Deallocate, _gates.Barrier];
      if (set.includes(g)) {
        return true;
      }
      return false;
    }

    // Reset all temporary variables (after flush gate).

  }, {
    key: '_reset',
    value: function _reset() {
      this._clear = true;
      this._measured_ids = [];
    }

    /**
    Temporarily store the command cmd.
      Translates the command and stores it in a local variable (this._cmds).
      @param {Command} cmd Command to store
    */

  }, {
    key: '_store',
    value: function _store(cmd) {
      if (this._clear) {
        this._probabilities = {};
        this._clear = false;
        this.qasm = '';
        this._allocated_qubits = new Set();
      }

      var gate = cmd.gate;


      if (gate.equal(_gates.Allocate)) {
        this._allocated_qubits.add(cmd.qubits[0][0].id);
        return;
      }

      if (gate.equal(_gates.Deallocate)) {
        return;
      }

      if (gate.equal(_gates.Measure)) {
        (0, _assert2.default)(cmd.qubits.length === 1 && cmd.qubits[0].length === 1);
        var qb_id = cmd.qubits[0][0].id;
        var logical_id = void 0;
        for (var i = 0; i < cmd.tags.length; ++i) {
          var t = cmd.tags[i];
          if (t instanceof _tag.LogicalQubitIDTag) {
            logical_id = t.logical_qubit_id;
            break;
          }
        }
        (0, _assert2.default)(typeof logical_id !== 'undefined');
        this._measured_ids.push(logical_id);
      } else if (gate === _gates.NOT && cmd.controlCount === 1) {
        var ctrl_pos = cmd.controlQubits[0].id;
        var qb_pos = cmd.qubits[0][0].id;
        this.qasm += '\ncx q[' + ctrl_pos + '], q[' + qb_pos + '];';
      } else if (gate === _gates.Barrier) {
        var _qb_pos = [];
        cmd.qubits.forEach(function (qr) {
          return qr.forEach(function (qb) {
            return _qb_pos.push(qb.id);
          });
        });
        this.qasm += '\nbarrier ';
        var qb_str = '';
        _qb_pos.forEach(function (pos) {
          qb_str += 'q[' + pos + ']';
        });

        this.qasm += qb_str.substring(0, qb_str.length - 2) + ';';
      } else if ((0, _util.instanceOf)(gate, [_gates.Rx, _gates.Ry, _gates.Rz])) {
        (0, _assert2.default)(cmd.controlCount === 0);
        var _qb_pos2 = cmd.qubits[0][0].id;
        var u_strs = {
          Rx: function Rx(a) {
            return 'u3(' + a + ', -pi/2, pi/2)';
          },
          Ry: function Ry(a) {
            return 'u3(' + a + ', 0, 0)';
          },
          Rz: function Rz(a) {
            return 'u1(' + a + ')';
          }
        };
        var gateASM = u_strs[gate.toString().substring(0, 2)](gate.angle);
        this.qasm += '\n' + gateASM + ' q[' + _qb_pos2 + '];';
      } else {
        if (cmd.controlCount !== 0) {
          console.log(187, cmd.toString());
        }
        (0, _assert2.default)(cmd.controlCount === 0);
        var key = gate.toString();
        var v = IBMBackend.gateNames[key];
        var gate_str = void 0;
        if (typeof v !== 'undefined') {
          gate_str = v;
        } else {
          gate_str = key.toLowerCase();
        }

        var _qb_pos3 = cmd.qubits[0][0].id;
        this.qasm += '\n' + gate_str + ' q[' + _qb_pos3 + '];';
      }
    }

    /**
    Return the physical location of the qubit with the given logical id.
        @param {number} qbID ID of the logical qubit whose position should be returned.
     */

  }, {
    key: '_logicalToPhysical',
    value: function _logicalToPhysical(qbID) {
      (0, _assert2.default)(!!this.main.mapper);
      var mapping = this.main.mapper.currentMapping;
      var v = mapping[qbID];
      if (typeof v === 'undefined') {
        throw new Error('Unknown qubit id ' + qbID + '. Please make sure \n      eng.flush() was called and that the qubit \n      was eliminated during optimization.');
      }
      return v;
    }

    /**
    Return the list of basis states with corresponding probabilities.
        The measured bits are ordered according to the supplied quantum
    register, i.e., the left-most bit in the state-string corresponds to
    the first qubit in the supplied quantum register.
        Warning:
    Only call this function after the circuit has been executed!
        @param {Array.<Qubit>|Qureg} qureg Quantum register determining the order of the qubits.
        @return {Object} Dictionary mapping n-bit strings to probabilities.
        @throws {Error} If no data is available (i.e., if the circuit has
    not been executed). Or if a qubit was supplied which was not
    present in the circuit (might have gotten optimized away).
     */

  }, {
    key: 'getProbabilities',
    value: function getProbabilities(qureg) {
      var _this2 = this;

      if (Object.keys(this._probabilities).length === 0) {
        throw new Error('Please, run the circuit first!');
      }

      var probability_dict = {};

      this._probabilities.forEach(function (state) {
        var mapped_state = [];
        for (var i = 0; i < qureg.length; ++i) {
          mapped_state.push('0');
        }

        for (var _i = 0; _i < qureg.length; ++_i) {
          mapped_state[_i] = state[_this2._logicalToPhysical(qureg[_i].id)];
        }
        var probability = _this2._probabilities[state];
        probability_dict[mapped_state.join('')] = probability;
      });

      return probability_dict;
    }

    /**
    Run the circuit.
        Send the circuit via the IBM API (JSON QASM) using the provided user
    data / ask for username & password.
     */

  }, {
    key: 'run',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this3 = this;

        var max_qubit_id, nq, qasm, info, infoJSON, res, counts, P, p_sum, measured, QB;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this.qasm.length === 0)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return');

              case 2:
                // finally: add measurements (no intermediate measurements are allowed)
                this._measured_ids.forEach(function (measured_id) {
                  var qb_loc = _this3.main.mapper.currentMapping[measured_id];
                  _this3.qasm += 'measure q[' + qb_loc + '] -> c[' + qb_loc + '];';
                });
                max_qubit_id = -1;

                this._allocated_qubits.forEach(function (id) {
                  if (id > max_qubit_id) {
                    max_qubit_id = id;
                  }
                });

                nq = max_qubit_id + 1;
                qasm = '\ninclude "qelib1.inc";\nqreg q[' + nq + '];\ncreg c[' + nq + '];' + this.qasm;
                info = {};

                info.qasms = [{ qasm: qasm }];
                info.shots = this._num_runs;
                info.maxCredits = 5;
                info.backend = { 'name': this.device };
                infoJSON = JSON.stringify(info);
                _context.prev = 13;
                res = void 0;

                if (this._retrieve_execution) {
                  _context.next = 21;
                  break;
                }

                _context.next = 18;
                return _ibmhttpclient2.default.send(infoJSON, this.device, this._user, this._password, this._num_runs, this._verbose);

              case 18:
                res = _context.sent;
                _context.next = 24;
                break;

              case 21:
                _context.next = 23;
                return _ibmhttpclient2.default.retrieve(this.device, this._user, this._password, this._retrieve_execution);

              case 23:
                res = _context.sent;

              case 24:
                counts = res.data.counts;
                // Determine random outcome

                P = Math.random();
                p_sum = 0.0;
                measured = '';

                Object.keys(counts).forEach(function (state) {
                  var probability = counts[state] * 1.0 / _this3._num_runs;
                  if (Array.isArray(state)) {
                    state = state.slice(0).reverse();
                    state = ''.join(state);
                  }
                  p_sum += probability;
                  var star = '';
                  if (p_sum >= P && measured === '') {
                    measured = state;
                    star = '*';
                  }
                  _this3._probabilities[state] = probability;
                  if (_this3._verbose && probability > 0) {
                    console.log(state.toString() + ' with p = ' + probability.toString() + star);
                  }
                });

                QB = function QB(ID) {
                  _classCallCheck(this, QB);

                  this.id = ID;
                };

                // register measurement result


                this._measured_ids.forEach(function (ID) {
                  var location = _this3._logicalToPhysical(ID);
                  var result = measured[location];
                  _this3.main.setMeasurementResult(new QB(ID), result);
                });
                this._reset();
                _context.next = 38;
                break;

              case 34:
                _context.prev = 34;
                _context.t0 = _context['catch'](13);

                console.log(347, _context.t0);
                throw new Error('Failed to run the circuit. Aborting.');

              case 38:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[13, 34]]);
      }));

      function run() {
        return _ref.apply(this, arguments);
      }

      return run;
    }()

    /**
    Receives a command list and, for each command, stores it until
    completion.
        @param {Command[]} commandList List of commands to execute
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this4 = this;

      commandList.forEach(function (cmd) {
        if (!(cmd.gate instanceof _gates.FlushGate)) {
          _this4._store(cmd);
        } else {
          _this4.run().then(function () {
            return _this4._reset();
          }).catch(function (e) {
            console.log(e);
            _this4.addError(e);
          }).finally(function () {
            if (_this4.didRunCallback) {
              _this4.didRunCallback();
            }
          });
        }
      });
    }

    /**
     * @return {Error[]}
     */

  }, {
    key: 'addError',
    value: function addError(error) {
      this._errors.push(error);
    }

    /**
     * @return {function}
     */

  }, {
    key: 'errors',
    get: function get() {
      return this._errors;
    }
  }, {
    key: 'didRunCallback',
    get: function get() {
      return this._didRunCallback;
    }

    /**
     * @param {function} callback
     */
    ,
    set: function set(callback) {
      this._didRunCallback = callback;
    }
  }]);

  return IBMBackend;
}(_basics.BasicEngine);

exports.default = IBMBackend;


IBMBackend.gateNames = (_IBMBackend$gateNames = {}, _defineProperty(_IBMBackend$gateNames, Tdag.toString(), 'tdg'), _defineProperty(_IBMBackend$gateNames, Sdag.toString(), 'sdg'), _IBMBackend$gateNames);