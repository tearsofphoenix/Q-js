'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();
/*
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

/*
Mapper for a quantum circuit to a linear chain of qubits.

    Input: Quantum circuit with 1 and 2 qubit gates on n qubits. Gates are assumed
to be applied in parallel if they act on disjoint qubit(s) and any pair
of qubits can perform a 2 qubit gate (all-to-all connectivity)
Output: Quantum circuit in which qubits are placed in 1-D chain in which only
nearest neighbour qubits can perform a 2 qubit gate. The mapper uses
Swap gates in order to move qubits next to each other.
*/

exports.return_swap_depth = return_swap_depth;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _basicmapper = require('./basicmapper');

var _basicmapper2 = _interopRequireDefault(_basicmapper);

var _polyfill = require('../libs/polyfill');

var _gates = require('../ops/gates');

var _qubit = require('../types/qubit');

var _util = require('../libs/util');

var _command = require('../ops/command');

var _command2 = _interopRequireDefault(_command);

var _meta = require('../meta');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * @ignore
 Returns the circuit depth to execute these swaps.
 @param {Array.<Array>} swaps Each tuple contains two integers representing the two IDs of the qubits involved in the
    Swap operation
 @returns {number} Circuit depth to execute these swaps.
 */
function return_swap_depth(swaps) {
  var depth_of_qubits = {};
  swaps.forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        qb0_id = _ref2[0],
        qb1_id = _ref2[1];

    if (!(qb0_id in depth_of_qubits)) {
      depth_of_qubits[qb0_id] = 0;
    }
    if (!(qb1_id in depth_of_qubits)) {
      depth_of_qubits[qb1_id] = 0;
    }
    var max_depth = Math.max(depth_of_qubits[qb0_id], depth_of_qubits[qb1_id]);
    depth_of_qubits[qb0_id] = max_depth + 1;
    depth_of_qubits[qb1_id] = max_depth + 1;
  });
  var values = Object.values(depth_of_qubits);
  values.push(0);
  return Math.max.apply(Math, _toConsumableArray(values));
}

/**
 * @class LinearMapper
 * @desc
Maps a quantum circuit to a linear chain of nearest neighbour interactions.

    Maps a quantum circuit to a linear chain of qubits with nearest neighbour
interactions using Swap gates. It supports open or cyclic boundary
conditions.

    Attributes:
current_mapping:  Stores the mapping: key is logical qubit id, value
is mapped qubit id from 0,...,this.num_qubits
cyclic (Bool): If chain is cyclic or not
storage (int): Number of gate it caches before mapping.
num_mappings (int): Number of times the mapper changed the mapping
depth_of_swaps (dict): Key are circuit depth of swaps, value is the
number of such mappings which have been
applied
num_of_swaps_per_mapping (dict): Key are the number of swaps per
mapping, value is the number of such
mappings which have been applied

Note:
    1) Gates are cached and only mapped from time to time. A
FastForwarding gate doesn't empty the cache, only a FlushGate does.
2) Only 1 and two qubit gates allowed.
3) Does not optimize for dirty qubits.
 */

