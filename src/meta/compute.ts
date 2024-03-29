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

/* Compute, Uncompute, CustomUncompute.

    Contains Compute, Uncompute, and CustomUncompute classes which can be used to
annotate Compute / Action / Uncompute sections, facilitating the conditioning
of the entire operation on the value of a qubit / register (only Action needs
controls). This file also defines the corresponding meta tags.
*/
import assert from 'assert'
import { BasicEngine } from '../cengines/basics'
import { CommandModifier } from '../cengines/cmdmodifier'
import { ComputeTag, UncomputeTag } from './tag'
import { dropEngineAfter, insertEngine } from './util'
import { Allocate, Deallocate } from '../ops/gates'
import {
  unionSet, setEqual, setIsSuperSet, intersection
} from '../libs/polyfill'
import { QubitManagementError } from './error'
import { ICommand, IEngine } from '@/interfaces';
import _ from 'lodash';

/**
 * @class ComputeEngine
 * @desc Adds Compute-tags to all commands and stores them (to later uncompute them automatically)
 */
export class ComputeEngine extends BasicEngine {
  allocatedQubitIDs: Set<number>;
  deallocatedQubitIDs: Set<number>;
  private _compute: boolean;
  private _l: ICommand[];

  constructor() {
    super();
    this._l = []
    this._compute = true
    // Save all qubit ids from qubits which are created or destroyed.
    this.allocatedQubitIDs = new Set()
    this.deallocatedQubitIDs = new Set()
  }

