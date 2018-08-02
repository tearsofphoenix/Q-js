import {BasicEngine} from '../cengines/basics'
import {setEqual} from '../utils/polyfill';
import {dropEngineAfter, insertEngine} from './util';
import {Allocate, Deallocate} from "../ops/gates";

class LoopTag {
  static loop_tag_id = 0

  constructor(num) {
    this.num = num
    this.id = LoopTag.loop_tag_id
    LoopTag.loop_tag_id += 1
  }

  equal(other) {
    return other instanceof LoopTag && other.id === this.id && this.num === other.num
  }
}

/*
Stores all commands and, when done, executes them num times if no loop tag
handler engine is available.
    If there is one, it adds a loop_tag to the commands and sends them on.
 */
export class LoopEngine extends BasicEngine {
  /*
  Initialize a LoopEngine.

    Args:
num (int): Number of loop iterations.
   */
  constructor(num) {
    super()
    this._tag = new LoopTag(num)
    this._cmdList = []
    this._allocatedQubitIDs = new Set()
    this._deallocatedQubitIDs = new Set()
    // key: qubit id of a local qubit, i.e. a qubit which has been allocated
    //     and deallocated within the loop body.
    // value: list contain reference to each weakref qubit with this qubit
    //        id either within control_qubits or qubits.
    this._refsToLocalQB = {}
    this._nextEnginesSupportLoopTag = false
  }

  /*
  Apply the loop statements to all stored commands.

        Unrolls the loop if LoopTag is not supported by any of the following
    engines, i.e., if

        .. code-block:: python
    is_meta_tag_supported(next_engine, LoopTag) == False
   */
  run() {
    const error_message = ('\n Error. Qubits have been allocated in with '
    + 'Loop(eng, num) context,\n which have not '
    + 'explicitely been deallocated in the Loop context.\n'
    + 'Correct usage:\nwith Loop(eng, 5):\n'
    + '    qubit = eng.allocate_qubit()\n'
    + '    ...\n'
    + '    del qubit[0]\n')

    if (!this._nextEnginesSupportLoopTag) {
      // Unroll the loop
      // Check that local qubits have been deallocated:
      if (!setEqual(this._deallocatedQubitIDs, this._allocatedQubitIDs)) {
        throw new Error(error_message)
      }
      if (this._allocatedQubitIDs.size === 0) {
        // No local qubits, just send the circuit num times
        for (let i = 0; i < this._tag.num; ++i) {
          this.send(this._cmdList.slice(0))
        }
      } else {
        // Ancilla qubits have been allocated in loop body
        // For each iteration, allocate and deallocate a new qubit and
        // replace the qubit id in all commands using it.
        for (let i = 0; i < this._tag.num; ++i) {
          if (i === 0) {
            this.send(this._cmdList.slice(0))
          } else {
            // Change local qubit ids before sending them
            // TODO
            // for refs_loc_qubit in this._refs_to_local_qb.values():
            // new_qb_id = this.main_engine.get_new_qubit_id()
            // for qubit_ref in refs_loc_qubit:
            // qubit_ref.id = new_qb_id
            // this.send(deepcopy(this._cmd_list))
          }
        }
      }
    } else if (!setEqual(this._deallocatedQubitIDs, this._allocatedQubitIDs)) {
      throw new Error(error_message)
    }
  }

  /*
  Receive (and potentially temporarily store) all commands.

    Add LoopTag to all receiving commands and send to the next engine if
    a further engine is a LoopTag-handling engine. Otherwise store all
commands (to later unroll them). Check that within the loop body,
    all allocated qubits have also been deallocated. If loop needs to be
unrolled and ancilla qubits have been allocated within the loop body,
    then store a reference all these qubit ids (to change them when
unrolling the loop)

Args:
    command_list (list<Command>): List of commands to store and later
unroll or, if there is a LoopTag-handling engine, add the
LoopTag.
   */
  receive(commandList) {
    if (this._nextEnginesSupportLoopTag || this.next.isMetaTagSupported(LoopTag)) {
      // Loop tag is supported, send everything with a LoopTag
      // Don't check is_meta_tag_supported anymore
      this._nextEnginesSupportLoopTag = true
      if (this._tag.num === 0) {
        return
      }
      commandList.forEach(cmd => {
        if (cmd.gate.equal(Allocate)) {
          this._allocatedQubitIDs.add(cmd.qubits[0][0].id)
        } else if (cmd.gate.equal(Deallocate)) {
          this._deallocatedQubitIDs.add(cmd.qubits[0][0].id)
        }
        cmd.tags.push(this._tag)
        this.send([cmd])
      })
    } else {
      // LoopTag is not supported, save the full loop body
      this._cmdList = this._cmdList.concat(commandList)
      // Check for all local qubits allocated and deallocated in loop body
      commandList.forEach(cmd => {
        if (cmd.gate.equal(Allocate)) {
          this._allocatedQubitIDs.add(cmd.qubits[0][0].id)
        } else if (cmd.gate.equal(Deallocate)) {
          this._deallocatedQubitIDs.add(cmd.qubits[0][0].id)
        }
        cmd.tags.push(this._tag)
        this.send([cmd])
      })
      //   for cmd in command_list:
      //   if cmd.gate == Allocate:
      //   this._allocated_qubit_ids.add(cmd.qubits[0][0].id)
      //   # Save reference to this local qubit
      //   this._refs_to_local_qb[cmd.qubits[0][0].id] = (
      //       [cmd.qubits[0][0]])
      //   elif cmd.gate == Deallocate:
      //   this._deallocated_qubit_ids.add(cmd.qubits[0][0].id)
      //   # Save reference to this local qubit
      //   this._refs_to_local_qb[cmd.qubits[0][0].id].append(
      //       cmd.qubits[0][0])
      // else:
      //   # Add a reference to each place a local qubit id is
      //   # used as within either control_qubit or qubits
      //   for control_qubit in cmd.control_qubits:
      //   if control_qubit.id in this._allocated_qubit_ids:
      //   this._refs_to_local_qb[control_qubit.id].append(
      //       control_qubit)
      //   for qureg in cmd.qubits:
      //   for qubit in qureg:
      //   if qubit.id in this._allocated_qubit_ids:
      //   this._refs_to_local_qb[qubit.id].append(
      //       qubit)
    }
  }
}


/*
Loop n times over an entire code block.

    Example:
.. code-block:: python

with Loop(eng, 4):
# [quantum gates to be executed 4 times]

Warning:
    If the code in the loop contains allocation of qubits, those qubits
have to be deleted prior to exiting the 'with Loop()' context.

    This code is **NOT VALID**:

.. code-block:: python

with Loop(eng, 4):
qb = eng.allocate_qubit()
H | qb # qb is still available!!!

The **correct way** of handling qubit (de-)allocation is as follows:

.. code-block:: python

with Loop(eng, 4):
qb = eng.allocate_qubit()
...
del qb # sends deallocate gate
 */
export function Loop(engine, num, func) {
  if (typeof num === 'number' && num >= 0) {
    const _num = num
    let _loopEngine
    const enter = () => {
      if (_num !== 1) {
        _loopEngine = new LoopEngine(num)
        insertEngine(engine, _loopEngine)
      }
    }

    const exit = () => {
      if (_num !== 1) {
        _loopEngine.run()
        _loopEngine = null
        dropEngineAfter(engine)
      }
    }

    if (typeof func === 'function') {
      enter()
      func()
      exit()
    }
  } else {
    throw new Error('invalid number of loop iterations')
  }
}
