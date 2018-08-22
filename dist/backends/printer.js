'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _basics = require('../cengines/basics');

var _gates = require('../ops/gates');

var _tag = require('../meta/tag');

var _qubit = require('../types/qubit');

var _error = require('../meta/error');

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

/*
Contains a compiler engine which prints commands to stdout prior to sending
them on to the next engines (see CommandPrinter).
*/


/**
 * @class CommandPrinter
 * @desc
 * CommandPrinter is a compiler engine which prints commands to stdout prior
 * to sending them on to the next compiler engine.
 */
var CommandPrinter = function (_BasicEngine) {
  _inherits(CommandPrinter, _BasicEngine);

  /**
   * @constructor
  @param {boolean} acceptInput If accept_input is true, the printer queries
  the user to input measurement results if the CommandPrinter is
  the last engine. Otherwise, all measurements yield
  @param {boolean} defaultMeasure Default measurement result (if accept_input is false).
  @param {boolean} inPlace If in_place is true, all output is written on the same line of the terminal.
  */
  function CommandPrinter() {
    var acceptInput = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var defaultMeasure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var inPlace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    _classCallCheck(this, CommandPrinter);

    var _this = _possibleConstructorReturn(this, (CommandPrinter.__proto__ || Object.getPrototypeOf(CommandPrinter)).call(this));

    _this._acceptInput = acceptInput;
    _this._defaultMeasure = defaultMeasure;
    _this._inPlace = inPlace;
    return _this;
  }

  /**
    Specialized implementation of isAvailable: Returns true if the
    CommandPrinter is the last engine (since it can print any command).
      @param {Command} cmd Command of which to check availability (all Commands can be printed).
    @return {boolean} true, unless the next engine cannot handle the Command (if there is a next engine).
   */


  _createClass(CommandPrinter, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      try {
        return _get(CommandPrinter.prototype.__proto__ || Object.getPrototypeOf(CommandPrinter.prototype), 'isAvailable', this).call(this, cmd);
      } catch (e) {
        if (e instanceof _error.LastEngineError) {
          return true;
        }
      }
      return false;
    }

    /**
      Print a command or, if the command is a measurement instruction and
      the CommandPrinter is the last engine in the engine pipeline: Query
      the user for the measurement result (if accept_input = true) / Set
      the result to 0 (if it's false).
        @param {Command} cmd Command to print.
     */

  }, {
    key: 'printCMD',
    value: function printCMD(cmd) {
      var _this2 = this;

      if (this.isLastEngine && cmd.gate.equal(_gates.Measure)) {
        (0, _assert2.default)(cmd.controlCount === 0);
        console.log(cmd.toString());
        cmd.qubits.forEach(function (qureg) {
          qureg.forEach(function (qubit) {
            // ignore input
            var m = _this2._defaultMeasure;
            var logicQubitTag = void 0;
            cmd.tags.forEach(function (tag) {
              if (tag instanceof _tag.LogicalQubitIDTag) {
                logicQubitTag = tag;
              }
            });

            if (logicQubitTag) {
              qubit = new _qubit.BasicQubit(qubit.engine, logicQubitTag.logical_qubit_id);
            }
            _this2.main.setMeasurementResult(qubit, m);
          });
        });
      } else if (this._inPlace) {
        console.log('\0\r\t\x1B[K' + cmd.toString() + '\r');
      } else {
        console.log(cmd.toString());
      }
    }

    /**
    Receive a list of commands from the previous engine, print the
    commands, and then send them on to the next engine.
        @param {Command[]} commandList List of Commands to print (and potentially send on to the next engine).
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      commandList.forEach(function (cmd) {
        if (!(cmd.gate instanceof _gates.FlushGate)) {
          _this3.printCMD(cmd);
        }
        if (!_this3.isLastEngine) {
          _this3.send([cmd]);
        }
      });
    }
  }]);

  return CommandPrinter;
}(_basics.BasicEngine);

exports.default = CommandPrinter;