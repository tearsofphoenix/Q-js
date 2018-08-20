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

/*
Contains the tools to make an entire section of operations controlled.

    @example
@code

with Control(eng, qubit1):
H | qubit2
X | qubit3
*/

// Adds control qubits to all commands that have no compute / uncompute tags.
import {ClassicalInstructionGate} from '../ops/basics'
import {BasicQubit} from '../types/qubit'
import {BasicEngine} from '../cengines/basics'
import {dropEngineAfter, insertEngine} from './util'
import {UncomputeTag, ComputeTag} from './tag'
import {instanceOf} from '../libs/util'

export class ControlEngine extends BasicEngine {
  /*
    Initialize the control engine.

    @param
qubits (list of Qubit objects): qubits conditional on which the
following operations are executed.
     */
  constructor(qubits) {
    super()
    this.qubits = qubits
  }

  /*
    Return true if command cmd has a compute/uncompute tag.

    @param
cmd (Command object): a command object.
     */
  hasComputeUnComputeTag(cmd) {
    const tagClass = [UncomputeTag, ComputeTag]
    return cmd.tags.some(looper => instanceOf(looper, tagClass))
  }

  handleCommand(cmd) {
    if (!this.hasComputeUnComputeTag(cmd) && !(cmd.gate instanceof ClassicalInstructionGate)) {
      cmd.addControlQubits(this.qubits)
    }
    this.send([cmd])
  }

  receive(commandList) {
    commandList.forEach(cmd => this.handleCommand(cmd))
  }
}

/*
Condition an entire code block on the value of qubits being 1.

@example
    @code

with Control(eng, ctrlqubits):
do_something(otherqubits)
 */
export function Control(engine, qubits, func) {
  /*
    Enter a controlled section.

    @param
engine: Engine which handles the commands (usually MainEngine)
qubits (list of Qubit objects): Qubits to condition on

Enter the section using a with-statement:

@code

with Control(eng, ctrlqubits):
...
     */

  if (qubits instanceof BasicQubit) {
    qubits = [qubits]
  }
  const qs = qubits

  const enter = () => {
    if (qs.length > 0) {
      const ce = new ControlEngine(qs)
      insertEngine(engine, ce)
    }
  }

  const exit = () => {
    if (qs.length > 0) {
      dropEngineAfter(engine)
    }
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

export function getControlCount(cmd) {
  return cmd.controlQubits.length
}