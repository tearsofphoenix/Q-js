'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DummyEngine = exports.CompareEngine = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _basics = require('./basics');

var _gates = require('../ops/gates');

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
 * @class CompareEngine
 * @desc CompareEngine is an engine which saves all commands. It is only intended
 * for testing purposes. Two CompareEngine backends can be compared and
 * return true if they contain the same commmands.
 */
var CompareEngine = exports.CompareEngine = function (_BasicEngine) {
  _inherits(CompareEngine, _BasicEngine);

  /**
   * @constructor
   */
  function CompareEngine() {
    _classCallCheck(this, CompareEngine);

    var _this = _possibleConstructorReturn(this, (CompareEngine.__proto__ || Object.getPrototypeOf(CompareEngine)).call(this));

    _this._l = [[]];
    return _this;
  }

  /**
   * @return {boolean}
   */


  _createClass(CompareEngine, [{
    key: 'isAvailable',
    value: function isAvailable() {
      return true;
    }

    /**
     * @param {Command} cmd
     */

  }, {
    key: 'cacheCMD',
    value: function cacheCMD(cmd) {
      var _this2 = this;

      // are there qubit ids that haven't been added to the list?
      var allQubitIDList = [];
      cmd.allQubits.forEach(function (qureg) {
        qureg.forEach(function (qubit) {
          return allQubitIDList.push(qubit.id);
        });
      });
      var maxidx = 0;
      allQubitIDList.forEach(function (qid) {
        return maxidx = Math.max(maxidx, qid);
      });

      // if so, increase size of list to account for these qubits
      var add = maxidx + 1 - this._l.length;
      if (add > 0) {
        for (var i = 0; i < add; ++i) {
          this._l.push([]);
        }
      }
      // add gate command to each of the qubits involved
      allQubitIDList.forEach(function (qid) {
        return _this2._l[qid].push(cmd);
      });
    }
  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      var f = new _gates.FlushGate();
      commandList.forEach(function (cmd) {
        if (!cmd.gate.equal(f)) {
          _this3.cacheCMD(cmd);
        }
      });

      if (!this.isLastEngine) {
        this.send(commandList);
      }
    }

    /**
     * test if c1 & c2 are equal
     * @param c1 {Command}
     * @param c2 {Command}
     * @return {boolean}
     */

  }, {
    key: 'compareCMDs',
    value: function compareCMDs(c1, c2) {
      var item = c2.copy();
      item.engine = c1.engine;
      return c1.equal(item);
    }
  }, {
    key: 'equal',
    value: function equal(engine) {
      var len = this._l.length;
      if (!(engine instanceof CompareEngine) || len !== engine._l.length) {
        return false;
      }

      for (var i = 0; i < len; ++i) {
        var item1 = this._l[i];
        var item2 = engine._l[i];
        if (item1.length !== item2.length) {
          return false;
        }
        var total = item1.length;
        for (var j = 0; j < total; ++j) {
          if (!this.compareCMDs(item1[j], item2[j])) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * string description
     * @return {string}
     */

  }, {
    key: 'toString',
    value: function toString() {
      var string = '';
      this._l.forEach(function (cmds, qubit_id) {
        string += 'Qubit ' + qubit_id + ' : ';
        cmds.forEach(function (command) {
          string += command.toString() + ', ';
        });
        string = string.substring(0, string.length - 2) + '\n';
      });
      return string;
    }
  }]);

  return CompareEngine;
}(_basics.BasicEngine);

/**
 * @class DummyEngine
   @desc DummyEngine used for testing.
    The DummyEngine forwards all commands directly to next engine.
    If this.is_last_engine == true it just discards all gates.
    By setting save_commands == true all commands get saved as a
    list in this.received_commands. Elements are appended to this
    list so they are ordered according to when they are received.
 */


var DummyEngine = exports.DummyEngine = function (_BasicEngine2) {
  _inherits(DummyEngine, _BasicEngine2);

  /**
   * @constructor
   * @param {boolean} saveCommands default is false
   */
  function DummyEngine() {
    var saveCommands = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    _classCallCheck(this, DummyEngine);

    var _this4 = _possibleConstructorReturn(this, (DummyEngine.__proto__ || Object.getPrototypeOf(DummyEngine)).call(this));

    _this4.saveCommands = saveCommands;
    _this4.receivedCommands = [];
    return _this4;
  }

  _createClass(DummyEngine, [{
    key: 'isAvailable',
    value: function isAvailable() {
      return true;
    }
  }, {
    key: 'receive',
    value: function receive(commandList) {
      if (this.saveCommands) {
        this.receivedCommands = this.receivedCommands.concat(commandList);
      }

      if (!this.isLastEngine) {
        this.send(commandList);
      }
    }
  }]);

  return DummyEngine;
}(_basics.BasicEngine);