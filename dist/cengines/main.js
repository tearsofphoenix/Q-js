'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _basics = require('./basics');

var _gates = require('../ops/gates');

var _basicmapper = require('./basicmapper');

var _basicmapper2 = _interopRequireDefault(_basicmapper);

var _command = require('../ops/command');

var _command2 = _interopRequireDefault(_command);

var _qubit = require('../types/qubit');

var _error = require('../meta/error');

var _setups = require('../setups');

var _simulator = require('../backends/simulators/simulator');

var _simulator2 = _interopRequireDefault(_simulator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

// Contains the main engine of every compiler engine pipeline, called MainEngine.


/**
 * @class MainEngine
 * @desc
The MainEngine class provides all functionality of the main compiler
engine.

    It initializes all further compiler engines (calls, e.g.,
    .next_engine=...) and keeps track of measurement results and active
qubits (and their IDs).

Attributes:
    next_engine (BasicEngine): Next compiler engine (or the back-end).
main_engine (MainEngine): Self.
active_qubits (WeakSet): WeakSet containing all active qubits
dirty_qubits (Set): Containing all dirty qubit ids
backend (BasicEngine): Access the back-end.
mapper (BasicMapperEngine): Access to the mapper if there is one.
 */
var MainEngine = function (_BasicEngine) {
  _inherits(MainEngine, _BasicEngine);

  /**
   * @constructor
  Initialize the main compiler engine and all compiler engines.
      Sets 'next_engine'- and 'main_engine'-attributes of all compiler
  engines and adds the back-end as the last engine.
      @param {BasicEngine} backend Backend to send the compiled circuit to.
    @param {Array.<BasicEngine>} engineList List of engines / backends to use
            as compiler engines. Note: The engine list must not contain
            multiple mappers (instances of BasicMapperEngine).
            Default: getEngineList()
   @param {boolean} verbose Either print full or compact error messages.
    Default: false (i.e. compact error messages).
      @example
      const eng = new MainEngine() // uses default engine_list and the Simulator
  Instead of the default `engine_list` one can use, e.g., one of the IBM
  setups which defines a custom `engine_list` useful for one of the IBM
  chips
      @example
      const eng = new MainEngine(new Simulator, getEngineList())
      // eng uses the default Simulator backend
  Alternatively, one can specify all compiler engines explicitly, e.g.,
      @example
      const rule_set = new DecompositionRuleSet()
      const engines = [new AutoReplacer(rule_set), new TagRemover(), new LocalOptimizer(3)]
      const eng = new MainEngine(new Simulator(), engines)
  */
  function MainEngine(backend, engineList) {
    var verbose = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    _classCallCheck(this, MainEngine);

    var _this = _possibleConstructorReturn(this, (MainEngine.__proto__ || Object.getPrototypeOf(MainEngine)).call(this));

    if (!backend) {
      backend = new _simulator2.default();
    } else if (!(backend instanceof _basics.BasicEngine)) {
      throw new Error('\nYou supplied a backend which is not supported,\n' + 'i.e. not an instance of BasicEngine.\n' + 'Did you forget the brackets to create an instance?\n' + 'E.g. MainEngine(backend=Simulator) instead of \n' + '     MainEngine(backend=Simulator())');
    }

    if (!engineList) {
      engineList = (0, _setups.getEngineList)();
    }

    _this.mapper = null;
    if (Array.isArray(engineList)) {
      engineList.forEach(function (looper) {
        if (!(looper instanceof _basics.BasicEngine)) {
          throw new Error('\nYou supplied an unsupported engine in engine_list,' + '\ni.e. not an instance of BasicEngine.\n' + 'Did you forget the brackets to create an instance?\n' + 'E.g. MainEngine(engine_list=[AutoReplacer]) instead ' + 'of\n     MainEngine(engine_list=[AutoReplacer()])');
        }
        if (looper instanceof _basicmapper2.default) {
          if (!_this.mapper) {
            _this.mapper = looper;
          } else {
            throw new Error('More than one mapper engine is not supported.');
          }
        }
      });
    } else {
      throw new Error('The provided list of engines is not a list!');
    }

    engineList = [].concat(_toConsumableArray(engineList), [backend]);

    _this.backend = backend;

    // Test that user did not supply twice the same engine instance
    var num_different_engines = new Set(engineList).size;
    if (engineList.length !== num_different_engines) {
      throw new Error('\nError:\n You supplied twice the same engine as backend' + " or item in engine_list. This doesn't work. Create two \n" + ' separate instances of a compiler engine if it is needed\n' + ' twice.\n');
    }

    _this._qubitIdx = 0;
    for (var i = 0; i < engineList.length - 1; ++i) {
      engineList[i].next = engineList[i + 1];
      engineList[i].main = _this;
    }

    backend.main = _this;
    backend.isLastEngine = true;

    _this.next = engineList[0];
    _this.main = _this;
    _this.activeQubits = new Set();
    _this._measurements = {};
    _this.dirtyQubits = new Set();
    _this.verbose = verbose;
    return _this;
  }

  /**
  Register a measurement result
  The engine being responsible for measurement results needs to register
  these results with the master engine such that they are available when
  the user calls an int() or bool() conversion operator on a measured
  qubit.
      @param {BasicQubit} qubit Qubit for which to register the measurement result.
    @param {boolean} value Boolean value of the measurement outcome (true / false = 1 / 0 respectively).
   */


  _createClass(MainEngine, [{
    key: 'setMeasurementResult',
    value: function setMeasurementResult(qubit, value) {
      this._measurements[qubit.id] = !!value;
    }

    /**
    Return the classical value of a measured qubit, given that an engine
    registered this result previously (see setMeasurementResult).
      @param {BasicQubit} qubit Qubit of which to get the measurement result.
        @example
    const eng = new MainEngine()
    const qubit = eng.allocateQubit() // quantum register of size 1
    H.or(qubit)
    Measure.or(qubit)
    eng.getMeasurementResult(qubit[0]) == qubit.toNumber()
     */

  }, {
    key: 'getMeasurementResult',
    value: function getMeasurementResult(qubit) {
      var v = this._measurements[qubit.id];
      if (typeof v === 'undefined') {
        throw new _error.NotYetMeasuredError('' + ("\nError: Can't access measurement result for " + 'qubit #') + qubit.id + '. The problem may ' + 'be:\n\t1. Your ' + 'code lacks a measurement statement\n\t' + '2. You have not yet called engine.flush() to ' + 'force execution of your code\n\t3. The ' + 'underlying backend failed to register ' + 'the measurement result\n');
      } else {
        return v;
      }
    }

    /**
      Returns a unique qubit id to be used for the next qubit allocation.
        @return {number} New unique qubit id.
    */

  }, {
    key: 'getNewQubitID',
    value: function getNewQubitID() {
      this._qubitIdx += 1;
      return this._qubitIdx - 1;
    }

    /**
    Forward the list of commands to the first engine.
      @param {Command[]} commandList List of commands to receive (and then send on)
     */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      this.send(commandList);
    }

    /**
    Forward the list of commands to the next engine in the pipeline.
      It also shortens exception stack traces if this.verbose is false.
     */

  }, {
    key: 'send',
    value: function send(commandList) {
      try {
        this.next.receive(commandList);
      } catch (e) {
        if (this.verbose) {
          console.log(e);
        }
        throw e;
      }
    }

    /**
      Destroy the main engine.
     Flushes the entire circuit down the pipeline, clearing all temporary buffers (in, e.g., optimizers).
    */

  }, {
    key: 'deallocate',
    value: function deallocate() {
      this.flush(true);
    }

    /**
      Flush the entire circuit down the pipeline, clearing potential buffers (of, e.g., optimizers).
        @param {boolean} deallocateQubits If true, deallocates all qubits that are
      still alive (invalidating references to them by setting their id to -1).
    */

  }, {
    key: 'flush',
    value: function flush() {
      var deallocateQubits = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (deallocateQubits) {
        this.activeQubits.forEach(function (qb) {
          return qb.deallocate();
        });
        this.activeQubits = new Set();
      }

      this.receive([new _command2.default(this, new _gates.FlushGate(), [[new _qubit.BasicQubit(this, -1)]])]);
    }
  }]);

  return MainEngine;
}(_basics.BasicEngine);

exports.default = MainEngine;