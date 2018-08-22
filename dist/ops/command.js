'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

/**
This file defines the apply_command function and the Command class.

When a gate is applied to qubits, e.g.,

 @example

CNOT | (qubit1, qubit2)

a Command object is generated which represents both the gate, qubits and
control qubits. This Command object then gets sent down the compilation
pipeline.

    In detail, the Gate object overloads the operator| (magic method __or__)
to generate a Command object which stores the qubits in a canonical order
using interchangeable qubit indices defined by the gate to allow the
optimizer to cancel the following two gates

 @example
Swap | (qubit1, qubit2)
Swap | (qubit2, qubit1)

The command then gets sent to the MainEngine via the
apply wrapper (apply_command).
*/


var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _polyfill = require('../libs/polyfill');

var _cycle = require('./_cycle');

var _qubit = require('../types/qubit');

var _util = require('../libs/util');

var _error = require('../meta/error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Command
 * @desc
Class used as a container to store commands. If a gate is applied to
qubits, then the gate and qubits are saved in a command object. Qubits
are copied into WeakQubitRefs in order to allow early deallocation (would
be kept alive otherwise). WeakQubitRef qubits don't send deallocate gate
when destructed.

    Attributes:
gate: The gate to execute
qubits: Tuple of qubit lists (e.g. Quregs). Interchangeable qubits
are stored in a unique order
control_qubits: The Qureg of control qubits in a unique order
engine: The engine (usually: MainEngine)
tags: The list of tag objects associated with this command
(e.g., ComputeTag, UncomputeTag, LoopTag, ...). tag objects need to
support ==, != (__eq__ and __ne__) for comparison as used in e.g.
    TagRemover. New tags should always be added to the end of the list.
    This means that if there are e.g. two LoopTags in a command, tag[0]
is from the inner scope while tag[1] is from the other scope as the
other scope receives the command after the inner scope LoopEngine
and hence adds its LoopTag to the end.
    all_qubits: A tuple of control_qubits + qubits
 */
var Command = function () {
  /**
   * @constructor
    Note:
  control qubits (Command.control_qubits) are stored as a
  list of qubits, and command tags (Command.tags) as a list of tag-
  objects. All functions within this class also work if
    BasicQubits are supplied instead of normal Qubit objects (see BasicQubits).
  @param {BasicEngine} engine engine which created the qubit (mostly the MainEngine)
  @param {BasicGate} gate Gate to be executed
  @param {Array.<Qureg>} qubits Array of quantum registers (to which the gate is applied)
  @param {Qureg|Array.<Qubit>} controls Qubits that condition the command.
  @param {any[]} tags Tags associated with the command.
     */
  function Command(engine, gate, qubits) {
    var controls = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    var tags = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

    _classCallCheck(this, Command);

    var qs = qubits.map(function (qureg) {
      return new (Function.prototype.bind.apply(_qubit.Qureg, [null].concat(_toConsumableArray(qureg.map(function (looper) {
        return new _qubit.BasicQubit(looper.engine, looper.id);
      })))))();
    });
    this.gate = gate;
    this.tags = tags;
    this.qubits = qs;
    this.controlQubits = controls;
    this.engine = engine;
  }

  _createClass(Command, [{
    key: 'copy',


    /**
     * return the copy of current command
     * @return {Command}
     */
    value: function copy() {
      var qubits = this.qubits.map(function (looper) {
        return _qubit.BasicQubit.copyArray(looper);
      });
      var controlQubits = _qubit.BasicQubit.copyArray(this.controlQubits);
      return new Command(this.engine, this.gate.copy(), qubits, controlQubits, this.tags.slice(0));
    }

    /**
      Get the command object corresponding to the inverse of this command.
      Inverts the gate (if possible) and creates a new command object from the result.
        @throws {NotInvertible} If the gate does not provide an inverse (see BasicGate.getInverse)
       */

  }, {
    key: 'getInverse',
    value: function getInverse() {
      return new Command(this.engine, (0, _cycle.getInverse)(this.gate), this.qubits, this.controlQubits, this.tags.slice(0));
    }

    /**
      Merge this command with another one and return the merged command object.
      @param {Command} other Other command to merge with this one (self)
      @throws NotMergeable if the gates don't supply a get_merged()-function or can't be merged for other reasons.
       */

  }, {
    key: 'getMerged',
    value: function getMerged(other) {
      if ((0, _polyfill.arrayEqual)(this.tags, other.tags) && (0, _polyfill.arrayEqual)(this.allQubits, other.allQubits) && this.engine === other.engine) {
        return new Command(this.engine, this.gate.getMerged(other.gate), this.qubits, this.controlQubits, this.tags.slice(0));
      }

      throw new _error.NotMergeable('Command not mergeable');
    }

    /**
      Order the given qubits according to their IDs (for unique comparison of commands).
        @param {Array.<Qubit>} qubits Array of quantum registers (i.e., tuple of lists of qubits)
      @return {Array.<Qubit>} Ordered tuple of quantum registers
    */

  }, {
    key: 'orderQubits',
    value: function orderQubits(qubits) {
      var orderedQubits = qubits.slice(0);
      var iqi = this.interchangeableQubitIndices;
      iqi.forEach(function (old_positions) {
        var new_positions = old_positions.slice(0).sort(function (a, b) {
          return orderedQubits[a][0].id - orderedQubits[b][0].id;
        });
        var qubits_new_order = [];
        new_positions.forEach(function (l) {
          return qubits_new_order.push(orderedQubits[l]);
        });

        old_positions.forEach(function (v, i) {
          orderedQubits[v] = qubits_new_order[i];
        });
      });

      (0, _util.markTuple)(orderedQubits);
      return orderedQubits;
    }

    /**
      Return nested list of qubit indices which are interchangeable.
        Certain qubits can be interchanged (e.g., the qubit order for a Swap
    gate). To ensure that only those are sorted when determining the
    ordering (see _order_qubits), this.interchangeable_qubit_indices is
    used.
      @example
    If we can interchange qubits 0,1 and qubits 3,4,5,
      then this function returns [[0,1],[3,4,5]]
       */

  }, {
    key: 'addControlQubits',


    /**
    Add (additional) control qubits to this command object.
        They are sorted to ensure a canonical order. Also Qubit objects
    are converted to WeakQubitRef objects to allow garbage collection and
    thus early deallocation of qubits.
        @param {Array.<Qubit>} qubits List of qubits which control this
      gate, i.e., the gate is only executed if all qubits are in state 1.
    */
    value: function addControlQubits(qubits) {
      (0, _assert2.default)(Array.isArray(qubits));
      this._controlQubits = this._controlQubits.concat(_qubit.BasicQubit.copyArray(qubits));
      this._controlQubits.sort(function (a, b) {
        return a.id - b.id;
      });
    }

    /**
    Apply a command.
        Extracts the qubits-owning (target) engine from the Command object and sends the Command to it.
     */

  }, {
    key: 'apply',
    value: function apply() {
      this.engine.receive([this]);
    }

    /**
    Get all qubits (gate and control qubits).
    Returns a tuple T where T[0] is a quantum register (a list of
    WeakQubitRef objects) containing the control qubits and T[1:] contains
    the quantum registers to which the gate is applied.
    */

  }, {
    key: 'equal',
    value: function equal(other) {
      if (other instanceof Command) {
        try {
          var f1 = this.gate.equal(other.gate);
          var t1 = (0, _polyfill.arrayEqual)(this.tags, other.tags);
          var e1 = this.engine === other.engine;
          var b = (0, _polyfill.arrayEqual)(this.allQubits, other.allQubits);
          return f1 && t1 && e1 && b;
        } catch (e) {
          return false;
        }
      }
      return false;
    }

    /**
     * @return {string}
     */

  }, {
    key: 'toString',
    value: function toString() {
      var qubits = this.qubits;

      var ctrlqubits = this.controlQubits;

      if (ctrlqubits.length > 0) {
        qubits = [ctrlqubits].concat(qubits);
      }
      var qs = '';
      if (qubits.length === 1) {
        qs = new _qubit.Qureg(qubits[0]).toString();
      } else {
        qs = '( ';
        qubits.forEach(function (qreg) {
          qs += new _qubit.Qureg(qreg).toString();
          qs += ', ';
        });
        qs = qs.substring(0, qs.length - 2) + ' )';
      }
      var cs = '';
      for (var i = 0; i < ctrlqubits.length; ++i) {
        cs += 'C';
      }
      return '' + cs + this.gate.toString() + ' | ' + qs;
    }

    /**
     * @return {string}
     */

  }, {
    key: 'inspect',
    value: function inspect() {
      return this.toString();
    }
  }, {
    key: 'qubits',
    get: function get() {
      return this._qubits;
    },
    set: function set(nq) {
      this._qubits = this.orderQubits(nq);
    }
  }, {
    key: 'interchangeableQubitIndices',
    get: function get() {
      return this.gate.interchangeableQubitIndices;
    }
  }, {
    key: 'controlQubits',
    get: function get() {
      return this._controlQubits;
    }

    /**
      Set control_qubits to qubits
    @param {Qureg} nq quantum register
    */
    ,
    set: function set(nq) {
      this._controlQubits = nq.sort(function (a, b) {
        return a.id - b.id;
      }).map(function (q) {
        return new _qubit.BasicQubit(q.engine, q.id);
      });
    }
  }, {
    key: 'allQubits',
    get: function get() {
      return [this._controlQubits].concat(this.qubits);
    }
  }, {
    key: 'controlCount',
    get: function get() {
      return this.controlQubits.length;
    }
  }, {
    key: 'engine',
    get: function get() {
      return this._engine;
    }

    /**
      Set / Change engine of all qubits to engine.
      @param {BasicEngine} ng New owner of qubits and owner of this Command object
    */
    ,
    set: function set(ng) {
      this._engine = ng;
      this.qubits.forEach(function (qureg) {
        qureg.forEach(function (qubit) {
          qubit.engine = ng;
        });
      });
      this._controlQubits.forEach(function (qubit) {
        return qubit.engine = ng;
      });
    }
  }]);

  return Command;
}();

exports.default = Command;