'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ibmqx4_connections = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _itertools = require('itertools');

var _basicmapper = require('./basicmapper');

var _basicmapper2 = _interopRequireDefault(_basicmapper);

var _gates = require('../ops/gates');

var _ibm = require('../backends/ibm/ibm');

var _ibm2 = _interopRequireDefault(_ibm);

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

function stringKeyToIntArray(key) {
  return key.split(',').map(function (i) {
    return parseInt(i, 10);
  });
}

// export const ibmqx4_connections = new Set([2, 1], [4, 2], [2, 0], [3, 2], [3, 4], [1, 0])
/**
 * @type {Set<string>}
 */
var ibmqx4_connections = exports.ibmqx4_connections = new Set(['2,1', '4,2', '2,0', '3,2', '3,4', '1,0']);

/**
 * @class IBM5QubitMapper
 * @desc
Mapper for the 5-qubit IBM backend.

  Maps a given circuit to the IBM Quantum Experience chip.

  Note:
The mapper has to be run once on the entire circuit.

  Warning:
If the provided circuit cannot be mapped to the hardware layout
without performing Swaps, the mapping procedure
**raises an Exception**.
 */

var IBM5QubitMapper = function (_BasicMapperEngine) {
  _inherits(IBM5QubitMapper, _BasicMapperEngine);

  /**
   * @constructor
  Initialize an IBM 5-qubit mapper compiler engine.
    Resets the mapping.
   */
  function IBM5QubitMapper() {
    _classCallCheck(this, IBM5QubitMapper);

    var _this = _possibleConstructorReturn(this, (IBM5QubitMapper.__proto__ || Object.getPrototypeOf(IBM5QubitMapper)).call(this));

    _this.currentMapping = {};
    _this._reset();
    return _this;
  }

  /**
  Check if the IBM backend can perform the Command cmd and return true
  if so.
    @param {Command} cmd The command to check
   */


  _createClass(IBM5QubitMapper, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      return new _ibm2.default().isAvailable(cmd);
    }

    // Reset the mapping parameters so the next circuit can be mapped.

  }, {
    key: '_reset',
    value: function _reset() {
      this._cmds = [];
      this._interactions = {};
    }

    /**
    Check if the command corresponds to a CNOT (controlled NOT gate).
      @param {Command} cmd Command to check whether it is a controlled NOT gate.
    */

  }, {
    key: '_isCNOT',
    value: function _isCNOT(cmd) {
      return cmd.gate instanceof _gates.NOT.constructor && cmd.controlCount === 1;
    }

    /**
    Determines the cost of the circuit with the given mapping.
      @param {Object} mapping Dictionary with key, value pairs where keys are
      logical qubit ids and the corresponding value is the physical
      location on the IBM Q chip.
    @return {number} Cost measure taking into account CNOT directionality or None
      if the circuit cannot be executed given the mapping.
    */

  }, {
    key: 'determineCost',
    value: function determineCost(mapping) {
      var cost = 0;
      var connections = ibmqx4_connections;
      var keys = Object.keys(this._interactions);
      for (var i = 0; i < keys.length; ++i) {
        var tpl = stringKeyToIntArray(keys[i]);
        var ctrl_id = tpl[0];
        var target_id = tpl[1];
        var ctrl_pos = mapping[ctrl_id];
        var target_pos = mapping[target_id];
        var k = ctrl_pos + ',' + target_pos;
        var v = connections.has(k);
        if (!v) {
          k = target_pos + ',' + ctrl_pos;
          v = connections.has(k);
          if (v) {
            cost += this._interactions[tpl];
          } else {
            return undefined;
          }
        }
      }
      return cost;
    }

    /**
    Runs all stored gates.
      @throws {Error}
    If the mapping to the IBM backend cannot be performed or if
    the mapping was already determined but more CNOTs get sent
    down the pipeline.
     */

  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      if (Object.keys(this._currentMapping).length > 0 && Math.max.apply(Math, _toConsumableArray(Object.values(this._currentMapping))) > 4) {
        throw new Error('Too many qubits allocated. The IBM Q ' + 'device supports at most 5 qubits and no ' + 'intermediate measurements / ' + 'reallocations.');
      }
      if (Object.keys(this._interactions).length > 0) {
        (function () {
          var logical_ids = Object.keys(_this2._currentMapping).map(function (k) {
            return parseInt(k, 10);
          });
          var best_mapping = _this2._currentMapping;
          var best_cost = void 0;

          var _loop = function _loop(physical_ids) {
            var mapping = {};
            physical_ids.forEach(function (looper, i) {
              return mapping[logical_ids[i]] = looper;
            });
            var new_cost = _this2.determineCost(mapping);
            if (new_cost) {
              if (!best_cost || new_cost < best_cost) {
                best_cost = new_cost;
                best_mapping = mapping;
              }
            }
          };

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = (0, _itertools.permutations)([0, 1, 2, 3, 4], logical_ids.length)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var physical_ids = _step.value;

              _loop(physical_ids);
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

          if (!best_cost) {
            throw new Error('Circuit cannot be mapped without using Swaps. Mapping failed.');
          }
          _this2._interactions = {};
          _this2.currentMapping = best_mapping;
        })();
      }

      this._cmds.forEach(function (cmd) {
        return _this2.sendCMDWithMappedIDs(cmd);
      });

      this._cmds = [];
    }

    /**
    Store a command and handle CNOTs.
      @param {Command} cmd A command to store
     */

  }, {
    key: '_store',
    value: function _store(cmd) {
      var target = void 0;
      if (!(cmd.gate instanceof _gates.FlushGate)) {
        target = cmd.qubits[0][0].id;
      }

      if (this._isCNOT(cmd)) {
        // CNOT encountered
        var ctrl = cmd.controlQubits[0].id;
        var key = [ctrl, target];
        var v = this._interactions[key];
        if (typeof v === 'undefined') {
          this._interactions[key] = 0;
        }
        this._interactions[key] += 1;
      } else if (cmd.gate.equal(_gates.Allocate)) {
        var _v = this._currentMapping[target];
        if (typeof _v === 'undefined') {
          var newMax = 0;
          if (Object.keys(this._currentMapping).length > 0) {
            newMax = Math.max.apply(Math, _toConsumableArray(Object.values(this._currentMapping))) + 1;
          }
          this._currentMapping[target] = newMax;
        }
      }
      this._cmds.push(cmd);
    }

    /**
    Receives a command list and, for each command, stores it until
    completion.
      @param {Command[]} commandList list of commands to receive.
      @throws {Error} If mapping the CNOT gates to 1 qubit would require
    Swaps. The current version only supports remapping of CNOT
    gates without performing any Swaps due to the large costs
    associated with Swapping given the CNOT constraints.
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      commandList.forEach(function (cmd) {
        _this3._store(cmd);
        if (cmd.gate instanceof _gates.FlushGate) {
          _this3.run();
          _this3._reset();
        }
      });
    }
  }]);

  return IBM5QubitMapper;
}(_basicmapper2.default);

exports.default = IBM5QubitMapper;