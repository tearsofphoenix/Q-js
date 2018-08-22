'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _basics = require('../cengines/basics');

var _error = require('../meta/error');

var _gates = require('../ops/gates');

var _tag = require('../meta/tag');

var _qubit = require('../types/qubit');

var _util = require('../libs/util');

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

function parseStringKey(key) {
  return key.split(',');
}

/**
 * @class ResourceCounter
 * @desc
ResourceCounter is a compiler engine which counts the number of gates and
max. number of active qubits.

  Attributes:
gate_counts (dict): Dictionary of gate counts.
  The keys are tuples of the form (cmd.gate, ctrl_cnt), where
ctrl_cnt is the number of control qubits.
gate_class_counts (dict): Dictionary of gate class counts.
The keys are tuples of the form (cmd.gate.__class__, ctrl_cnt),
  where ctrl_cnt is the number of control qubits.
max_width (int): Maximal width (=max. number of active qubits at any
given point).
Properties:
  depth_of_dag (int): It is the longest path in the directed
acyclic graph (DAG) of the program.
 */

var ResourceCounter = function (_BasicEngine) {
  _inherits(ResourceCounter, _BasicEngine);

  /**
   * @constructor
   */
  function ResourceCounter() {
    _classCallCheck(this, ResourceCounter);

    var _this = _possibleConstructorReturn(this, (ResourceCounter.__proto__ || Object.getPrototypeOf(ResourceCounter)).call(this));

    _this.gate_counts = {};
    _this.gate_class_counts = {};
    _this._active_qubits = 0;
    _this.max_width = 0;
    // key: qubit id, depth of this qubit
    _this._depth_of_qubit = {};
    _this._previous_max_depth = 0;
    return _this;
  }

  /**
    Specialized implementation of isAvailable: Returns true if the
    ResourceCounter is the last engine (since it can count any command).
      @param {Command} cmd Command for which to check availability (all Commands can be counted).
    @return {boolean} true, unless the next engine cannot handle the Command (if there is a next engine).
   */


  _createClass(ResourceCounter, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      try {
        return _get(ResourceCounter.prototype.__proto__ || Object.getPrototypeOf(ResourceCounter.prototype), 'isAvailable', this).call(this, cmd);
      } catch (e) {
        if (e instanceof _error.LastEngineError) {
          return true;
        }
        return false;
      }
    }

    /**
     * @return {number}
     */

  }, {
    key: 'addCMD',


    /**
     *
     * @param {Command} cmd
     */
    value: function addCMD(cmd) {
      var _this2 = this;

      var qid = cmd.qubits[0][0].id;
      if (cmd.gate.equal(_gates.Allocate)) {
        this._active_qubits += 1;
        this._depth_of_qubit[qid] = 0;
      } else if (cmd.gate.equal(_gates.Deallocate)) {
        this._active_qubits -= 1;
        var depth = this._depth_of_qubit[qid];
        this._previous_max_depth = Math.max(this._previous_max_depth, depth);
        delete this._depth_of_qubit[qid];
      } else if (this.isLastEngine && cmd.gate.equal(_gates.Measure)) {
        cmd.qubits.forEach(function (qureg) {
          qureg.forEach(function (qubit) {
            _this2._depth_of_qubit[qubit.id] += 1;
            //  Check if a mapper assigned a different logical id
            var logical_id_tag = void 0;
            cmd.tags.forEach(function (tag) {
              if (tag instanceof _tag.LogicalQubitIDTag) {
                logical_id_tag = tag;
              }
            });
            if (logical_id_tag) {
              qubit = new _qubit.BasicQubit(qubit.engine, logical_id_tag.logical_qubit_id);
            }
            _this2.main.setMeasurementResult(qubit, 0);
          });
        });
      } else {
        var qubit_ids = new Set();
        cmd.allQubits.forEach(function (qureg) {
          qureg.forEach(function (qubit) {
            qubit_ids.add(qubit.id);
          });
        });
        if (qubit_ids.size === 1) {
          var list = [].concat(_toConsumableArray(qubit_ids));
          this._depth_of_qubit[list[0]] += 1;
        } else {
          var max_depth = 0;
          qubit_ids.forEach(function (qubit_id) {
            max_depth = Math.max(max_depth, _this2._depth_of_qubit[qubit_id]);
          });

          qubit_ids.forEach(function (qubit_id) {
            return _this2._depth_of_qubit[qubit_id] = max_depth + 1;
          });
        }
      }

      this.max_width = Math.max(this.max_width, this._active_qubits);

      var ctrl_cnt = cmd.controlCount;
      var gate_description = [cmd.gate, ctrl_cnt];
      var gate_class_description = [cmd.gate.constructor.name, ctrl_cnt];

      try {
        var v = this.gate_counts[gate_description] || 0;
        this.gate_counts[gate_description] = v + 1;
      } catch (e) {
        console.log(e);
        this.gate_counts[gate_description] = 1;
      }

      try {
        var _v = this.gate_class_counts[gate_class_description] || 0;
        this.gate_class_counts[gate_class_description] = _v + 1;
      } catch (e) {
        console.log(e);
        this.gate_class_counts[gate_class_description] = 1;
      }
    }

    /**
     *
     * @param {Command[]} commandList
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      commandList.forEach(function (cmd) {
        if (!(cmd.gate instanceof _gates.FlushGate)) {
          _this3.addCMD(cmd);
        }
        if (!_this3.isLastEngine) {
          _this3.send([cmd]);
        }
      });
    }

    /**
    Return the string representation of this ResourceCounter.
      @return {string}
      A summary (string) of resources used, including gates, number of
      calls, and max. number of qubits that were active at the same time.
     */

  }, {
    key: 'toString',
    value: function toString() {
      var _this4 = this;

      if (Object.keys(this.gate_counts).length > 0) {
        var gate_class_list = [];
        Object.keys(this.gate_class_counts).forEach(function (gate_class_description) {
          var num = _this4.gate_class_counts[gate_class_description];

          var _parseStringKey = parseStringKey(gate_class_description),
              _parseStringKey2 = _slicedToArray(_parseStringKey, 2),
              gate_class = _parseStringKey2[0],
              ctrl_cnt = _parseStringKey2[1];

          var name = (0, _util.genString)('C', ctrl_cnt) + gate_class;
          gate_class_list.push(name + ' : ' + num);
        });

        var gate_list = [];
        Object.keys(this.gate_counts).forEach(function (gate_description) {
          var num = _this4.gate_counts[gate_description];

          var _parseStringKey3 = parseStringKey(gate_description),
              _parseStringKey4 = _slicedToArray(_parseStringKey3, 2),
              gate = _parseStringKey4[0],
              ctrl_cnt = _parseStringKey4[1];

          var name = (0, _util.genString)('C', ctrl_cnt) + gate.toString();
          gate_list.push(name + ' : ' + num);
        });

        return 'Gate class counts:\n    ' + gate_class_list.join('\n    ') + '\n\nGate counts:\n    ' + gate_list.join('\n    ') + '\n\nMax. width (number of qubits) : ' + this.max_width + '.';
      } else {
        return '(No quantum resources used)';
      }
    }
  }, {
    key: 'depthOfDag',
    get: function get() {
      if (this._depth_of_qubit) {
        var current_max = Math.max.apply(Math, _toConsumableArray(Object.values(this._depth_of_qubit)));
        return Math.max(current_max, this._previous_max_depth);
      } else {
        return this._previous_max_depth;
      }
    }
  }]);

  return ResourceCounter;
}(_basics.BasicEngine);

exports.default = ResourceCounter;