  /**
    Modify the command tags, inserting an UncomputeTag.
    @param {Command} cmd Command to modify.
     */
  addUnComputeTag(cmd: ICommand) {
    cmd.tags.push(new UncomputeTag())
    return cmd
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
  runUnCompute() {
    // No qubits allocated during Compute section -> do standard uncompute
    if (this.allocatedQubitIDs.size === 0) {
      const cmds = this._l.map((cmd: ICommand) => this.addUnComputeTag(cmd.getInverse())).reverse();
      this.send(cmds)
      return
    }


    // qubits ids which were allocated and deallocated in Compute section
    const ids_local_to_compute = intersection(this.allocatedQubitIDs, this.deallocatedQubitIDs)
    // qubit ids which were allocated but not yet deallocated in
    // Compute section
    // TODO: why need to calculate this???
    // const ids_still_alive = symmetricDifference(this.allocatedQubitIDs, this.deallocatedQubitIDs)

    // No qubits allocated and already deallocated during compute.
    // Don't inspect each command as below -> faster uncompute
    // Just find qubits which have been allocated and deallocate them
    if (ids_local_to_compute.size === 0) {
      _.eachRight(this._l, (cmd: ICommand) => {
        if (cmd.gate.equal(Allocate)) {
          const qubit_id = cmd.qubits[0][0].id
          // Remove this qubit from MainEngine.active_qubits and
          // set qubit.id to = -1 in Qubit object such that it won't
          // send another deallocate when it goes out of scope
          let qubit_found = false
          for (const active_qubit of this.main.activeQubits) {
            if (active_qubit.id === qubit_id) {
              active_qubit.id = -1
              active_qubit.deallocate()
              qubit_found = true
              break
            }
          }

          if (!qubit_found) {
            throw new QubitManagementError('\nQubit was not found in '
              + 'MainEngine.active_qubits.\n')
          }
          this.send([this.addUnComputeTag(cmd.getInverse())])
        } else {
          this.send([this.addUnComputeTag(cmd.getInverse())])
        }
      });
      return
    }

    // There was at least one qubit allocated and deallocated within
    // compute section. Handle uncompute in most general case
    const new_local_id = {}
    _.eachRight(this._l.slice(0), (cmd: ICommand) => {
      if (cmd.gate.equal(Deallocate)) {
        assert(ids_local_to_compute.has(cmd.qubits[0][0].id))
        // Create new local qubit which lives within uncompute section

        // Allocate needs to have old tags + uncompute tag
        const add_uncompute = (command: ICommand, old_tags = cmd.tags.slice(0)) => {
          command.tags = old_tags.concat([new UncomputeTag()])
          return command
        }
        const tagger_eng = new CommandModifier(add_uncompute)
        insertEngine(this, tagger_eng)
        const new_local_qb = this.allocateQubit()
        dropEngineAfter(this)

        new_local_id[cmd.qubits[0][0].id] = new_local_qb[0].id
        // Set id of new_local_qb to -1 such that it doesn't send a
        // deallocate gate
        new_local_qb[0].id = -1
      } else if (cmd.gate.equal(Allocate)) {
        // Deallocate qubit
        if (ids_local_to_compute.has(cmd.qubits[0][0].id)) {
          // Deallocate local qubit and remove id from new_local_id
          const old_id = cmd.qubits[0][0].id
          cmd.qubits[0][0].id = new_local_id[cmd.qubits[0][0].id]
          delete new_local_id[old_id]
          this.send([this.addUnComputeTag(cmd.getInverse())])
        } else {
          // Deallocate qubit which was allocated in compute section:
          const qubit_id = cmd.qubits[0][0].id
          // Remove this qubit from MainEngine.active_qubits and
          // set qubit.id to = -1 in Qubit object such that it won't
          // send another deallocate when it goes out of scope
          let qubit_found = false
          for (const active_qubit of this.main.activeQubits) {
            if (active_qubit.id === qubit_id) {
              active_qubit.id = -1
              active_qubit.deallocate()
              qubit_found = true
              break
            }
          }
          if (!qubit_found) {
            throw new QubitManagementError(
              '\nQubit was not found in '
              + 'MainEngine.active_qubits.\n'
            )
          }
          this.send([this.addUnComputeTag(cmd.getInverse())])
        }
      } else {
        // Process commands by replacing each local qubit from
        // compute section with new local qubit from the uncompute
        // section
        if (Object.keys(new_local_id).length > 0) { // Only if we still have local qubits
          cmd.allQubits.forEach((qureg) => {
            qureg.forEach((qubit) => {
              if (new_local_id[qubit.id]) {
                qubit.id = new_local_id[qubit.id]
              }
            })
          })
        }
        this.send([this.addUnComputeTag(cmd.getInverse())])
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
  endCompute() {
    this._compute = false
    if (!setIsSuperSet(this.allocatedQubitIDs, this.deallocatedQubitIDs)) {
      throw new QubitManagementError(
        '\nQubit has been deallocated in with Compute(eng) context \n'
        + 'which has not been allocated within this Compute section'
      )
    }
  }

  /**
  If in compute-mode: Receive commands and store deepcopy of each cmd.
    Add ComputeTag to received cmd and send it on.
    Otherwise: send all received commands directly to next_engine.

    @param commandList List of commands to receive.
   */
  receive(commandList: ICommand[]) {
    if (this._compute) {
      commandList.forEach((cmd) => {
        if (cmd.gate.equal(Allocate)) {
          this.allocatedQubitIDs.add(cmd.qubits[0][0].id)
        } else if (cmd.gate.equal(Deallocate)) {
          this.deallocatedQubitIDs.add(cmd.qubits[0][0].id)
        }
        this._l.push(cmd.copy())
        cmd.tags.push(new ComputeTag())
      })
    }
    this.send(commandList)
  }
}

export class UncomputeEngine extends BasicEngine {
  allocatedQubitIDs: Set<number>;
  deallocatedQubitIDs: Set<number>;

  constructor() {
    super()
    // Save all qubit ids from qubits which are created or destroyed.
    this.allocatedQubitIDs = new Set()
    this.deallocatedQubitIDs = new Set()
  }

  /**
  Receive commands and add an UncomputeTag to their tags.

    @param commandList List of commands to handle.
   */
  receive(commandList: ICommand[]) {
    commandList.forEach((cmd) => {
      if (cmd.gate.equal(Allocate)) {
        this.allocatedQubitIDs.add(cmd.qubits[0][0].id)
      } else if (cmd.gate.equal(Deallocate)) {
        this.deallocatedQubitIDs.add(cmd.qubits[0][0].id)
      }
      cmd.tags.push(new UncomputeTag())
      this.send([cmd])
    })
  }
}

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
export function Compute(engine: IEngine, func: Function) {
  let computeEngine: ComputeEngine;
  const enter = () => {
    computeEngine = new ComputeEngine()
    insertEngine(engine, computeEngine)
  }

  const exit = () => {
    computeEngine.endCompute();
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
export function CustomUncompute(engine: IEngine, func: Function) {
  let allocatedQubitIDs = new Set()
  let deallocatedQubitIDs = new Set()
  let uncomputeEngine: UncomputeEngine;

  const enter = () => {
    // first, remove the compute engine
    const compute_eng = engine.next
    if (!(compute_eng instanceof ComputeEngine)) {
      throw new QubitManagementError('Invalid call to CustomUncompute: No corresponding "Compute" statement found.')
    }
    // Make copy so there is not reference to compute_eng anymore
    // after __enter__
    allocatedQubitIDs = new Set(compute_eng.allocatedQubitIDs)
    deallocatedQubitIDs = new Set(compute_eng.deallocatedQubitIDs)
    dropEngineAfter(engine)
    // Now add uncompute engine
    uncomputeEngine = new UncomputeEngine()
    insertEngine(engine, uncomputeEngine)
  }

  const exit = () => {
    // If an error happens in this context, qubits might not have been
    // deallocated because that code section was not yet executed,
    // so don't check and raise an additional error.

    // Check that all qubits allocated within Compute or within
    // CustomUncompute have been deallocated.
    const all_allocated_qubits = unionSet(allocatedQubitIDs, uncomputeEngine.allocatedQubitIDs)
    const all_deallocated_qubits = unionSet(deallocatedQubitIDs, uncomputeEngine.deallocatedQubitIDs)
    if (!setEqual(all_allocated_qubits, all_deallocated_qubits)) {
      throw new QubitManagementError('\nError. Not all qubits have been deallocated which have \n'
        + 'been allocated in the Compute(eng) or with '
        + 'CustomUncompute(eng) context.')
    }
    // remove uncompute engine
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

/**
Uncompute automatically.

    @example
 Compute(eng, () => {
  do_something(qubits)
})
  action(qubits)
  Uncompute(eng) // runs inverse of the compute section
 */
export function Uncompute(engine: IEngine) {
  const compute_eng = engine.next
  if (!(compute_eng instanceof ComputeEngine)) {
    throw new Error('Invalid call to Uncompute: No corresponding "Compute" statement found.')
  }
  compute_eng.runUnCompute()
  dropEngineAfter(engine)

  if (engine.autoDeallocateQubits) {
    engine.autoDeallocateQubits()
  }
}
