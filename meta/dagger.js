/*
Tools to easily invert a sequence of gates.

    .. code-block:: python

with Dagger(eng):
H | qubit1
Rz(0.5) | qubit2
*/

import {BasicEngine} from '../cengines/basics'
import {Allocate, Deallocate} from '../ops/gates'
import {insertEngine, dropEngineAfter} from './util'
import {setEqual} from '../utils/polyfill';
import {QubitManagementError} from "./error";

// Stores all commands and, when done, inverts the circuit & runs it.
export class DaggerEngine extends BasicEngine {
  constructor() {
    super()
    this.commands = []
    this.allocateQubitIDs = new Set()
    this.deallocateQubitIDs = new Set()
  }

  /*
    Run the stored circuit in reverse and check that local qubits
have been deallocated.
     */
  run() {
    if (!setEqual(this.deallocateQubitIDs, this.allocateQubitIDs)) {
      throw new QubitManagementError(
        "\n Error. Qubits have been allocated in 'with "
          + "Dagger(eng)' context,\n which have not explicitely "
          + 'been deallocated.\n'
          + 'Correct usage:\n'
          + 'with Dagger(eng):\n'
          + '    qubit = eng.allocate_qubit()\n'
          + '    ...\n'
          + '    del qubit[0]\n'
      )
    }
    this.commands.rforEach((cmd) => {
      this.send(cmd.getInverse())
    })
  }

  /*
    Receive a list of commands and store them for later inversion.

    Args:
command_list (list<Command>): List of commands to temporarily
store.
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

/*
Invert an entire code block.

    Use it with a with-statement, i.e.,

    .. code-block:: python

with Dagger(eng):
[code to invert]

Warning:
    If the code to invert contains allocation of qubits, those qubits have
to be deleted prior to exiting the 'with Dagger()' context.

    This code is **NOT VALID**:

.. code-block:: python

with Dagger(eng):
qb = eng.allocate_qubit()
H | qb # qb is still available!!!

The **correct way** of handling qubit (de-)allocation is as follows:

.. code-block:: python

with Dagger(eng):
qb = eng.allocate_qubit()
...
del qb # sends deallocate gate (which becomes an allocate)

 */
export function Dagger(engine, func) {
  /*
    Enter an inverted section.

    Args:
engine: Engine which handles the commands (usually MainEngine)

Example (executes an inverse QFT):

.. code-block:: python

with Dagger(eng):
QFT | qubits
     */

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
