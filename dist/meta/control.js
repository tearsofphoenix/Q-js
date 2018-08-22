'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ControlEngine = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.Control = Control;

var _basics = require('../ops/basics');

var _qubit = require('../types/qubit');

var _basics2 = require('../cengines/basics');

var _util = require('./util');

var _tag = require('./tag');

var _util2 = require('../libs/util');

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
Contains the tools to make an entire section of operations controlled.

    @example

with Control(eng, qubit1):
H | qubit2
X | qubit3
*/

// Adds control qubits to all commands that have no compute / uncompute tags.


/**
 * @class ControlEngine
 */
var ControlEngine = exports.ControlEngine = function (_BasicEngine) {
  _inherits(ControlEngine, _BasicEngine);

  /**
   * @constructor
    @param {Array.<BasicQubit>} qubits qubits conditional on which the following operations are executed.
     */
  function ControlEngine(qubits) {
    _classCallCheck(this, ControlEngine);

    var _this = _possibleConstructorReturn(this, (ControlEngine.__proto__ || Object.getPrototypeOf(ControlEngine)).call(this));

    _this.qubits = qubits;
    return _this;
  }

  /**
    Return true if command cmd has a compute/uncompute tag.
    @param {Command} cmd
  */


  _createClass(ControlEngine, [{
    key: 'hasComputeUnComputeTag',
    value: function hasComputeUnComputeTag(cmd) {
      var tagClass = [_tag.UncomputeTag, _tag.ComputeTag];
      return cmd.tags.some(function (looper) {
        return (0, _util2.instanceOf)(looper, tagClass);
      });
    }
  }, {
    key: 'handleCommand',
    value: function handleCommand(cmd) {
      if (!this.hasComputeUnComputeTag(cmd) && !(cmd.gate instanceof _basics.ClassicalInstructionGate)) {
        cmd.addControlQubits(this.qubits);
      }
      this.send([cmd]);
    }
  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this2 = this;

      commandList.forEach(function (cmd) {
        return _this2.handleCommand(cmd);
      });
    }
  }]);

  return ControlEngine;
}(_basics2.BasicEngine);

/**
Condition an entire code block on the value of qubits being 1.

@example

with Control(eng, ctrlqubits)
do_something(otherqubits)
 Enter a controlled section.

 @param {BasicEngine} engine Engine which handles the commands (usually MainEngine)
 @param {Array.<BasicQubit>} qubits Qubits to condition on
 @param {function} func
 Enter the section using a with-statement
 @example
 Control(eng, ctrlqubits, () => ...)
 */


function Control(engine, qubits, func) {
  if (qubits instanceof _qubit.BasicQubit) {
    qubits = [qubits];
  }
  var qs = qubits;

  var enter = function enter() {
    if (qs.length > 0) {
      var ce = new ControlEngine(qs);
      (0, _util.insertEngine)(engine, ce);
    }
  };

  var exit = function exit() {
    if (qs.length > 0) {
      (0, _util.dropEngineAfter)(engine);
    }
  };

  if (typeof func === 'function') {
    enter();
    try {
      func();
    } catch (e) {
      throw e;
    } finally {
      exit();
    }
  }
}