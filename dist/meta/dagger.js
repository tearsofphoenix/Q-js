'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DaggerEngine = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.Dagger = Dagger;

var _basics = require('../cengines/basics');

var _gates = require('../ops/gates');

var _util = require('./util');

var _polyfill = require('../libs/polyfill');

var _error = require('./error');

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
Tools to easily invert a sequence of gates.

 @example
 Dagger(eng, () => {
  H.or(qubit1)
  new Rz(0.5).or(qubit2)
})
*/

/**
 * @class DaggerEngine
 * @desc
 *  Stores all commands and, when done, inverts the circuit & runs it.
*/
var DaggerEngine = exports.DaggerEngine = function (_BasicEngine) {
  _inherits(DaggerEngine, _BasicEngine);

  /**
   * @constructor
   */
  function DaggerEngine() {
    _classCallCheck(this, DaggerEngine);

    var _this = _possibleConstructorReturn(this, (DaggerEngine.__proto__ || Object.getPrototypeOf(DaggerEngine)).call(this));

    _this.commands = [];
    _this.allocateQubitIDs = new Set();
    _this.deallocateQubitIDs = new Set();
    return _this;
  }

  /**
    Run the stored circuit in reverse and check that local qubits have been deallocated.
   */


  _createClass(DaggerEngine, [{
    key: 'run',
    value: function run() {
      var _this2 = this;

      if (!(0, _polyfill.setEqual)(this.deallocateQubitIDs, this.allocateQubitIDs)) {
        throw new _error.QubitManagementError("\n Error. Qubits have been allocated in 'with " + "Dagger(eng)' context,\n which have not explicitely " + 'been deallocated.\n' + 'Correct usage:\n' + 'with Dagger(eng):\n' + '    qubit = eng.allocateQubit()\n' + '    ...\n' + '    del qubit[0]\n');
      }
      this.commands.rforEach(function (cmd) {
        _this2.send([cmd.getInverse()]);
      });
    }

    /**
      Receive a list of commands and store them for later inversion.
      @param {Command[]} cmdList List of commands to temporarily store.
    */

  }, {
    key: 'receive',
    value: function receive(cmdList) {
      var _this3 = this;

      cmdList.forEach(function (cmd) {
        if (cmd.gate.equal(_gates.Allocate)) {
          _this3.allocateQubitIDs.add(cmd.qubits[0][0].id);
        } else if (cmd.gate.equal(_gates.Deallocate)) {
          _this3.deallocateQubitIDs.add(cmd.qubits[0][0].id);
        }
      });
      this.commands = this.commands.concat(cmdList);
    }
  }]);

  return DaggerEngine;
}(_basics.BasicEngine);

/**
Invert an entire code block.

    Use it with a with-statement, i.e.,

 @example
    Dagger(eng, () => [code to invert])

Warning:
    If the code to invert contains allocation of qubits, those qubits have
to be deleted prior to exiting the 'with Dagger()' context.

    This code is **NOT VALID**:

 @example
  Dagger(eng, () => {
    qb = eng.allocateQubit()
    H.or(qb) // qb is still available!!!
  })
The **correct way** of handling qubit (de-)allocation is as follows:

 @example
  Dagger(eng, () => {
    qb = eng.allocateQubit()
    ...
    qb.deallocate() // sends deallocate gate (which becomes an allocate)
  })

 @param {BasicEngine} engine Engine which handles the commands (usually MainEngine)
 @param {function} func
 */


function Dagger(engine, func) {
  var daggerEngine = null;

  var enter = function enter() {
    daggerEngine = new DaggerEngine();
    (0, _util.insertEngine)(engine, daggerEngine);
  };

  var exit = function exit() {
    daggerEngine.run();
    daggerEngine = null;
    (0, _util.dropEngineAfter)(engine);
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