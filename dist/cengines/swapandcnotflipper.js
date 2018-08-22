'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _basics = require('./basics');

var _gates = require('../ops/gates');

var _metagates = require('../ops/metagates');

var _util = require('../libs/util');

var _shortcuts = require('../ops/shortcuts');

var _cmdmodifier = require('./cmdmodifier');

var _cmdmodifier2 = _interopRequireDefault(_cmdmodifier);

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
 * @class SwapAndCNOTFlipper
 * @desc
Flips CNOTs and translates Swaps to CNOTs where necessary.

    Warning:
This engine assumes that CNOT and Hadamard gates are supported by
the following engines.

    Warning:
This engine cannot be used as a backend.
 */
var SwapAndCNOTFlipper = function (_BasicEngine) {
  _inherits(SwapAndCNOTFlipper, _BasicEngine);

  /**
   * @constructor
   * @param {Set<string> | Set<Array.<number>>} connectivity Set of tuples (c, t) where if (c, t) is an
   *   element of the set means that a CNOT can be performed between the physical ids (c, t)
   *   with c being the control and t being the target qubit.
   */
  function SwapAndCNOTFlipper(connectivity) {
    _classCallCheck(this, SwapAndCNOTFlipper);

    var _this = _possibleConstructorReturn(this, (SwapAndCNOTFlipper.__proto__ || Object.getPrototypeOf(SwapAndCNOTFlipper)).call(this));

    if (connectivity instanceof Set) {
      var newMap = {};
      connectivity.forEach(function (v) {
        return newMap[v] = 1;
      });
      connectivity = newMap;
    }
    _this.connectivity = connectivity;
    return _this;
  }

  /**
   * Check if the IBM backend can perform the Command cmd and return true if so.
   * @param {Command} cmd The command to check
   */


  _createClass(SwapAndCNOTFlipper, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      return this.isSwap(cmd) || this.next.isAvailable(cmd);
    }
  }, {
    key: 'isCNOT',
    value: function isCNOT(cmd) {
      return (0, _util.instanceOf)(cmd.gate, _gates.NOT.constructor) && cmd.controlCount === 1;
    }
  }, {
    key: 'isSwap',
    value: function isSwap(cmd) {
      var n = cmd.controlCount;
      var f = cmd.gate.equal(_gates.Swap);
      return n === 0 && f;
    }
  }, {
    key: 'needsFlipping',
    value: function needsFlipping(cmd) {
      if (!this.isCNOT(cmd)) {
        return false;
      }

      var target = cmd.qubits[0][0].id;
      var control = cmd.controlQubits[0].id;
      var key = [control, target];
      var rkey = [target, control];
      var v = this.connectivity[key];
      var rv = this.connectivity[rkey];
      var is_possible = typeof v !== 'undefined';
      if (!is_possible && typeof rv === 'undefined') {
        throw new Error('The provided connectivity does not allow to execute the CNOT gate ' + cmd.toString() + '.');
      }
      return !is_possible;
    }
  }, {
    key: 'sendCNOT',
    value: function sendCNOT(cmd, control, target) {
      var _this2 = this;

      var flip = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var cmd_mod = function cmd_mod(command) {
        command.tags = cmd.tags.slice(0).concat(command.tags);
        command.engine = _this2.main;
        return command;
      };

      // We'll have to add all meta tags before sending on
      var cmd_mod_eng = new _cmdmodifier2.default(cmd_mod);
      cmd_mod_eng.next = this.next;
      cmd_mod_eng.main = this.main;
      // forward everything to the command modifier
      var forwarder_eng = new _basics.ForwarderEngine(cmd_mod_eng);
      target[0].engine = forwarder_eng;
      control[0].engine = forwarder_eng;
      if (flip) {
        // flip the CNOT using Hadamard gates:
        new _metagates.All(_gates.H).or(control.concat(target));
        _shortcuts.CNOT.or((0, _util.tuple)(target, control));
        new _metagates.All(_gates.H).or(control.concat(target));
      } else {
        _shortcuts.CNOT.or((0, _util.tuple)(control, target));
      }
    }

    /**
       Receives a command list and if the command is a CNOT gate, it flips
      it using Hadamard gates if necessary; if it is a Swap gate, it
      decomposes it using 3 CNOTs. All other gates are simply sent to the next engine.
      @param {Command[]} commandList list of commands to receive.
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      commandList.forEach(function (cmd) {
        if (_this3.needsFlipping(cmd)) {
          _this3.sendCNOT(cmd, cmd.controlQubits, cmd.qubits[0], true);
        } else if (_this3.isSwap(cmd)) {
          var qubits = [];
          cmd.qubits.forEach(function (qr) {
            return qr.forEach(function (qb) {
              return qubits.push(qb);
            });
          });
          var ids = qubits.map(function (qb) {
            return qb.id;
          });
          (0, _assert2.default)(ids.length === 2);
          var key = ids;
          var v = _this3.connectivity[key];
          var control = void 0;
          var target = void 0;
          if (typeof v !== 'undefined') {
            control = [qubits[0]];
            target = [qubits[1]];
          } else {
            key = key.slice(0).reverse();
            v = _this3.connectivity[key];
            if (typeof v !== 'undefined') {
              control = [qubits[1]];
              target = [qubits[0]];
            } else {
              throw new Error('The provided connectivity does not allow to execute the Swap gate ' + cmd.toString() + '.');
            }
          }

          _this3.sendCNOT(cmd, control, target);
          _this3.sendCNOT(cmd, target, control, true);
          _this3.sendCNOT(cmd, control, target);
        } else {
          _this3.next.receive([cmd]);
        }
      });
    }
  }]);

  return SwapAndCNOTFlipper;
}(_basics.BasicEngine);

exports.default = SwapAndCNOTFlipper;