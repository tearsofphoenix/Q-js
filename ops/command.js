/*
This file defines the apply_command function and the Command class.

When a gate is applied to qubits, e.g.,

.. code-block:: python

CNOT | (qubit1, qubit2)

a Command object is generated which represents both the gate, qubits and
control qubits. This Command object then gets sent down the compilation
pipeline.

    In detail, the Gate object overloads the operator| (magic method __or__)
to generate a Command object which stores the qubits in a canonical order
using interchangeable qubit indices defined by the gate to allow the
optimizer to cancel the following two gates

    .. code-block:: python
Swap | (qubit1, qubit2)
Swap | (qubit2, qubit1)

The command then gets sent to the MainEngine via the
apply wrapper (apply_command).
*/
import {arrayEqual} from '../utils/polyfill'
import {getInverse} from './_cycle'
import {Qureg} from '../types/qubit';
import {markTuple} from "../libs/util";

/*
Apply a command.

    Extracts the qubits-owning (target) engine from the Command object
and sends the Command to it.

    Args:
cmd (Command): Command to apply

 */

export function applyCommand(cmd) {
  cmd.engine.receive([cmd])
}

/*
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
export class Command {
  /*

Initialize a Command object.

    Note:
control qubits (Command.control_qubits) are stored as a
list of qubits, and command tags (Command.tags) as a list of tag-
objects. All functions within this class also work if
    WeakQubitRefs are supplied instead of normal Qubit objects
(see WeakQubitRef).

Args:
    engine (projectq.cengines.BasicEngine):
engine which created the qubit (mostly the MainEngine)
gate (projectq.ops.Gate):
Gate to be executed
qubits (tuple[Qureg]):
Tuple of quantum registers (to which the gate is applied)
controls (Qureg|list[Qubit]):
Qubits that condition the command.
tags (list[object]):
Tags associated with the command.

     */
  constructor(engine, gate, qubits, controls = [], tags = []) {
    const qs = qubits
    this.gate = gate
    this.tags = tags
    this.qubits = qs
    this.controlQubits = controls
    this.engine = engine
  }

  get qubits() {
    return this._qubits
  }

  set qubits(nq) {
    this._qubits = this.orderQubits(nq)
  }

  copy() {
    return new Command(this.engine, this.gate.copy(), this.qubits, this.controlQubits, this.tags.slice(0))
  }

  /*
    Get the command object corresponding to the inverse of this command.

    Inverts the gate (if possible) and creates a new command object from
the result.

    Raises:
NotInvertible: If the gate does not provide an inverse (see
BasicGate.get_inverse)
     */
  getInverse() {
    return new Command(this.engine, getInverse(this.gate), this.qubits, this.controlQubits, this.tags.slice(0))
  }

  /*
    Merge this command with another one and return the merged command
object.

    Args:
other: Other command to merge with this one (self)

Raises:
    NotMergeable: if the gates don't supply a get_merged()-function
or can't be merged for other reasons.
     */
  getMerged(other) {
    if (arrayEqual(this.tags, other.tags) && arrayEqual(this.allQubits, other.allQubits) && this.engine === other.engine) {
      return new Command(this.engine, this.gate.getMerged(other.gate), this.qubits, this.controlQubits, this.tags.slice(0))
    }

    throw new Error('Command not mergeable')
  }

  /*
    Order the given qubits according to their IDs (for unique comparison of
commands).

Args:
    qubits: Tuple of quantum registers (i.e., tuple of lists of qubits)

Returns: Ordered tuple of quantum registers
     */
  orderQubits(qubits) {
    const orderedQubits = qubits.slice(0)
    const iqi = this.interchangeableQubitIndices
    iqi.forEach((old_positions) => {
      const new_positions = old_positions.slice(0).sort((a, b) => orderedQubits[a][0].id - orderedQubits[b][0].id)
      const qubits_new_order = []
      new_positions.forEach(l => qubits_new_order.push(orderedQubits[l]))

      old_positions.forEach((v, i) => {
        orderedQubits[v] = qubits_new_order[i]
      })
    })

    markTuple(orderedQubits)
    return orderedQubits
  }

  /*
    Return nested list of qubit indices which are interchangeable.

    Certain qubits can be interchanged (e.g., the qubit order for a Swap
gate). To ensure that only those are sorted when determining the
ordering (see _order_qubits), self.interchangeable_qubit_indices is
used.
    Example:
If we can interchange qubits 0,1 and qubits 3,4,5,
    then this function returns [[0,1],[3,4,5]]
     */
  get interchangeableQubitIndices() {
    return this.gate.interchangeableQubitIndices
  }

  get controlQubits() {
    return this._controlQubits
  }

  /*
    Set control_qubits to qubits

Args:
    control_qubits (Qureg): quantum register
     */
  set controlQubits(nq) {
    this._controlQubits = nq.sort((a, b) => a.id - b.id).slice(0)
  }

  /*

Add (additional) control qubits to this command object.

    They are sorted to ensure a canonical order. Also Qubit objects
are converted to WeakQubitRef objects to allow garbage collection and
thus early deallocation of qubits.

    Args:
qubits (list of Qubit objects): List of qubits which control this
gate, i.e., the gate is only executed if all qubits are
in state 1.
     */
  addControlQubits(qubits) {
    this._controlQubits = this._controlQubits.concat(qubits)
    this._controlQubits.sort((a, b) => a.id - b.id)
  }

  /*

Get all qubits (gate and control qubits).

Returns a tuple T where T[0] is a quantum register (a list of
WeakQubitRef objects) containing the control qubits and T[1:] contains
the quantum registers to which the gate is applied.
     */
  get allQubits() {
    return [this._controlQubits].concat(this.qubits)
  }

  get engine() {
    return this._engine
  }

  /*

Set / Change engine of all qubits to engine.

    Args:
engine: New owner of qubits and owner of this Command object
     */
  set engine(ng) {
    this._engine = ng
    this.qubits.forEach((qureg) => {
      qureg.forEach((qubit) => {
        qubit.engine = ng
      })
    })
    this._controlQubits.forEach(qubit => qubit.engine = ng)
  }

  equal(other) {
    if (other instanceof Command) {
      const f1 = this.gate.equal(other.gate)
      const t1 = arrayEqual(this.tags, other.tags)
      const e1 = this.engine === other.engine
      const b = arrayEqual(this.allQubits, other.allQubits)
      return f1 && t1 && e1 && b
    }
    return false
  }

  toString() {
    let {qubits} = this
    const ctrlqubits = this.controlQubits

    if (ctrlqubits.length > 0) {
      qubits = [ctrlqubits].concat(qubits)
    }
    let qs = ''
    if (qubits.length === 1) {
      qs = new Qureg(qubits[0]).toString()
    } else {
      qs = '( '
      qubits.forEach((qreg) => {
        qs += new Qureg(qreg).toString()
        qs += ', '
      })
      qs = `${qs.substring(0, qs.length - 2)} )`
    }
    let cs = ''
    for (let i = 0; i < ctrlqubits.length; ++i) {
      cs += 'C'
    }
    return `${cs}${this.gate.toString()} | ${qs}`
  }
}
