'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ForwarderEngine = exports.BasicEngine = undefined;

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

var _qubit = require('../types/qubit');

var _command = require('../ops/command');

var _command2 = _interopRequireDefault(_command);

var _gates = require('../ops/gates');

var _tag = require('../meta/tag');

var _error = require('../meta/error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class BasicEngine
 * @abstract
 * @desc
Basic compiler engine: All compiler engines are derived from this class.
It provides basic functionality such as qubit allocation/deallocation and
functions that provide information about the engine's position (e.g., next
engine).

This information is provided by the MainEngine, which initializes all
further engines.

    Attributes:
next_engine (BasicEngine): Next compiler engine (or the back-end).
main_engine (MainEngine): Reference to the main compiler engine.
is_last_engine (bool): true for the last engine, which is the back-end.
 */
var BasicEngine = exports.BasicEngine = function () {
  /**
   * @constructor
   Initialize the basic engine.
      Initializes local variables such as _next_engine, _main_engine, etc. to None.
  */
  function BasicEngine() {
    _classCallCheck(this, BasicEngine);

    this.isLastEngine = false;
  }

  /**
    Default implementation of isAvailable:
    Ask the next engine whether a command is available, i.e.,
    whether it can be executed by the next engine(s).
      @param {Command} cmd Command for which to check availability.
    @return {boolean} true if the command can be executed.
      @throws {LastEngineError} If is_last_engine is true but isAvailable is not implemented.
     */


  _createClass(BasicEngine, [{
    key: 'isAvailable',
    value: function isAvailable(cmd) {
      if (!this.isLastEngine) {
        return this.next.isAvailable(cmd);
      }
      throw new _error.LastEngineError('Should not be last!');
    }

    /**
      Return a new qubit as a list containing 1 qubit object (quantum
    register of size 1).
    Allocates a new qubit by getting a (new) qubit id from the MainEngine,
      creating the qubit object, and then sending an AllocateQubit command
    down the pipeline. If dirty=true, the fresh qubit can be replaced by
    a pre-allocated one (in an unknown, dirty, initial state). Dirty qubits
    must be returned to their initial states before they are deallocated /
    freed.
        All allocated qubits are added to the MainEngine's set of active
    qubits as weak references. This allows proper clean-up at the end of
    the JavaScript program (using atexit), deallocating all qubits which are
    still alive. Qubit ids of dirty qubits are registered in MainEngine's
    dirty_qubits set.
        @param {boolean} dirty If true, indicates that the allocated qubit may be
      dirty (i.e., in an arbitrary initial state).
        @return {Qureg} Qureg of length 1, where the first entry is the allocated qubit.
    */

  }, {
    key: 'allocateQubit',
    value: function allocateQubit() {
      var dirty = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var new_id = this.main.getNewQubitID();
      var qubit = new _qubit.Qubit(this, new_id);
      var qb = new _qubit.Qureg(qubit);
      var cmd = new _command2.default(this, _gates.Allocate, [qb]);
      if (dirty) {
        if (this.isMetaTagSupported(_tag.DirtyQubitTag)) {
          cmd.tags.push(new _tag.DirtyQubitTag());
          this.main.dirtyQubits.add(qubit.id);
        }
      }
      this.main.activeQubits.add(qubit);
      this.send([cmd]);
      return qb;
    }

    /**
      Allocate n qubits and return them as a quantum register, which is a
    list of qubit objects.
        @param {number} n Number of qubits to allocate
      @return {Qureg} Qureg of length n, a list of n newly allocated qubits.
    */

  }, {
    key: 'allocateQureg',
    value: function allocateQureg(n) {
      var array = [];
      for (var i = 0; i < n; ++i) {
        var q = this.allocateQubit()[0];
        array.push(q);
      }
      return new _qubit.Qureg(array);
    }

    /**
      Deallocate a qubit (and sends the deallocation command down the
    pipeline). If the qubit was allocated as a dirty qubit, add
    DirtyQubitTag() to Deallocate command.
        @param {BasicQubit} qubit Qubit to deallocate.
      @throws {Error} Qubit already deallocated. Caller likely has a bug.
    */

  }, {
    key: 'deallocateQubit',
    value: function deallocateQubit(qubit) {
      if (qubit.id === -1) {
        throw new Error('Already deallocated.');
      }
      var is_dirty = this.main.dirtyQubits.has(qubit.id);
      var cmds = [new _command2.default(this, _gates.Deallocate, [new _qubit.Qureg([qubit])], [], is_dirty ? [new _tag.DirtyQubitTag()] : [])];
      this.send(cmds);
    }

    /**
      Check if there is a compiler engine handling the meta tag
        @param {function} metaTag Meta tag class for which to check support
        @return {boolean} true if one of the further compiler engines is a
    meta tag handler, i.e., engine.is_meta_tag_handler(meta_tag)
    returns true.
       */

  }, {
    key: 'isMetaTagSupported',
    value: function isMetaTagSupported(metaTag) {
      var engine = this;
      try {
        while (true) {
          if (typeof engine.isMetaTagHandler === 'function' && engine.isMetaTagHandler(metaTag)) {
            return true;
          }
          engine = engine.next;
        }
      } catch (e) {
        return false;
      }
    }

    /**
      Forward the list of commands to the next engine in the pipeline.
     @param {Command[]} commandList
    */

  }, {
    key: 'send',
    value: function send(commandList) {
      this.next.receive(commandList);
    }
  }, {
    key: 'receive',
    value: function receive() {
      // do nothing
    }
  }]);

  return BasicEngine;
}();

/**
 * @class ForwarderEngine
 * @desc
    A ForwarderEngine is a trivial engine which forwards all commands to the next engine.

    It is mainly used as a substitute for the MainEngine at lower levels such
that meta operations still work (e.g., with Compute).
 */


var ForwarderEngine = exports.ForwarderEngine = function (_BasicEngine) {
  _inherits(ForwarderEngine, _BasicEngine);

  /**
   * @constructor
      @param {BasicEngine} engine Engine to forward all commands to.
    @param {function} cmdModFunc Function which is called before sending a
  command. Each command cmd is replaced by the command it
  returns when getting called with cmd.
     */
  function ForwarderEngine(engine, cmdModFunc) {
    _classCallCheck(this, ForwarderEngine);

    var _this = _possibleConstructorReturn(this, (ForwarderEngine.__proto__ || Object.getPrototypeOf(ForwarderEngine)).call(this));

    _this.main = engine.main;
    _this.next = engine;
    if (!cmdModFunc) {
      cmdModFunc = function cmdModFunc(x) {
        return x;
      };
    }
    _this.cmdModFunc = cmdModFunc;
    return _this;
  }

  _createClass(ForwarderEngine, [{
    key: 'receive',
    value: function receive(commandList) {
      var _this2 = this;

      var newCommandList = commandList.map(function (cmd) {
        return _this2.cmdModFunc(cmd);
      });
      this.send(newCommandList);
    }

    /**
     * internal usaged for deallocate qubits after `Uncompute`
     */

  }, {
    key: 'autoDeallocateQubits',
    value: function autoDeallocateQubits() {
      var _this3 = this;

      var copy = new Set(this.main.activeQubits);
      copy.forEach(function (qb) {
        if (qb.engine === _this3) {
          // need to
          qb.deallocate();
        }
      });
    }
  }]);

  return ForwarderEngine;
}(BasicEngine);