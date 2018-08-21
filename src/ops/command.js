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
This file defines the apply_command function and the Command class.

When a gate is applied to qubits, e.g.,

@code

CNOT | (qubit1, qubit2)

a Command object is generated which represents both the gate, qubits and
control qubits. This Command object then gets sent down the compilation
pipeline.

    In detail, the Gate object overloads the operator| (magic method __or__)
to generate a Command object which stores the qubits in a canonical order
using interchangeable qubit indices defined by the gate to allow the
optimizer to cancel the following two gates

    @code
Swap | (qubit1, qubit2)
Swap | (qubit2, qubit1)

The command then gets sent to the MainEngine via the
apply wrapper (apply_command).
*/
import assert from 'assert'
import {arrayEqual} from '../libs/polyfill'
import {getInverse} from './_cycle'
import {BasicQubit, Qureg} from '../types/qubit'
import {markTuple} from '../libs/util'
import {NotMergeable} from '../meta/error'

/**
 * @class Command
 * @classdesc
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
export default class Command {
  /**
   * @constructor
    Note:
control qubits (Command.control_qubits) are stored as a
list of qubits, and command tags (Command.tags) as a list of tag-
objects. All functions within this class also work if
    BasicQubits are supplied instead of normal Qubit objects (see BasicQubits).

@param {BasicEngine} engine: engine which created the qubit (mostly the MainEngine)
@param {BasicGate} gate: Gate to be executed
@param {Array<Qureg>} qubits: Array of quantum registers (to which the gate is applied)
@param {Qureg|Array<Qubit>} controls: Qubits that condition the command.
@param {Array<any>} tags: Tags associated with the command.
     */
  constructor(engine, gate, qubits, controls = [], tags = []) {
    const qs = qubits.map(qureg => new Qureg(...qureg.map(looper => new BasicQubit(looper.engine, looper.id))))
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

  /**
   * return the copy of current command
   * @return {Command}
   */
  copy() {
    const qubits = this.qubits.map(looper => BasicQubit.copyArray(looper))
    const controlQubits = BasicQubit.copyArray(this.controlQubits)
    return new Command(this.engine, this.gate.copy(), qubits, controlQubits, this.tags.slice(0))
  }

  /**
    Get the command object corresponding to the inverse of this command.
    Inverts the gate (if possible) and creates a new command object from the result.

    @throws {NotInvertible}: If the gate does not provide an inverse (see BasicGate.getInverse)
     */
  getInverse() {
    return new Command(this.engine, getInverse(this.gate), this.qubits, this.controlQubits, this.tags.slice(0))
  }

  /**
    Merge this command with another one and return the merged command object.
    @param {Command} other: Other command to merge with this one (self)
    @throws NotMergeable if the gates don't supply a get_merged()-function or can't be merged for other reasons.
     */
  getMerged(other) {
    if (arrayEqual(this.tags, other.tags) && arrayEqual(this.allQubits, other.allQubits) && this.engine === other.engine) {
      return new Command(this.engine, this.gate.getMerged(other.gate), this.qubits, this.controlQubits, this.tags.slice(0))
    }

    throw new NotMergeable('Command not mergeable')
  }

  /**
    Order the given qubits according to their IDs (for unique comparison of commands).

    @param {Array<Qubit>} qubits: Array of quantum registers (i.e., tuple of lists of qubits)
    @returns {Array<Qubit>} Ordered tuple of quantum registers
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

  /**
    Return nested list of qubit indices which are interchangeable.

    Certain qubits can be interchanged (e.g., the qubit order for a Swap
gate). To ensure that only those are sorted when determining the
ordering (see _order_qubits), this.interchangeable_qubit_indices is
used.
    @example
If we can interchange qubits 0,1 and qubits 3,4,5,
    then this function returns [[0,1],[3,4,5]]
     */
  get interchangeableQubitIndices() {
    return this.gate.interchangeableQubitIndices
  }

  get controlQubits() {
    return this._controlQubits
  }

  /**
    Set control_qubits to qubits
  @param {Qureg} nq: quantum register
  */
  set controlQubits(nq) {
    this._controlQubits = nq.sort((a, b) => a.id - b.id).map(q => new BasicQubit(q.engine, q.id))
  }

  /**
Add (additional) control qubits to this command object.

    They are sorted to ensure a canonical order. Also Qubit objects
are converted to WeakQubitRef objects to allow garbage collection and
thus early deallocation of qubits.

    @param {Array<Qubit>} qubits: List of qubits which control this
    gate, i.e., the gate is only executed if all qubits are in state 1.
  */
  addControlQubits(qubits) {
    assert(Array.isArray(qubits))
    this._controlQubits = this._controlQubits.concat(BasicQubit.copyArray(qubits))
    this._controlQubits.sort((a, b) => a.id - b.id)
  }

  /**
  Apply a command.

    Extracts the qubits-owning (target) engine from the Command object and sends the Command to it.
   */
  apply() {
    this.engine.receive([this])
  }

  /**
Get all qubits (gate and control qubits).

Returns a tuple T where T[0] is a quantum register (a list of
WeakQubitRef objects) containing the control qubits and T[1:] contains
the quantum registers to which the gate is applied.
  */
  get allQubits() {
    return [this._controlQubits].concat(this.qubits)
  }

  get controlCount() {
    return this.controlQubits.length
  }

  get engine() {
    return this._engine
  }

  /**
    Set / Change engine of all qubits to engine.
    @param {BasicEngine} ng: New owner of qubits and owner of this Command object
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
      try {
        const f1 = this.gate.equal(other.gate)
        const t1 = arrayEqual(this.tags, other.tags)
        const e1 = this.engine === other.engine
        const b = arrayEqual(this.allQubits, other.allQubits)
        return f1 && t1 && e1 && b
      } catch (e) {
        return false
      }
    }
    return false
  }

  /**
   * @return string
   */
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

  /**
   * @return string
   */
  inspect() {
    return this.toString()
  }
}
