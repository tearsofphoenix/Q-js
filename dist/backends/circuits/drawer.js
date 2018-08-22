'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CircuitDrawer = exports.CircuitItem = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

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

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _error = require('../../meta/error');

var _polyfill = require('../../libs/polyfill');

var _ops = require('../../ops');

var _cengines = require('../../cengines');

var _tolatex = require('./tolatex');

var _tolatex2 = _interopRequireDefault(_tolatex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class CircuitItem
 */
var CircuitItem = exports.CircuitItem = function () {
  /**
   * @constructor
    @param {BasicGate} gate
    @param {number[]} lines Circuit lines the gate acts on.
    @param {number[]} ctrl_lines Circuit lines which control the gate.
  */
  function CircuitItem(gate, lines, ctrl_lines) {
    _classCallCheck(this, CircuitItem);

    this.gate = gate;
    this.lines = lines;
    this.ctrl_lines = ctrl_lines;
    this.id = -1;
  }

  /**
   * @return {CircuitItem}
   */


  _createClass(CircuitItem, [{
    key: 'copy',
    value: function copy() {
      var l = Array.isArray(this.lines) ? this.lines.slice(0) : this.lines;
      var cl = Array.isArray(this.ctrl_lines) ? this.ctrl_lines.slice(0) : this.ctrl_lines;
      var inst = new CircuitItem(this.gate, l, cl);
      inst.id = this.id;
      return inst;
    }

    /**
     * @param {(CircuitItem|Object)} other
     * @return {boolean}
     */

  }, {
    key: 'equal',
    value: function equal(other) {
      if (other instanceof CircuitItem) {
        var f = false;
        if (this.gate.equal) {
          f = this.gate.equal(other.gate);
        } else {
          f = this.gate === other.gate;
        }
        return f && (0, _polyfill.arrayEqual)(this.lines, other.lines) && (0, _polyfill.arrayEqual)(this.ctrl_lines, other.ctrl_lines) && this.id === other.id;
      }
      return false;
    }
  }]);

  return CircuitItem;
}();

/**
 * @class CircuitDrawer
 * @desc
CircuitDrawer is a compiler engine which generates TikZ code for drawing
  quantum circuits.

    The circuit can be modified by editing the settings.json file which is
generated upon first execution. This includes adjusting the gate width,
    height, shadowing, line thickness, and many more options.

    After initializing the CircuitDrawer, it can also be given the mapping
from qubit IDs to wire location (via the :meth:`set_qubit_locations`
function):

  @example

const circuit_backend = new CircuitDrawer()
circuit_backend.setQubitLocations({0: 1, 1: 0}) // swap lines 0 and 1
const eng = new MainEngine(circuit_backend)

... // run quantum algorithm on this main engine

console.log(circuit_backend.getLatex()) // prints LaTeX code

To see the qubit IDs in the generated circuit, simply set the `draw_id`
option in the settings.json file under "gates":"AllocateQubitGate" to
true:

 @example

"gates": {
  "AllocateQubitGate": {
    "draw_id": true,
        "height": 0.15,
        "width": 0.2,
        "pre_offset": 0.1,
        "offset": 0.1
  },
...

  The settings.json file has the following structure:

      @example

  {
    "control": { // settings for control "circle"
    "shadow": false,
        "size": 0.1
  },
    "gate_shadow": true, // enable/disable shadows for all gates
    "gates": {
    "GateClassString": {
      GATE_PROPERTIES
    }
    "GateClassString2": {
    ...
    },
    "lines": { // settings for qubit lines
      "double_classical": true, // draw double-lines for classical bits
      "double_lines_sep": 0.04, // gap between the two lines for double lines
      "init_quantum": true, // start out with quantum bits
      "style": "very thin" // line style
    }
  }

    All gates (except for the ones requiring special treatment) support the
    following properties:

    @example

    "GateClassString": {
    "height": GATE_HEIGHT,
        "width": GATE_WIDTH
    "pre_offset": OFFSET_BEFORE_PLACEMENT,
        "offset": OFFSET_AFTER_PLACEMENT,
  },
 */


var CircuitDrawer = exports.CircuitDrawer = function (_BasicEngine) {
  _inherits(CircuitDrawer, _BasicEngine);

  /**
   * @constructor
  Initialize a circuit drawing engine.
        The TikZ code generator uses a settings file (settings.json), which
    can be altered by the user. It contains gate widths, heights, offsets,
      etc.
      @param {boolean} accept_input If accept_input is true, the printer queries
    the user to input measurement results if the CircuitDrawer is
    the last engine. Otherwise, all measurements yield the result
    default_measure (0 or 1).
    @param {number} default_measure Default value to use as measurement
    results if accept_input is false and there is no underlying
    backend to register real measurement results.
   */
  function CircuitDrawer() {
    var accept_input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var default_measure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    _classCallCheck(this, CircuitDrawer);

    var _this = _possibleConstructorReturn(this, (CircuitDrawer.__proto__ || Object.getPrototypeOf(CircuitDrawer)).call(this));

    _this._accept_input = accept_input;
    _this._default_measure = default_measure;
    _this._qubit_lines = {};
    _this._free_lines = [];
    _this._map = {};
    return _this;
  }

  /**
  Specialized implementation of isAvailable: Returns true if the
    CircuitDrawer is the last engine (since it can print any command).
      @param {Command} cmd Command for which to check availability (all Commands can be printed).
    @return {boolean} true, unless the next engine cannot handle the Command (if there is a next engine).
   */


  _createClass(CircuitDrawer, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      try {
        return _get(CircuitDrawer.prototype.__proto__ || Object.getPrototypeOf(CircuitDrawer.prototype), 'isAvailable', this).call(this, cmd);
      } catch (e) {
        if (e instanceof _error.LastEngineError) {
          return true;
        }
      }
      return false;
    }

    /**
    Sets the qubit lines to use for the qubits explicitly.
          To figure out the qubit IDs, simply use the setting `draw_id` in the
      settings file. It is located in "gates":"AllocateQubitGate".
        If draw_id is true, the qubit IDs are drawn in red.
          @param {Object} idToLoc Dictionary mapping qubit ids to qubit line numbers.
          @throws {Error} If the mapping has already begun (this function
    needs be called before any gates have been received).
     */

  }, {
    key: 'setQubitLocations',
    value: function setQubitLocations(idToLoc) {
      if ((0, _polyfill.len)(this._map) > 0) {
        throw new Error('set_qubit_locations() has to be called before applying gates!');
      }

      var min = Math.min.apply(Math, _toConsumableArray(Object.keys(idToLoc)));
      var max = Math.max.apply(Math, _toConsumableArray(Object.keys(idToLoc))) + 1;
      for (var k = min; k < max; ++k) {
        if (!(k in idToLoc)) {
          throw new Error('set_qubit_locations(): Invalid id_to_loc ' + 'mapping provided. All ids in the provided' + ' range of qubit ids have to be mapped ' + 'somewhere.');
        }
      }
      this._map = idToLoc;
    }

    /**
    Add the command cmd to the circuit diagram, taking care of potential
      measurements as specified in the __init__ function.
        Queries the user for measurement input if a measurement command
      arrives if accept_input was set to true. Otherwise, it uses the
      default_measure parameter to register the measurement outcome.
          @param {Command} cmd Command to add to the circuit diagram.
     */

  }, {
    key: 'printCMD',
    value: function printCMD(cmd) {
      var _this2 = this;

      if (cmd.gate.equal(_ops.Allocate)) {
        var qubit_id = cmd.qubits[0][0].id;
        if (!(qubit_id in this._map)) {
          this._map[qubit_id] = qubit_id;
        }
        this._qubit_lines[qubit_id] = [];
      }
      if (cmd.gate.equal(_ops.Deallocate)) {
        var _qubit_id = cmd.qubits[0][0].id;
        this._free_lines.push(_qubit_id);
      }
      if (this.isLastEngine && cmd.gate === _ops.Measure) {
        (0, _assert2.default)(cmd.controlCount === 0);

        cmd.qubits.forEach(function (qureg) {
          return qureg.forEach(function (qubit) {
            var m = void 0;
            if (_this2._accept_input) {
              // TODO
            } else {
              m = _this2._default_measure;
            }
            _this2.main.setMeasurementResult(qubit, m);
          });
        });
      }

      var all_lines = [];
      cmd.allQubits.forEach(function (qr) {
        return qr.forEach(function (qb) {
          return all_lines.push(qb.id);
        });
      });

      var gate = cmd.gate;
      var lines = [];
      cmd.qubits.forEach(function (qr) {
        return qr.forEach(function (qb) {
          return lines.push(qb.id);
        });
      });
      var ctrl_lines = cmd.controlQubits.map(function (qb) {
        return qb.id;
      });
      var item = new CircuitItem(gate, lines, ctrl_lines);

      all_lines.forEach(function (l) {
        return _this2._qubit_lines[l].push(item);
      });
    }

    /**
    Return the latex document string representing the circuit.
          Simply write this string into a tex-file or, alternatively, pipe the
      output directly to, e.g., pdflatex:
       @example
        node my_circuit.js | pdflatex
        where my_circuit.js calls this function and prints it to the terminal.
     @return {string}
     */

  }, {
    key: 'getLatex',
    value: function getLatex() {
      var _this3 = this;

      var qubit_lines = {};

      var linesCount = (0, _polyfill.len)(this._qubit_lines);

      var _loop = function _loop(line) {
        var new_line = _this3._map[line];
        qubit_lines[new_line] = [];

        _this3._qubit_lines[line].forEach(function (cmd) {
          var lines = cmd.lines.map(function (qb_id) {
            return _this3._map[qb_id];
          });
          var ctrl_lines = cmd.ctrl_lines.map(function (qb_id) {
            return _this3._map[qb_id];
          });
          var gate = cmd.gate;

          var new_cmd = new CircuitItem(gate, lines, ctrl_lines);
          if (gate.equal(_ops.Allocate)) {
            new_cmd.id = cmd.lines[0];
          }
          qubit_lines[new_line].push(new_cmd);
        });
      };

      for (var line = 0; line < linesCount; ++line) {
        _loop(line);
      }

      var circuit = [];
      Object.keys(qubit_lines).forEach(function (lines) {
        return circuit.push(qubit_lines[lines]);
      });
      return _tolatex2.default.toLatex(qubit_lines);
    }

    /**
    Receive a list of commands from the previous engine, print the
      commands, and then send them on to the next engine.
        @param {Command[]} commandList List of Commands to print (and potentially send on to the next engine).
    */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this4 = this;

      commandList.forEach(function (cmd) {
        if (!(cmd.gate instanceof _ops.FlushGate)) {
          _this4.printCMD(cmd);
        }
        if (!_this4.isLastEngine) {
          _this4.send([cmd]);
        }
      });
    }
  }]);

  return CircuitDrawer;
}(_cengines.BasicEngine);