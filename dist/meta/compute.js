'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UncomputeEngine = exports.ComputeEngine = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.Compute = Compute;
exports.CustomUncompute = CustomUncompute;
exports.Uncompute = Uncompute;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _basics = require('../cengines/basics');

var _cmdmodifier = require('../cengines/cmdmodifier');

var _cmdmodifier2 = _interopRequireDefault(_cmdmodifier);

var _tag = require('./tag');

var _util = require('./util');

var _gates = require('../ops/gates');

var _polyfill = require('../libs/polyfill');

var _error = require('./error');

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

/* Compute, Uncompute, CustomUncompute.

    Contains Compute, Uncompute, and CustomUncompute classes which can be used to
annotate Compute / Action / Uncompute sections, facilitating the conditioning
of the entire operation on the value of a qubit / register (only Action needs
controls). This file also defines the corresponding meta tags.
*/


/**
 * @class ComputeEngine
 * @desc Adds Compute-tags to all commands and stores them (to later uncompute them automatically)
 */
var ComputeEngine = exports.ComputeEngine = function (_BasicEngine) {
  _inherits(ComputeEngine, _BasicEngine);

  /**
   * @constructor
   */
  function ComputeEngine() {
    _classCallCheck(this, ComputeEngine);

    var _this = _possibleConstructorReturn(this, (ComputeEngine.__proto__ || Object.getPrototypeOf(ComputeEngine)).call(this));

    _this._l = [];
    _this._compute = true;
    // Save all qubit ids from qubits which are created or destroyed.
    _this.allocatedQubitIDs = new Set();
    _this.deallocatedQubitIDs = new Set();
    return _this;
  }

  /**
    Modify the command tags, inserting an UncomputeTag.
    @param {Command} cmd Command to modify.
     */


  _createClass(ComputeEngine, [{
    key: 'addUnComputeTag',
    value: function addUnComputeTag(cmd) {
      cmd.tags.push(new _tag.UncomputeTag());
      return cmd;
    }

    /**
      Send uncomputing gates.
        Sends the inverse of the stored commands in reverse order down to the
    next engine. And also deals with allocated qubits in Compute section.
      If a qubit has been allocated during compute, it will be deallocated
    during uncompute. If a qubit has been allocated and deallocated during
    compute, then a new qubit is allocated and deallocated during
    uncompute.
       */

  }, {
    key: 'runUnCompute',
    value: function runUnCompute() {
      var _this2 = this;

      // No qubits allocated during Compute section -> do standard uncompute
      if (this.allocatedQubitIDs.size === 0) {
        var cmds = this._l.rmap(function (cmd) {
          return _this2.addUnComputeTag(cmd.getInverse());
        });
        this.send(cmds);
        return;
      }

      // qubits ids which were allocated and deallocated in Compute section
      var ids_local_to_compute = (0, _polyfill.intersection)(this.allocatedQubitIDs, this.deallocatedQubitIDs);
      // qubit ids which were allocated but not yet deallocated in
      // Compute section
      // TODO: why need to calculate this???
      // const ids_still_alive = symmetricDifference(this.allocatedQubitIDs, this.deallocatedQubitIDs)

      // No qubits allocated and already deallocated during compute.
      // Don't inspect each command as below -> faster uncompute
      // Just find qubits which have been allocated and deallocate them
      if (ids_local_to_compute.size === 0) {
        this._l.rforEach(function (cmd) {
          if (cmd.gate.equal(_gates.Allocate)) {
            var qubit_id = cmd.qubits[0][0].id;
            // Remove this qubit from MainEngine.active_qubits and
            // set qubit.id to = -1 in Qubit object such that it won't
            // send another deallocate when it goes out of scope
            var qubit_found = false;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = _this2.main.activeQubits[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var active_qubit = _step.value;

                if (active_qubit.id === qubit_id) {
                  active_qubit.id = -1;
                  active_qubit.deallocate();
                  qubit_found = true;
                  break;
                }
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

            if (!qubit_found) {
              throw new _error.QubitManagementError('\nQubit was not found in ' + 'MainEngine.active_qubits.\n');
            }
            _this2.send([_this2.addUnComputeTag(cmd.getInverse())]);
          } else {
            _this2.send([_this2.addUnComputeTag(cmd.getInverse())]);
          }
        });
        return;
      }

      // There was at least one qubit allocated and deallocated within
      // compute section. Handle uncompute in most general case
      var new_local_id = {};
      this._l.slice(0).rforEach(function (cmd) {
        if (cmd.gate.equal(_gates.Deallocate)) {
          (0, _assert2.default)(ids_local_to_compute.has(cmd.qubits[0][0].id));
          // Create new local qubit which lives within uncompute section

          // Allocate needs to have old tags + uncompute tag
          var add_uncompute = function add_uncompute(command) {
            var old_tags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : cmd.tags.slice(0);

            command.tags = old_tags.concat([new _tag.UncomputeTag()]);
            return command;
          };
          var tagger_eng = new _cmdmodifier2.default(add_uncompute);
          (0, _util.insertEngine)(_this2, tagger_eng);
          var new_local_qb = _this2.allocateQubit();
          (0, _util.dropEngineAfter)(_this2);

          new_local_id[cmd.qubits[0][0].id] = new_local_qb[0].id;
          // Set id of new_local_qb to -1 such that it doesn't send a
          // deallocate gate
          new_local_qb[0].id = -1;
        } else if (cmd.gate.equal(_gates.Allocate)) {
          // Deallocate qubit
          if (ids_local_to_compute.has(cmd.qubits[0][0].id)) {
            // Deallocate local qubit and remove id from new_local_id
            var old_id = cmd.qubits[0][0].id;
            cmd.qubits[0][0].id = new_local_id[cmd.qubits[0][0].id];
            delete new_local_id[old_id];
            _this2.send([_this2.addUnComputeTag(cmd.getInverse())]);
          } else {
            // Deallocate qubit which was allocated in compute section:
            var qubit_id = cmd.qubits[0][0].id;
            // Remove this qubit from MainEngine.active_qubits and
            // set qubit.id to = -1 in Qubit object such that it won't
            // send another deallocate when it goes out of scope
            var qubit_found = false;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = _this2.main.activeQubits[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var active_qubit = _step2.value;

                if (active_qubit.id === qubit_id) {
                  active_qubit.id = -1;
                  active_qubit.deallocate();
                  qubit_found = true;
                  break;
                }
              }
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

            if (!qubit_found) {
              throw new _error.QubitManagementError('\nQubit was not found in ' + 'MainEngine.active_qubits.\n');
            }
            _this2.send([_this2.addUnComputeTag(cmd.getInverse())]);
          }
        } else {
          // Process commands by replacing each local qubit from
          // compute section with new local qubit from the uncompute
          // section
          if (Object.keys(new_local_id).length > 0) {
            // Only if we still have local qubits
            cmd.allQubits.forEach(function (qureg) {
              qureg.forEach(function (qubit) {
                if (new_local_id[qubit.id]) {
                  qubit.id = new_local_id[qubit.id];
                }
              });
            });
          }
          _this2.send([_this2.addUnComputeTag(cmd.getInverse())]);
        }
      });
    }

    /**
    End the compute step (exit the Compute() - statement).
    Will tell the Compute-engine to stop caching. It then waits for the
      uncompute instruction, which is when it sends all cached commands
    inverted and in reverse order down to the next compiler engine.
        @throws {QubitManagementError} If qubit has been deallocated in Compute
    section which has not been allocated in Compute section
    */

  }, {
    key: 'endCompute',
    value: function endCompute() {
      this._compute = false;
      if (!(0, _polyfill.setIsSuperSet)(this.allocatedQubitIDs, this.deallocatedQubitIDs)) {
        throw new _error.QubitManagementError('\nQubit has been deallocated in with Compute(eng) context \n' + 'which has not been allocated within this Compute section');
      }
    }

    /**
    If in compute-mode: Receive commands and store deepcopy of each cmd.
      Add ComputeTag to received cmd and send it on.
      Otherwise: send all received commands directly to next_engine.
        @param {Command[]} commandList List of commands to receive.
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this3 = this;

      if (this._compute) {
        commandList.forEach(function (cmd) {
          if (cmd.gate.equal(_gates.Allocate)) {
            _this3.allocatedQubitIDs.add(cmd.qubits[0][0].id);
          } else if (cmd.gate.equal(_gates.Deallocate)) {
            _this3.deallocatedQubitIDs.add(cmd.qubits[0][0].id);
          }
          _this3._l.push(cmd.copy());
          cmd.tags.push(new _tag.ComputeTag());
        });
      }
      this.send(commandList);
    }
  }]);

  return ComputeEngine;
}(_basics.BasicEngine);

/**
 * @class Uncompute
 */


var UncomputeEngine = exports.UncomputeEngine = function (_BasicEngine2) {
  _inherits(UncomputeEngine, _BasicEngine2);

  /**
   * @constructor
   */
  function UncomputeEngine() {
    _classCallCheck(this, UncomputeEngine);

    // Save all qubit ids from qubits which are created or destroyed.
    var _this4 = _possibleConstructorReturn(this, (UncomputeEngine.__proto__ || Object.getPrototypeOf(UncomputeEngine)).call(this));

    _this4.allocatedQubitIDs = new Set();
    _this4.deallocatedQubitIDs = new Set();
    return _this4;
  }

  /**
  Receive commands and add an UncomputeTag to their tags.
      @param {Command[]} commandList List of commands to handle.
   */


  _createClass(UncomputeEngine, [{
    key: 'receive',
    value: function receive(commandList) {
      var _this5 = this;

      commandList.forEach(function (cmd) {
        if (cmd.gate.equal(_gates.Allocate)) {
          _this5.allocatedQubitIDs.add(cmd.qubits[0][0].id);
        } else if (cmd.gate.equal(_gates.Deallocate)) {
          _this5.deallocatedQubitIDs.add(cmd.qubits[0][0].id);
        }
        cmd.tags.push(new _tag.UncomputeTag());
        _this5.send([cmd]);
      });
    }
  }]);

  return UncomputeEngine;
}(_basics.BasicEngine);

/**
Start a compute-section.

    @example

Compute(eng, () => {
  do_something(qubits)
  action(qubits)
})
Uncompute(eng) // runs inverse of the compute section

Warning:
    If qubits are allocated within the compute section, they must either be
uncomputed and deallocated within that section or, alternatively,
    uncomputed and deallocated in the following uncompute section.

    This means that the following examples are valid:

 @example

Compute(eng, () => {
  anc = eng.allocateQubit()
  do_something_with_ancilla(anc)
})
 ...
uncompute_ancilla(anc)
anc.deallocate()

do_something_else(qubits)

Uncompute(eng)  // will allocate a new ancilla (with a different id)
// and then deallocate it again

 @example

Compute(eng, () => {
anc = eng.allocateQubit()
do_something_with_ancilla(anc)
...
})
do_something_else(qubits)

Uncompute(eng)  // will deallocate the ancilla!

    After the uncompute section, ancilla qubits allocated within the
compute section will be invalid (and deallocated). The same holds when
using CustomUncompute.

    Failure to comply with these rules results in an exception being thrown.
 */


function Compute(engine, func) {
  var computeEngine = null;
  var enter = function enter() {
    computeEngine = new ComputeEngine();
    (0, _util.insertEngine)(engine, computeEngine);
  };

  var exit = function exit() {
    computeEngine.endCompute();
    computeEngine = null;
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

/**
Start a custom uncompute-section.

    @example

Compute(eng, () => {
  do_something(qubits)
})

 action(qubits)

 CustomUncompute(eng, () => {
  do_something_inverse(qubits)
})

@throws {QubitManagementError} If qubits are allocated within Compute or within
CustomUncompute context but are not deallocated.
 */
function CustomUncompute(engine, func) {
  var allocatedQubitIDs = new Set();
  var deallocatedQubitIDs = new Set();
  var uncomputeEngine = null;

  var enter = function enter() {
    // first, remove the compute engine
    var compute_eng = engine.next;
    if (!(compute_eng instanceof ComputeEngine)) {
      throw new _error.QubitManagementError('Invalid call to CustomUncompute: No corresponding "Compute" statement found.');
    }
    // Make copy so there is not reference to compute_eng anymore
    // after __enter__
    allocatedQubitIDs = new Set(compute_eng.allocatedQubitIDs);
    deallocatedQubitIDs = new Set(compute_eng.deallocatedQubitIDs);
    (0, _util.dropEngineAfter)(engine);
    // Now add uncompute engine
    uncomputeEngine = new UncomputeEngine();
    (0, _util.insertEngine)(engine, uncomputeEngine);
  };

  var exit = function exit() {
    // If an error happens in this context, qubits might not have been
    // deallocated because that code section was not yet executed,
    // so don't check and raise an additional error.

    // Check that all qubits allocated within Compute or within
    // CustomUncompute have been deallocated.
    var all_allocated_qubits = (0, _polyfill.unionSet)(allocatedQubitIDs, uncomputeEngine.allocatedQubitIDs);
    var all_deallocated_qubits = (0, _polyfill.unionSet)(deallocatedQubitIDs, uncomputeEngine.deallocatedQubitIDs);
    if (!(0, _polyfill.setEqual)(all_allocated_qubits, all_deallocated_qubits)) {
      throw new _error.QubitManagementError('\nError. Not all qubits have been deallocated which have \n' + 'been allocated in the Compute(eng) or with ' + 'CustomUncompute(eng) context.');
    }
    // remove uncompute engine
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

/**
Uncompute automatically.

    @example
 Compute(eng, () => {
  do_something(qubits)
})
  action(qubits)
  Uncompute(eng) // runs inverse of the compute section
 */
function Uncompute(engine) {
  var compute_eng = engine.next;
  if (!(compute_eng instanceof ComputeEngine)) {
    throw new Error('Invalid call to Uncompute: No corresponding "Compute" statement found.');
  }
  compute_eng.runUnCompute();
  (0, _util.dropEngineAfter)(engine);

  if (engine.autoDeallocateQubits) {
    engine.autoDeallocateQubits();
  }
}