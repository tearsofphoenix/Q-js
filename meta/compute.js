/* Compute, Uncompute, CustomUncompute.

    Contains Compute, Uncompute, and CustomUncompute classes which can be used to
annotate Compute / Action / Uncompute sections, facilitating the conditioning
of the entire operation on the value of a qubit / register (only Action needs
controls). This file also defines the corresponding meta tags.
*/
import assert from 'assert'
import {BasicEngine} from '../cengines/basics'
import CommandModifier from '../cengines/cmdmodifier'
import {ComputeTag, UncomputeTag} from './tag'
import {dropEngineAfter, insertEngine} from './util';
import {Allocate, Deallocate} from '../ops/gates';
import {
  unionSet, setEqual, setIsSuperSet, intersection, symmetricDifference
} from '../utils/polyfill'

/*
Adds Compute-tags to all commands and stores them (to later uncompute them
automatically)
 */
export class ComputeEngine extends BasicEngine {
  constructor() {
    super()
    this._l = []
    this._compute = true
    // Save all qubit ids from qubits which are created or destroyed.
    this.allocatedQubitIDs = new Set()
    this.deallocatedQubitIDs = new Set()
  }

  /*
    Modify the command tags, inserting an UncomputeTag.

    Args:
cmd (Command): Command to modify.
     */
  addUnComputeTag(cmd) {
    cmd.tags.push(UncomputeTag)
    return cmd
  }

  /*
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
      const cmds = this._l.reverse().map(cmd => this.addUnComputeTag(cmd.getInverse()))
      this.send(cmds)
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
      this._l.reverse().forEach((cmd) => {
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
            throw new Error('\nQubit was not found in '
                + 'MainEngine.active_qubits.\n')
          }
          this.send([this.addUnComputeTag(cmd.getInverse())])
        } else {
          this.send([this.addUnComputeTag(cmd.getInverse())])
        }
      })
      return
    }

    // There was at least one qubit allocated and deallocated within
    // compute section. Handle uncompute in most general case
    const new_local_id = {}
    this._l.reverse().forEach((cmd) => {
      if (cmd.gate.equal(Deallocate)) {
        assert(ids_local_to_compute.has(cmd.qubits[0][0].id))
        // Create new local qubit which lives within uncompute section

        // Allocate needs to have old tags + uncompute tag
        const add_uncompute = (command, old_tags = cmd.tags.slice(0)) => {
          command.tags = old_tags.push(UncomputeTag)
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
            throw new Error(
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
    })
  }

  /*
End the compute step (exit the with Compute() - statement).

Will tell the Compute-engine to stop caching. It then waits for the
    uncompute instruction, which is when it sends all cached commands
inverted and in reverse order down to the next compiler engine.

    Raises:
QubitManagementError: If qubit has been deallocated in Compute
section which has not been allocated in Compute section
*/
  endCompute() {
    this._compute = false
    if (!setIsSuperSet(this.allocatedQubitIDs, this.deallocatedQubitIDs)) {
      throw new Error(
        '\nQubit has been deallocated in with Compute(eng) context \n'
    + 'which has not been allocated within this Compute section'
      )
    }
  }

  /*
  If in compute-mode: Receive commands and store deepcopy of each cmd.
    Add ComputeTag to received cmd and send it on.
    Otherwise: send all received commands directly to next_engine.

    Args:
command_list (list<Command>): List of commands to receive.
   */
  receive(commandList) {
    if (this._compute) {
      commandList.forEach((cmd) => {
        if (cmd.gate.equal(Allocate)) {
          this.allocatedQubitIDs.add(cmd.qubits[0][0].id)
        } else if (cmd.gate.equal(Deallocate)) {
          this.deallocatedQubitIDs.add(cmd.qubits[0][0].id)
        }
        this._l.push(cmd.copy())
        cmd.tags.push(ComputeTag)
      })
    }
    this.send(commandList)
  }
}

export class UncomputeEngine extends BasicEngine {
  constructor() {
    super()
    // Save all qubit ids from qubits which are created or destroyed.
    this.allocatedQubitIDs = new Set()
    this.deallocatedQubitIDs = new Set()
  }