var LinearMapper = function (_BasicMapperEngine) {
  _inherits(LinearMapper, _BasicMapperEngine);

  /**
   * @constructor
  Initialize a LinearMapper compiler engine.
      @param {number} num_qubits Number of physical qubits in the linear chain
    @param {boolean} cyclic If 1D chain is a cycle. Default is false.
    @param {number} storage Number of gates to temporarily store, default is 1000
  */
  function LinearMapper(num_qubits) {
    var cyclic = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var storage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;

    _classCallCheck(this, LinearMapper);

    var _this = _possibleConstructorReturn(this, (LinearMapper.__proto__ || Object.getPrototypeOf(LinearMapper)).call(this));

    _this.num_qubits = num_qubits;
    _this.cyclic = cyclic;
    _this.storage = storage;
    // Storing commands
    _this._stored_commands = [];
    // Logical qubit ids for which the Allocate gate has already been
    // processed and sent to the next engine but which are not yet
    // deallocated:
    _this._currently_allocated_ids = new Set();
    // Statistics:
    _this.num_mappings = 0;
    _this.depth_of_swaps = {};
    _this.num_of_swaps_per_mapping = {};
    return _this;
  }

  // Only allows 1 or two qubit gates.


  _createClass(LinearMapper, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      var num_qubits = 0;
      cmd.allQubits.forEach(function (qureg) {
        return num_qubits += (0, _polyfill.len)(qureg);
      });
      return num_qubits <= 2;
    }

    /**
     * @static
    Builds a mapping of qubits to a linear chain.
        It goes through stored_commands and tries to find a mapping to apply these gates
      on a first come first served basis. More compilicated scheme could try to optimize to apply
     as many gates as possible between the Swaps.
        @param {number} num_qubits Total number of qubits in the linear chain
      @param {boolean} cyclic If linear chain is a cycle.
      @param {Set<Number>} currently_allocated_ids Logical qubit ids for which
        the Allocate gate has already been processed and sent to the next engine but which are
        not yet deallocated and hence need to be included in the new mapping.
      @param {Command[]} stored_commands Future commands which should be applied next.
      @param {Object} current_mapping A current mapping as a dict. key is logical qubit id, value is placement id.
        If there are different possible maps, this current mapping is used to minimize the swaps
        to go to the new mapping by a heuristic.
        @return {Object} A new mapping as a dict. key is logical qubit id, value is placement id
     */

  }, {
    key: '_oddEvenTranspositionSortSwaps',


    /**
    Returns the swap operation for an odd-even transposition sort.
      @see https://en.wikipedia.org/wiki/Odd-even_sort
      @param {Object} old_mapping keys are logical ids and values are mapped qubit ids
    @param {Object} new_mapping dict: keys are logical ids and values are mapped qubit ids
    @return {Array} List of tuples. Each tuple is a swap operation which needs to be
    applied. Tuple contains the two MappedQubit ids for the Swap.
    */
    value: function _oddEvenTranspositionSortSwaps(old_mapping, new_mapping) {
      var final_positions = new Array(this.num_qubits);
      // move qubits which are in both mappings
      Object.keys(old_mapping).forEach(function (logical_id) {
        if (logical_id in new_mapping) {
          final_positions[old_mapping[logical_id]] = new_mapping[logical_id];
        }
      });
      // exchange all remaining None with the not yet used mapped ids
      var used_mapped_ids = new Set(final_positions);
      used_mapped_ids.delete(undefined);
      var all_ids = (0, _polyfill.setFromRange)(this.num_qubits);
      var not_used_mapped_ids = Array.from((0, _polyfill.setDifference)(all_ids, used_mapped_ids));
      not_used_mapped_ids = not_used_mapped_ids.sort().reverse();
      for (var i = 0; i < final_positions.length; ++i) {
        var looper = final_positions[i];
        if (typeof looper === 'undefined') {
          final_positions[i] = not_used_mapped_ids.pop();
        }
      }
      (0, _assert2.default)((0, _polyfill.len)(not_used_mapped_ids) === 0);
      // Start sorting:
      var swap_operations = [];
      var finished_sorting = false;
      while (!finished_sorting) {
        finished_sorting = true;
        for (var _i = 1; _i < (0, _polyfill.len)(final_positions); _i += 2) {
          if (final_positions[_i] > final_positions[_i + 1]) {
            swap_operations.push((0, _util.tuple)(_i, _i + 1));
            var tmp = final_positions[_i];
            final_positions[_i] = final_positions[_i + 1];
            final_positions[_i + 1] = tmp;
            finished_sorting = false;
          }
        }
        for (var _i2 = 0; _i2 < (0, _polyfill.len)(final_positions) - 1; _i2 += 2) {
          if (final_positions[_i2] > final_positions[_i2 + 1]) {
            swap_operations.push((0, _util.tuple)(_i2, _i2 + 1));
            var _tmp = final_positions[_i2];
            final_positions[_i2] = final_positions[_i2 + 1];
            final_positions[_i2 + 1] = _tmp;
            finished_sorting = false;
          }
        }
      }
      return swap_operations;
    }

    /**
    Sends the stored commands possible without changing the mapping.
      Note: this.currentMapping must exist already
     */

  }, {
    key: '_sendPossibleCommands',
    value: function _sendPossibleCommands() {
      var active_ids = new Set(this._currently_allocated_ids);
      Object.keys(this._currentMapping).forEach(function (logical_id) {
        return active_ids.add(parseInt(logical_id, 10));
      });

      var new_stored_commands = [];
      for (var i = 0; i < this._stored_commands.length; ++i) {
        var cmd = this._stored_commands[i];
        if ((0, _polyfill.len)(active_ids) === 0) {
          new_stored_commands = new_stored_commands.concat(this._stored_commands.slice(i));
          break;
        }
        if (cmd.gate instanceof _gates.AllocateQubitGate) {
          var qid = cmd.qubits[0][0].id;
          if (qid in this._currentMapping) {
            this._currently_allocated_ids.add(qid);
            var qb = new _qubit.BasicQubit(this, this._currentMapping[qid]);
            var new_cmd = new _command2.default(this, new _gates.AllocateQubitGate(), (0, _util.tuple)([qb]), [], [new _meta.LogicalQubitIDTag(qid)]);
            this.send([new_cmd]);
          } else {
            new_stored_commands.push(cmd);
          }
        } else if (cmd.gate instanceof _gates.DeallocateQubitGate) {
          var _qid = cmd.qubits[0][0].id;
          if (active_ids.has(_qid)) {
            var _qb = new _qubit.BasicQubit(this, this._currentMapping[_qid]);
            var _new_cmd = new _command2.default(this, new _gates.DeallocateQubitGate(), (0, _util.tuple)([_qb]), [], [new _meta.LogicalQubitIDTag(_qid)]);
            this._currently_allocated_ids.delete(_qid);
            active_ids.delete(_qid);
            delete this._currentMapping[_qid];
            this.send([_new_cmd]);
          } else {
            new_stored_commands.push(cmd);
          }
        } else {
          var send_gate = true;
          var mapped_ids = new Set();
          for (var _i3 = 0; _i3 < cmd.allQubits.length; ++_i3) {
            var qureg = cmd.allQubits[_i3];
            for (var j = 0; j < qureg.length; ++j) {
              var qubit = qureg[j];
              if (!active_ids.has(qubit.id)) {
                send_gate = false;
                break;
              }
              mapped_ids.add(this._currentMapping[qubit.id]);
            }
          }

          // Check that mapped ids are nearest neighbour
          if ((0, _polyfill.len)(mapped_ids) === 2) {
            mapped_ids = Array.from(mapped_ids);
            var diff = Math.abs(mapped_ids[0] - mapped_ids[1]);
            if (this.cyclic) {
              if (diff !== 1 && diff !== this.num_qubits - 1) {
                send_gate = false;
              }
            } else if (diff !== 1) {
              send_gate = false;
            }
          }
          if (send_gate) {
            this.sendCMDWithMappedIDs(cmd);
          } else {
            cmd.allQubits.forEach(function (qureg) {
              return qureg.forEach(function (qubit) {
                return active_ids.delete(qubit.id);
              });
            });
            new_stored_commands.push(cmd);
          }
        }
      }
      this._stored_commands = new_stored_commands;
    }

    /**
      Creates a new mapping and executes possible gates.
      It first allocates all 0, ..., this.num_qubits-1 mapped qubit ids, if
    they are not already used because we might need them all for the
    swaps. Then it creates a new map, swaps all the qubits to the new map,
    executes all possible gates, and finally deallocates mapped qubit ids
    which don't store any information.
     */

  }, {
    key: '_run',
    value: function _run() {
      var _this2 = this;

      var num_of_stored_commands_before = (0, _polyfill.len)(this._stored_commands);
      if (!this._currentMapping) {
        this.currentMapping = {};
      } else {
        this._sendPossibleCommands();
        if ((0, _polyfill.len)(this._stored_commands) === 0) {
          return;
        }
      }
      var new_mapping = LinearMapper.returnNewMapping(this.num_qubits, this.cyclic, this._currently_allocated_ids, this._stored_commands, this.currentMapping);
      var swaps = this._oddEvenTranspositionSortSwaps(this._currentMapping, new_mapping);
      if (swaps.length > 0) {
        // first mapping requires no swaps
        // Allocate all mapped qubit ids (which are not already allocated,
        // i.e., contained in this._currently_allocated_ids)
        var mapped_ids_used = new Set();
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this._currently_allocated_ids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var logical_id = _step.value;

            mapped_ids_used.add(this._currentMapping[logical_id]);
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

        var tmpSet = (0, _polyfill.setFromRange)(this.num_qubits);
        var not_allocated_ids = (0, _polyfill.setDifference)(tmpSet, mapped_ids_used);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = not_allocated_ids[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var mapped_id = _step2.value;

            var qb = new _qubit.BasicQubit(this, mapped_id);
            var cmd = new _command2.default(this, _gates.Allocate, (0, _util.tuple)([qb]));
            this.send([cmd]);
          }
          // Send swap operations to arrive at new_mapping:
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

        swaps.forEach(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
              qubit_id0 = _ref4[0],
              qubit_id1 = _ref4[1];

          var q0 = new _qubit.BasicQubit(_this2, qubit_id0);
          var q1 = new _qubit.BasicQubit(_this2, qubit_id1);
          var cmd = new _command2.default(_this2, _gates.Swap, (0, _util.tuple)([q0], [q1]));
          _this2.send([cmd]);
        });
        // Register statistics:
        this.num_mappings += 1;
        var depth = return_swap_depth(swaps);
        if (!(depth in this.depth_of_swaps)) {
          this.depth_of_swaps[depth] = 1;
        } else {
          this.depth_of_swaps[depth] += 1;
        }
        if (!((0, _polyfill.len)(swaps) in this.num_of_swaps_per_mapping)) {
          this.num_of_swaps_per_mapping[(0, _polyfill.len)(swaps)] = 1;
        } else {
          this.num_of_swaps_per_mapping[(0, _polyfill.len)(swaps)] += 1;
        }
        // Deallocate all previously mapped ids which we only needed for the
        // swaps:
        mapped_ids_used = new Set();
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this._currently_allocated_ids[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _logical_id = _step3.value;

            mapped_ids_used.add(new_mapping[_logical_id]);
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        var not_needed_anymore = (0, _polyfill.setDifference)((0, _polyfill.setFromRange)(this.num_qubits), mapped_ids_used);
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = not_needed_anymore[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _mapped_id = _step4.value;

            var qb = new _qubit.BasicQubit(this, _mapped_id);
            var cmd = new _command2.default(this, _gates.Deallocate, (0, _util.tuple)([qb]));
            this.send([cmd]);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }

      // Change to new map:
      this.currentMapping = new_mapping;
      // Send possible gates:
      this._sendPossibleCommands();
      // Check that mapper actually made progress
      if ((0, _polyfill.len)(this._stored_commands) === num_of_stored_commands_before) {
        throw new Error('Mapper is potentially in an infinite loop. ' + 'It is likely that the algorithm requires ' + 'too many qubits. Increase the number of ' + 'qubits for this mapper.');
      }
    }

    /**
    Receives a command list and, for each command, stores it until
    we do a mapping (FlushGate or Cache of stored commands is full).
      @param {Command[]} command_list list of commands to receive.
    */

  }, {
    key: 'receive',
    value: function receive(command_list) {
      var _this3 = this;

      command_list.forEach(function (cmd) {
        if (cmd.gate instanceof _gates.FlushGate) {
          while (_this3._stored_commands.length > 0) {
            _this3._run();
          }
          _this3.send([cmd]);
        } else {
          _this3._stored_commands.push(cmd);
        }
      });

      // Storage is full: Create new map and send some gates away:
      if (this._stored_commands.length >= this.storage) {
        this._run();
      }
    }

    /**
     * @static
    Combines the individual segments into a new mapping.
      It tries to minimize the number of swaps to go from the old mapping
    in this.currentMapping to the new mapping which it returns. The
    strategy is to map a segment to the same region where most of the
    qubits are already. Note that this is not a global optimal strategy
    but helps if currently the qubits can be divided into independent
    groups without interactions between the groups.
       @param {number} num_qubits Total number of qubits in the linear chain
     @param {Array} segments List of segments. A segment is a list of qubit ids which
      should be nearest neighbour in the new map. Individual qubits are in allocated_qubits
      but not in any segment
     @param {Object} allocated_qubits A set of all qubit ids which need to be present in the new map
     @param {Object} current_mapping A current mapping as a dict. key is logical qubit
    id, value is placement id. If there are different possible maps, this current mapping is used to
    minimize the swaps to go to the new mapping by a heuristic.
    @returns
        A new mapping as a dict. key is logical qubit id, value is placement id
     */

  }], [{
    key: 'returnNewMapping',
    value: function returnNewMapping(num_qubits, cyclic, currently_allocated_ids, stored_commands, current_mapping) {
      // allocated_qubits is used as this mapper currently does not reassign
      // a qubit placement to a new qubit if the previous qubit at that
      // location has been deallocated. This is done after the next swaps.
      var allocated_qubits = new Set(currently_allocated_ids);
      var active_qubits = new Set(currently_allocated_ids);
      // Segments contains a list of segments. A segment is a list of
      // neighouring qubit ids
      var segments = [];
      // neighbour_ids only used to speedup the lookup process if qubits
      // are already connected. key: qubit_id, value: set of neighbour ids
      var neighbour_ids = {};
      active_qubits.forEach(function (qubit_id) {
        return neighbour_ids[qubit_id] = new Set();
      });

      var _loop = function _loop(i) {
        var cmd = stored_commands[i];
        if ((0, _polyfill.len)(allocated_qubits) === num_qubits && (0, _polyfill.len)(active_qubits) === 0) {
          return 'break';
        }

        var qubit_ids = [];
        cmd.allQubits.forEach(function (qureg) {
          return qureg.forEach(function (qubit) {
            return qubit_ids.push(qubit.id);
          });
        });

        if ((0, _polyfill.len)(qubit_ids) > 2 || (0, _polyfill.len)(qubit_ids) === 0) {
          throw new Error('Invalid command (number of qubits): ' + cmd.toString());
        } else if (cmd.gate instanceof _gates.AllocateQubitGate) {
          var qubit_id = cmd.qubits[0][0].id;
          if ((0, _polyfill.len)(allocated_qubits) < num_qubits) {
            allocated_qubits.add(qubit_id);
            active_qubits.add(qubit_id);
            neighbour_ids[qubit_id] = new Set();
          }
        } else if (cmd.gate instanceof _gates.DeallocateQubitGate) {
          var _qubit_id = cmd.qubits[0][0].id;
          if (active_qubits.has(_qubit_id)) {
            active_qubits.delete(_qubit_id);
          }
          // Do not remove from allocated_qubits as this would
          // allow the mapper to add a new qubit to this location
          // before the next swaps which is currently not supported
        } else if ((0, _polyfill.len)(qubit_ids) === 1) {
          return 'continue';
        } else {
          // Process a two qubit gate:

          LinearMapper._processTwoQubitGate(num_qubits, cyclic, qubit_ids[0], qubit_ids[1], active_qubits, segments, neighbour_ids);
        }
      };

      _loop2: for (var i = 0; i < stored_commands.length; ++i) {
        var _ret = _loop(i);

        switch (_ret) {
          case 'break':
            break _loop2;

          case 'continue':
            continue;}
      }

      return LinearMapper._returnNewMappingFromSegments(num_qubits, segments, allocated_qubits, current_mapping);
    }

    /**
    Processes a two qubit gate.
        It either removes the two qubits from active_qubits if the gate is not
    possible or updates the segements such that the gate is possible.
       @param {number} num_qubits Total number of qubits in the chain
     @param {boolean} cyclic If linear chain is a cycle
     @param {number} qubit0 qubit.id of one of the qubits
     @param {number} qubit1 qubit.id of the other qubit
     @param {Set<Number>} active_qubits contains all qubit ids which for which gates can be applied in this cycle before the swaps
     @param {Array} segments List of segments. A segment is a list of neighbouring qubits.
     @param {Object} neighbour_ids Key: qubit.id Value: qubit.id of neighbours
     */

  }, {
    key: '_processTwoQubitGate',
    value: function _processTwoQubitGate(num_qubits, cyclic, qubit0, qubit1, active_qubits, segments, neighbour_ids) {
      // already connected
      if (qubit1 in neighbour_ids && neighbour_ids[qubit1].has(qubit0)) {}
      // do nothing

      // at least one qubit is not an active qubit:
      else if (!active_qubits.has(qubit0) || !active_qubits.has(qubit1)) {
          active_qubits.delete(qubit0);
          active_qubits.delete(qubit1);
        }
        // at least one qubit is in the inside of a segment:
        else if ((0, _polyfill.len)(neighbour_ids[qubit0]) > 1 || (0, _polyfill.len)(neighbour_ids[qubit1]) > 1) {
            active_qubits.delete(qubit0);
            active_qubits.delete(qubit1);
          }
          // qubits are both active and either not yet in a segment or at
          // the end of segement:
          else {
              var segment_index_qb0 = void 0;
              var qb0_is_left_end = void 0;
              var segment_index_qb1 = void 0;
              var qb1_is_left_end = void 0;

              segments.forEach(function (segment, index) {
                if (qubit0 === segment[0]) {
                  segment_index_qb0 = index;
                  qb0_is_left_end = true;
                } else if (qubit0 === segment[segment.length - 1]) {
                  segment_index_qb0 = index;
                  qb0_is_left_end = false;
                }
                if (qubit1 === segment[0]) {
                  segment_index_qb1 = index;
                  qb1_is_left_end = true;
                } else if (qubit1 === segment[segment.length - 1]) {
                  segment_index_qb1 = index;
                  qb1_is_left_end = false;
                }
              });
              // Both qubits are not yet assigned to a segment:
              if (typeof segment_index_qb0 === 'undefined' && typeof segment_index_qb1 === 'undefined') {
                segments.push([qubit0, qubit1]);
                neighbour_ids[qubit0].add(qubit1);
                neighbour_ids[qubit1].add(qubit0);
              }
              // if qubits are in the same segment, then the gate is not
              // possible. Note that if this.cyclic==true, we have
              // added that connection already to neighbour_ids and wouldn't be
              // in this branch.
              else if (segment_index_qb0 === segment_index_qb1) {
                  active_qubits.delete(qubit0);
                  active_qubits.delete(qubit1);
                  // qubit0 not yet assigned to a segment:
                } else if (typeof segment_index_qb0 === 'undefined') {
                  if (qb1_is_left_end) {
                    segments[segment_index_qb1].splice(0, 0, qubit0);
                  } else {
                    segments[segment_index_qb1].push(qubit0);
                  }
                  neighbour_ids[qubit0].add(qubit1);
                  neighbour_ids[qubit1].add(qubit0);
                  if (cyclic && (0, _polyfill.len)(segments[0]) === num_qubits) {
                    var tmp = segments[0];
                    neighbour_ids[tmp[0]].add(tmp[tmp.length - 1]);
                    neighbour_ids[tmp[tmp.length - 1]].add(tmp[0]);
                  }
                }
                // qubit1 not yet assigned to a segment:
                else if (typeof segment_index_qb1 === 'undefined') {
                    if (qb0_is_left_end) {
                      segments[segment_index_qb0].splice(0, 0, qubit1);
                    } else {
                      segments[segment_index_qb0].push(qubit1);
                    }
                    neighbour_ids[qubit0].add(qubit1);
                    neighbour_ids[qubit1].add(qubit0);
                    if (cyclic && (0, _polyfill.len)(segments[0]) === num_qubits) {
                      var _tmp2 = segments[0];
                      neighbour_ids[_tmp2[0]].add(_tmp2[_tmp2.length - 1]);
                      neighbour_ids[_tmp2[_tmp2.length - 1]].add(_tmp2[0]);
                    }
                  }
                  // both qubits are at the end of different segments -> combine them
                  else {
                      if (!qb0_is_left_end && qb1_is_left_end) {
                        segments[segment_index_qb0] = segments[segment_index_qb0].concat(segments[segment_index_qb1]);
                        segments.splice(segment_index_qb1, 1);
                      } else if (!qb0_is_left_end && !qb1_is_left_end) {
                        var rev = segments[segment_index_qb1].slice(0).reverse();
                        segments[segment_index_qb0] = segments[segment_index_qb0].concat(rev);
                        segments.splice(segment_index_qb1, 1);
                      } else if (qb0_is_left_end && qb1_is_left_end) {
                        segments[segment_index_qb0].reverse();
                        segments[segment_index_qb0] = segments[segment_index_qb0].concat(segments[segment_index_qb1]);
                        segments.splice(segment_index_qb1, 1);
                      } else {
                        segments[segment_index_qb1] = segments[segment_index_qb1].concat(segments[segment_index_qb0]);
                        segments.splice(segment_index_qb0, 1);
                      }

                      // Add new neighbour ids && make sure to check cyclic
                      neighbour_ids[qubit0].add(qubit1);
                      neighbour_ids[qubit1].add(qubit0);
                      if (cyclic && (0, _polyfill.len)(segments[0]) === num_qubits) {
                        var _tmp3 = segments[0];
                        neighbour_ids[_tmp3[0]].add(_tmp3[_tmp3.length - 1]);
                        neighbour_ids[_tmp3[_tmp3.length - 1]].add(_tmp3[0]);
                      }
                    }
            }
    }
  }, {
    key: '_returnNewMappingFromSegments',
    value: function _returnNewMappingFromSegments(num_qubits, segments, allocated_qubits, current_mapping) {
      var remaining_segments = segments.slice(0);
      var individual_qubits = new Set(allocated_qubits);
      var num_unused_qubits = num_qubits - (0, _polyfill.len)(allocated_qubits);
      // Create a segment out of individual qubits and add to segments
      segments.forEach(function (segment) {
        segment.forEach(function (qubit_id) {
          individual_qubits.delete(qubit_id);
        });
      });

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = individual_qubits[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var individual_qubit_id = _step5.value;

          remaining_segments.push([individual_qubit_id]);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      var previous_chain = new Array(num_qubits);
      if (current_mapping) {
        Object.keys(current_mapping).forEach(function (key) {
          return previous_chain[current_mapping[key]] = parseInt(key, 10);
        });
      }

      // Note: previous_chain potentially has some None elements
      var new_chain = new Array(num_qubits);

      var current_position_to_fill = 0;

      var _loop3 = function _loop3() {
        var best_segment = [];
        var best_padding = num_qubits;
        var highest_overlap_fraction = 0;
        remaining_segments.forEach(function (segment) {
          for (var padding = 0; padding < num_unused_qubits + 1; ++padding) {
            var idx0 = current_position_to_fill + padding;
            var idx1 = idx0 + (0, _polyfill.len)(segment);

            var previous_chain_ids = new Set(previous_chain.slice(idx0, idx1));
            previous_chain_ids.delete(undefined);
            var segment_ids = new Set(segment);
            segment_ids.delete(undefined);

            var overlap = (0, _polyfill.len)((0, _polyfill.intersection)(previous_chain_ids, segment_ids)) + previous_chain.slice(idx0, idx1).count(undefined);
            var overlap_fraction = void 0;
            if (overlap === 0) {
              overlap_fraction = 0;
            } else if (overlap === (0, _polyfill.len)(segment)) {
              overlap_fraction = 1;
            } else {
              overlap_fraction = overlap / ((0, _polyfill.len)(segment) * 1.0);
            }
            if (overlap_fraction === 1 && padding < best_padding || overlap_fraction > highest_overlap_fraction || highest_overlap_fraction === 0) {
              best_segment = segment;
              best_padding = padding;
              highest_overlap_fraction = overlap_fraction;
            }
          }
        });

        // Add best segment and padding to new_chain
        var start = current_position_to_fill + best_padding;
        for (var i = 0; i < (0, _polyfill.len)(best_segment); ++i) {
          new_chain[start + i] = best_segment[i];
        }

        remaining_segments.remove(best_segment);
        current_position_to_fill += best_padding + (0, _polyfill.len)(best_segment);
        num_unused_qubits -= best_padding;
      };

      while ((0, _polyfill.len)(remaining_segments)) {
        _loop3();
      }
      // Create mapping
      var new_mapping = {};
      Object.keys(new_chain).forEach(function (pos) {
        var logical_id = new_chain[pos];
        if (typeof logical_id !== 'undefined') {
          new_mapping[logical_id] = parseInt(pos, 10);
        }
      });
      return new_mapping;
    }
  }]);

  return LinearMapper;
}(_basicmapper2.default);

exports.default = LinearMapper;