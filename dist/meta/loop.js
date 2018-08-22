'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LoopEngine = exports.LoopTag = undefined;

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

exports.Loop = Loop;

var _basics = require('../cengines/basics');

var _polyfill = require('../libs/polyfill');

var _util = require('./util');

var _gates = require('../ops/gates');

var _error = require('./error');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class LoopTag
 */
var LoopTag = exports.LoopTag = function () {
  /**
   * @constructor
   * @param {number} num
   */
  function LoopTag(num) {
    _classCallCheck(this, LoopTag);

    this.num = num;
    this.id = LoopTag.loop_tag_id;
    LoopTag.loop_tag_id += 1;
  }

  _createClass(LoopTag, [{
    key: 'equal',
    value: function equal(other) {
      return other instanceof LoopTag && other.id === this.id && this.num === other.num;
    }
  }]);

  return LoopTag;
}();

LoopTag.loop_tag_id = 0;

/**
 * @class LoopEngine
 * @desc
Stores all commands and, when done, executes them num times if no loop tag
handler engine is available.
    If there is one, it adds a loop_tag to the commands and sends them on.
 */

var LoopEngine = exports.LoopEngine = function (_BasicEngine) {
  _inherits(LoopEngine, _BasicEngine);

  /**
   * @constructor
    @param {number} num Number of loop iterations.
   */
  function LoopEngine(num) {
    _classCallCheck(this, LoopEngine);

    var _this = _possibleConstructorReturn(this, (LoopEngine.__proto__ || Object.getPrototypeOf(LoopEngine)).call(this));

    _this._tag = new LoopTag(num);
    _this._cmdList = [];
    _this._allocatedQubitIDs = new Set();
    _this._deallocatedQubitIDs = new Set();
    // key: qubit id of a local qubit, i.e. a qubit which has been allocated
    //     and deallocated within the loop body.
    // value: list contain reference to each weakref qubit with this qubit
    //        id either within control_qubits or qubits.
    _this._refsToLocalQB = {};
    _this._nextEnginesSupportLoopTag = false;
    return _this;
  }

  /**
  Apply the loop statements to all stored commands.
   Unrolls the loop if LoopTag is not supported by any of the following engines, i.e., if
     @example
    is_meta_tag_supported(next_engine, LoopTag) == false
   */


  _createClass(LoopEngine, [{
    key: 'run',
    value: function run() {
      var _this2 = this;

      var error_message = '\n Error. Qubits have been allocated in with ' + 'Loop(eng, num) context,\n which have not ' + 'explicitely been deallocated in the Loop context.\n' + 'Correct usage:\nLoop(eng, 5):\n' + '    qubit = eng.allocateQubit()\n' + '    ...\n' + '    qubit[0].deallocate()\n';

      if (!this._nextEnginesSupportLoopTag) {
        // Unroll the loop
        // Check that local qubits have been deallocated
        if (!(0, _polyfill.setEqual)(this._deallocatedQubitIDs, this._allocatedQubitIDs)) {
          throw new _error.QubitManagementError(error_message);
        }
        if (this._allocatedQubitIDs.size === 0) {
          // No local qubits, just send the circuit num times
          for (var i = 0; i < this._tag.num; ++i) {
            this.send(this._cmdList.slice(0));
          }
        } else {
          // Ancilla qubits have been allocated in loop body
          // For each iteration, allocate and deallocate a new qubit and
          // replace the qubit id in all commands using it.
          for (var _i = 0; _i < this._tag.num; ++_i) {
            if (_i === 0) {
              this.send(this._cmdList.map(function (cmd) {
                return cmd.copy();
              }));
            } else {
              // Change local qubit ids before sending them
              Object.values(this._refsToLocalQB).forEach(function (refs_loc_qubit) {
                var new_qb_id = _this2.main.getNewQubitID();
                refs_loc_qubit.forEach(function (qubitRef) {
                  return qubitRef.id = new_qb_id;
                });
              });
              this.send(this._cmdList.map(function (cmd) {
                return cmd.copy();
              }));
            }
          }
        }
      } else if (!(0, _polyfill.setEqual)(this._deallocatedQubitIDs, this._allocatedQubitIDs)) {
        throw new _error.QubitManagementError(error_message);
      }
    }

    /**
    Receive (and potentially temporarily store) all commands.
        Add LoopTag to all receiving commands and send to the next engine if
      a further engine is a LoopTag-handling engine. Otherwise store all
    commands (to later unroll them). Check that within the loop body,
      all allocated qubits have also been deallocated. If loop needs to be
    unrolled and ancilla qubits have been allocated within the loop body,
      then store a reference all these qubit ids (to change them when
    unrolling the loop)
    @param {Command[]} commandList List of commands to store and later
    unroll or, if there is a LoopTag-handling engine, add the LoopTag.
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      if (this._nextEnginesSupportLoopTag || this.next.isMetaTagSupported(LoopTag)) {
        // Loop tag is supported, send everything with a LoopTag
        // Don't check is_meta_tag_supported anymore
        this._nextEnginesSupportLoopTag = true;
        if (this._tag.num === 0) {
          return;
        }
        commandList.forEach(function (cmd) {
          if (cmd.gate.equal(_gates.Allocate)) {
            _this3._allocatedQubitIDs.add(cmd.qubits[0][0].id);
          } else if (cmd.gate.equal(_gates.Deallocate)) {
            _this3._deallocatedQubitIDs.add(cmd.qubits[0][0].id);
          }
          cmd.tags.push(_this3._tag);
          _this3.send([cmd]);
        });
      } else {
        // LoopTag is not supported, save the full loop body
        this._cmdList = this._cmdList.concat(commandList);
        // Check for all local qubits allocated and deallocated in loop body
        commandList.forEach(function (cmd) {
          var qb = cmd.qubits[0][0];
          var qid = qb.id;
          if (cmd.gate.equal(_gates.Allocate)) {
            _this3._allocatedQubitIDs.add(qid);
            _this3._refsToLocalQB[qid] = [qb];
          } else if (cmd.gate.equal(_gates.Deallocate)) {
            _this3._deallocatedQubitIDs.add(qid);
            _this3._refsToLocalQB[qid].push(qb);
          } else {
            cmd.controlQubits.forEach(function (ctrlQubit) {
              var v = _this3._allocatedQubitIDs.has(ctrlQubit.id);
              if (v) {
                _this3._refsToLocalQB[ctrlQubit.id].push(ctrlQubit);
              }
            });
            cmd.qubits.forEach(function (qureg) {
              return qureg.forEach(function (qubit) {
                if (_this3._allocatedQubitIDs.has(qubit.id)) {
                  _this3._refsToLocalQB[qubit.id].push(qubit);
                }
              });
            });
          }
        });
      }
    }
  }]);

  return LoopEngine;
}(_basics.BasicEngine);

/**
 * @param {BasicEngine} engine
 * @param {number} num
 * @param {function} func
Loop n times over an entire code block.

    @example
    Loop(eng, 4, () => { })
    // [quantum gates to be executed 4 times]

Warning:
    If the code in the loop contains allocation of qubits, those qubits
have to be deleted prior to exiting the 'Loop()' context.

    This code is **NOT VALID**:

 @example

  Loop(eng, 4, () => {
    qb = eng.allocateQubit()
    H.or(qb) // qb is still available!!!
  })

The **correct way** of handling qubit (de-)allocation is as follows:

 @example
  Loop(eng, 4, () => {
    qb = eng.allocateQubit()
    ...
    qb.deallocate() // sends deallocate gate
  })
 */


function Loop(engine, num, func) {
  if (typeof num === 'number' && num >= 0 && num % 1 === 0) {
    var _num = num;
    var _loopEngine = void 0;
    var enter = function enter() {
      if (_num !== 1) {
        _loopEngine = new LoopEngine(num);
        (0, _util.insertEngine)(engine, _loopEngine);
      }
    };

    var exit = function exit() {
      if (_num !== 1) {
        _loopEngine.run();
        _loopEngine = null;
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
  } else {
    throw new Error('invalid number of loop iterations');
  }
}