  /*
  Receive commands and add an UncomputeTag to their tags.

    Args:
command_list (list<Command>): List of commands to handle.
   */
  receive(commandList) {
    commandList.forEach((cmd) => {
      if (cmd.gate.equal(Allocate)) {
        this.allocatedQubitIDs.add(cmd.qubits[0][0].id)
      } else if (cmd.gate.equal(Deallocate)) {
        this.deallocatedQubitIDs.add(cmd.qubits[0][0].id)
      }
      cmd.tags.push(UncomputeTag)
      this.send([cmd])
    })
  }
}

/*
Start a compute-section.

    Example:
.. code-block:: python

with Compute(eng):
do_something(qubits)
action(qubits)
Uncompute(eng) # runs inverse of the compute section

Warning:
    If qubits are allocated within the compute section, they must either be
uncomputed and deallocated within that section or, alternatively,
    uncomputed and deallocated in the following uncompute section.

    This means that the following examples are valid:

    .. code-block:: python

with Compute(eng):
anc = eng.allocate_qubit()
do_something_with_ancilla(anc)
...
uncompute_ancilla(anc)
del anc

do_something_else(qubits)

Uncompute(eng)  # will allocate a new ancilla (with a different id)
# and then deallocate it again

    .. code-block:: python

with Compute(eng):
anc = eng.allocate_qubit()
do_something_with_ancilla(anc)
...

do_something_else(qubits)

Uncompute(eng)  # will deallocate the ancilla!

    After the uncompute section, ancilla qubits allocated within the
compute section will be invalid (and deallocated). The same holds when
using CustomUncompute.

    Failure to comply with these rules results in an exception being
thrown.
 */
export function Compute(engine, func) {
  let computeEngine = null
  const enter = () => {
    computeEngine = new ComputeEngine()
    insertEngine(engine, computeEngine)
  }

  const exit = () => {
    computeEngine.endCompute()
    computeEngine = null
  }

  if (typeof func === 'function') {
    enter()
    func()
    exit()
  }
}

/*
Start a custom uncompute-section.

    Example:
.. code-block:: python

with Compute(eng):
do_something(qubits)
action(qubits)
with CustomUncompute(eng):
do_something_inverse(qubits)

Raises:
    QubitManagementError: If qubits are allocated within Compute or within
CustomUncompute context but are not deallocated.
 */
export function CustomUncompute(engine, func) {
  let allocatedQubitIDs = new Set()
  let deallocatedQubitIDs = new Set()
  let uncomputeEngine = null

  const enter = () => {
    // first, remove the compute engine
    const compute_eng = engine.next
    if (!(compute_eng instanceof ComputeEngine)) {
      throw new Error(
        'Invalid call to CustomUncompute: No corresponding'
        + "'with Compute' statement found."
      )
    }
    // Make copy so there is not reference to compute_eng anymore
    // after __enter__
    allocatedQubitIDs = compute_eng.allocatedQubitIDs.copy()
    deallocatedQubitIDs = compute_eng.deallocatedQubitIDs.copy()
    dropEngineAfter(engine)
    // Now add uncompute engine
    uncomputeEngine = UncomputeEngine()
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
      throw new Error('\nError. Not all qubits have been deallocated which have \n'
               + 'been allocated in the with Compute(eng) or with '
               + 'CustomUncompute(eng) context.')
    }
    // remove uncompute engine
    dropEngineAfter(engine)
  }

  if (typeof func === 'function') {
    enter()
    func()
    exit()
  }
}

/*
Uncompute automatically.

    Example:
.. code-block:: python

with Compute(eng):
do_something(qubits)
action(qubits)
Uncompute(eng) # runs inverse of the compute section
 */
export function Uncompute(engine) {
  const compute_eng = engine.next
  if (!(compute_eng instanceof ComputeEngine)) {
    throw new Error('Invalid call to Uncompute: No '
    + "corresponding 'with Compute' statement "
    + 'found.')
  }
  compute_eng.runUnCompute()
  dropEngineAfter(engine)
}
