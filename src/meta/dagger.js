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

/**
Tools to easily invert a sequence of gates.

 @example

with Dagger(eng)
H | qubit1
Rz(0.5) | qubit2
*/

import {BasicEngine} from '../cengines/basics'
import {Allocate, Deallocate} from '../ops/gates'
import {insertEngine, dropEngineAfter} from './util'
import {setEqual} from '../libs/polyfill';
import {QubitManagementError} from './error';

/**
 * @class DaggerEngine
 * @desc
 *  Stores all commands and, when done, inverts the circuit & runs it.
*/
export class DaggerEngine extends BasicEngine {
  /**
   * @constructor
   */
  constructor() {
    super()
    this.commands = []
    this.allocateQubitIDs = new Set()
    this.deallocateQubitIDs = new Set()
  }

  /**
    Run the stored circuit in reverse and check that local qubits have been deallocated.
   */
  run() {
    if (!setEqual(this.deallocateQubitIDs, this.allocateQubitIDs)) {
      throw new QubitManagementError(
        "\n Error. Qubits have been allocated in 'with "
          + "Dagger(eng)' context,\n which have not explicitely "
          + 'been deallocated.\n'
          + 'Correct usage:\n'
          + 'with Dagger(eng):\n'
          + '    qubit = eng.allocateQubit()\n'
          + '    ...\n'
          + '    del qubit[0]\n'
      )
    }
    this.commands.rforEach((cmd) => {
      this.send([cmd.getInverse()])
    })
  }

  /**
    Receive a list of commands and store them for later inversion.
    @param {Command[]} cmdList List of commands to temporarily store.
  */
  receive(cmdList) {
    cmdList.forEach((cmd) => {
      if (cmd.gate.equal(Allocate)) {
        this.allocateQubitIDs.add(cmd.qubits[0][0].id)
      } else if (cmd.gate.equal(Deallocate)) {
        this.deallocateQubitIDs.add(cmd.qubits[0][0].id)
      }
    })
    this.commands = this.commands.concat(cmdList)
  }
}

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

with Dagger(eng):
qb = eng.allocateQubit()
H | qb // qb is still available!!!

The **correct way** of handling qubit (de-)allocation is as follows:

 @example

with Dagger(eng):
qb = eng.allocateQubit()
...
del qb // sends deallocate gate (which becomes an allocate)

 @param {BasicEngine} engine Engine which handles the commands (usually MainEngine)
 @param {function} func
 */
export function Dagger(engine, func) {
  let daggerEngine = null

  const enter = () => {
    daggerEngine = new DaggerEngine()
    insertEngine(engine, daggerEngine)
  }

  const exit = () => {
    daggerEngine.run()
    daggerEngine = null
    dropEngineAfter(engine)
  }

  if (typeof func === 'function') {
    enter()
    try {
      func()
    } catch (e) {
      throw e
    } finally {
      exit()
    }
  }
}
