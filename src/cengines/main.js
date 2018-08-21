/*
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
import {BasicEngine} from './basics'
import {FlushGate} from '../ops/gates'
import BasicMapperEngine from './basicmapper'
import Command from '../ops/command'
import {BasicQubit} from '../types/qubit';
import {NotYetMeasuredError} from '../meta/error'
import {getEngineList} from '../setups'
import Simulator from '../backends/simulators/simulator'

/**
 * @class MainEngine
 * @classdesc
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
export default class MainEngine extends BasicEngine {
  /**
   * @constructor
  Initialize the main compiler engine and all compiler engines.

    Sets 'next_engine'- and 'main_engine'-attributes of all compiler
engines and adds the back-end as the last engine.

    @param {BasicEngine} backend Backend to send the compiled circuit to.
    @param {Array<BasicEngine>} engineList List of engines / backends to use
            as compiler engines. Note: The engine list must not contain
            multiple mappers (instances of BasicMapperEngine).
            Default: getEngineList()
   @param {boolean} verbose Either print full or compact error messages.
    Default: false (i.e. compact error messages).

    @example
    @code
      const eng = new MainEngine() // uses default engine_list and the Simulator

Instead of the default `engine_list` one can use, e.g., one of the IBM
setups which defines a custom `engine_list` useful for one of the IBM
chips

    @example
    @code
      const eng = new MainEngine(new Simulator, getEngineList())
      // eng uses the default Simulator backend

Alternatively, one can specify all compiler engines explicitly, e.g.,

    @example
    @code
      const rule_set = new DecompositionRuleSet()
      const engines = [new AutoReplacer(rule_set), new TagRemover(), new LocalOptimizer(3)]
      const eng = new MainEngine(new Simulator(), engines)
  */
  constructor(backend, engineList, verbose = false) {
    super()
    if (!backend) {
      backend = new Simulator()
    } else if (!(backend instanceof BasicEngine)) {
      throw new Error('\nYou supplied a backend which is not supported,\n'
      + 'i.e. not an instance of BasicEngine.\n'
      + 'Did you forget the brackets to create an instance?\n'
      + 'E.g. MainEngine(backend=Simulator) instead of \n'
      + '     MainEngine(backend=Simulator())')
    }

    if (!engineList) {
      engineList = getEngineList()
    }

    this.mapper = null
    if (Array.isArray(engineList)) {
      engineList.forEach((looper) => {
        if (!(looper instanceof BasicEngine)) {
          throw new Error('\nYou supplied an unsupported engine in engine_list,'
          + '\ni.e. not an instance of BasicEngine.\n'
          + 'Did you forget the brackets to create an instance?\n'
          + 'E.g. MainEngine(engine_list=[AutoReplacer]) instead '
          + 'of\n     MainEngine(engine_list=[AutoReplacer()])')
        }
        if (looper instanceof BasicMapperEngine) {
          if (!this.mapper) {
            this.mapper = looper
          } else {
            throw new Error('More than one mapper engine is not supported.')
          }
        }
      })
    } else {
      throw new Error('The provided list of engines is not a list!')
    }

    engineList = [...engineList, backend]

    this.backend = backend

    // Test that user did not supply twice the same engine instance
    const num_different_engines = new Set(engineList).size
    if (engineList.length !== num_different_engines) {
      throw new Error('\nError:\n You supplied twice the same engine as backend'
      + " or item in engine_list. This doesn't work. Create two \n"
      + ' separate instances of a compiler engine if it is needed\n'
      + ' twice.\n')
    }

    this._qubitIdx = 0
    for (let i = 0; i < engineList.length - 1; ++i) {
      engineList[i].next = engineList[i + 1]
      engineList[i].main = this
    }

    backend.main = this
    backend.isLastEngine = true

    this.next = engineList[0]
    this.main = this
    this.activeQubits = new Set()
    this._measurements = {}
    this.dirtyQubits = new Set()
    this.verbose = verbose
  }

  /**
  Register a measurement result

The engine being responsible for measurement results needs to register
these results with the master engine such that they are available when
the user calls an int() or bool() conversion operator on a measured
qubit.

    @param {BasicQubit} qubit: Qubit for which to register the measurement result.
    @param {boolean} value: Boolean value of the measurement outcome (true / false = 1 / 0 respectively).
   */
  setMeasurementResult(qubit, value) {
    this._measurements[qubit.id] = !!value
  }

  /**
  Return the classical value of a measured qubit, given that an engine
registered this result previously (see setMeasurementResult).

  @param {BasicQubit} qubit: Qubit of which to get the measurement result.

    @example
  @code

const eng = new MainEngine()
const qubit = eng.allocateQubit() // quantum register of size 1
H.or(qubit)
Measure.or(qubit)
eng.getMeasurementResult(qubit[0]) == qubit.toNumber()
   */
  getMeasurementResult(qubit) {
    const v = this._measurements[qubit.id]
    if (typeof v === 'undefined') {
      throw new NotYetMeasuredError(`${"\nError: Can't access measurement result for "
      + 'qubit #'}${qubit.id}. The problem may `
      + 'be:\n\t1. Your '
      + 'code lacks a measurement statement\n\t'
      + '2. You have not yet called engine.flush() to '
      + 'force execution of your code\n\t3. The '
      + 'underlying backend failed to register '
      + 'the measurement result\n')
    } else {
      return v
    }
  }

  /**
    Returns a unique qubit id to be used for the next qubit allocation.

    @returns {number}: New unique qubit id.
  */
  getNewQubitID() {
    this._qubitIdx += 1
    return this._qubitIdx - 1
  }

  /**
  Forward the list of commands to the first engine.
    @param {Array<Command>} commandList: List of commands to receive (and then send on)
   */
  receive(commandList) {
    this.send(commandList)
  }

  /**
  Forward the list of commands to the next engine in the pipeline.
    It also shortens exception stack traces if this.verbose is false.
   */
  send(commandList) {
    try {
      this.next.receive(commandList)
    } catch (e) {
      if (this.verbose) {
        console.log(e)
      }
      throw e
    }
  }

  /**
    Destroy the main engine.
   Flushes the entire circuit down the pipeline, clearing all temporary buffers (in, e.g., optimizers).
 */
  deallocate() {
    this.flush(true)
  }

  /**
    Flush the entire circuit down the pipeline, clearing potential buffers (of, e.g., optimizers).

    @param {boolean} deallocateQubits: If true, deallocates all qubits that are
    still alive (invalidating references to them by setting their id to -1).
  */
  flush(deallocateQubits = false) {
    if (deallocateQubits) {
      this.activeQubits.forEach(qb => qb.deallocate())
      this.activeQubits = new Set()
    }

    this.receive([new Command(this, new FlushGate(), [[new BasicQubit(this, -1)]])])
  }
}
