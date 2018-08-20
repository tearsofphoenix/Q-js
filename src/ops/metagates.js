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
* Contains meta gates, i.e.,
* DaggeredGate (Represents the inverse of an arbitrary gate)
* ControlledGate (Represents a controlled version of an arbitrary gate)
* Tensor/All (Applies a single qubit gate to all supplied qubits), e.g.,
    @example
@code

Tensor(H) | (qubit1, qubit2) # apply H to qubit #1 and #2

As well as the meta functions
* getInverse (Tries to access the getInverse member function of a gate
and upon failure returns a DaggeredGate)
* C (Creates an n-ary controlled version of an arbitrary gate)
*/
import math from 'mathjs'
import {BasicGate} from './basics'
import {Control} from '../meta/control'
import Cycle, {getInverse} from './_cycle'
import { arrayIsTuple } from '../libs/util'

/*
Wrapper class allowing to execute the inverse of a gate, even when it does
not define one.

    If there is a replacement available, then there is also one for the
    inverse, namely the replacement function run in reverse, while inverting
    all gates. This class enables using this emulation automatically.

    A DaggeredGate is returned automatically when employing the getInverse-
function on a gate which does not provide a getInverse() member function.

@example
    @code

with Dagger(eng):
MySpecialGate | qubits

will create a DaggeredGate if MySpecialGate does not implement
getInverse. If there is a decomposition function available, an auto-
replacer engine can automatically replace the inverted gate by a call to
the decomposition function inside a "with Dagger"-statement.
 */
export class DaggeredGate extends BasicGate {
  /*
    Initialize a DaggeredGate representing the inverse of the gate 'gate'.

    @param
gate: Any gate object of which to represent the inverse.
     */
  constructor(gate) {
    super()
    this.gate = gate
    try {
      this._matrix = math.ctranspose(gate.matrix)
    } catch (e) {

    }
  }

  getInverse() {
    return this.gate
  }

  get matrix() {
    if (!this._matrix) {
      throw new Error('No this attribute')
    }
    return this._matrix
  }


  /*
  Return true if self is equal to other, i.e., same type and
  representing the inverse of the same gate.
   */
  equal(other) {
    return other instanceof DaggeredGate && other.gate.equal(this.gate)
  }

  toString() {
    return `${this.gate.toString()}^\\dagger`
  }

  texString() {
    if (this.gate.texString) {
      return `$${this.gate.texString()}^\\dagger$`
    } else {
      return `$${this.gate.toString()}^\\dagger$`
    }
  }
}

Cycle.add('DaggeredGate', DaggeredGate)

/*

Controlled version of a gate.

    Note:
Use the meta function :func:`C()` to create a controlled gate

A wrapper class which enables (multi-) controlled gates. It overloads
the __or__-operator, using the first qubits provided as control qubits.
    The n control-qubits need to be the first n qubits. They can be in
separate quregs.

    @example
@code

ControlledGate(gate, 2) | (qb0, qb2, qb3) # qb0 & qb2 are controls
C(gate, 2) | (qb0, qb2, qb3) # This is much nicer.
C(gate, 2) | ([qb0,qb2], qb3) # Is equivalent

Note:
    Use :func:`C` rather than ControlledGate, i.e.,

@code

C(X, 2) == Toffoli
 */
export class ControlledGate extends BasicGate {
  /*
    Initialize a ControlledGate object.

    @param
gate: Gate to wrap.
n (int): Number of control qubits.
     */
  constructor(gate, n = 1) {
    super()
    if (gate instanceof ControlledGate) {
      this.gate = gate.gate
      this.n = gate.n + n
    } else {
      this.gate = gate
      this.n = n
    }
  }

  getInverse() {
    return new ControlledGate(getInverse(this.gate), this.n)
  }

  /*
    Apply the controlled gate to qubits, using the first n qubits as
controls.

    Note: The control qubits can be split across the first quregs.
    However, the n-th control qubit needs to be the last qubit in a
qureg. The following quregs belong to the gate.

    @param
qubits (tuple of lists of Qubit objects): qubits to which to apply
the gate.
     */
  or(qubits) {
    qubits = BasicGate.makeTupleOfQureg(qubits)
    let ctrl = []
    const gateQuregs = []
    let addingToControls = true
    qubits.forEach((reg) => {
      if (addingToControls) {
        ctrl = ctrl.concat(reg)
        addingToControls = ctrl.length < this.n
      } else {
        gateQuregs.push(reg)
      }
    })

    // # Test that there were enough control quregs and that that
    // # the last control qubit was the last qubit in a qureg.
    if (ctrl.length !== this.n) {
      throw new Error('Wrong number of control qubits. '
            + 'First qureg(s) need to contain exactly '
            + 'the required number of control quregs.')
    }

    Control(gateQuregs[0][0].engine, ctrl, () => this.gate.or(gateQuregs))
  }

  toString() {
    let prefix = ''
    for (let i = 0; i < this.n; ++i) {
      prefix += 'C'
    }
    return `${prefix}${this.gate.toString()}`
  }

  equal(other) {
    if (other instanceof this.__proto__.constructor) {
      return this.gate.equal(other.gate) && this.n === other.n
    }
    return false
  }
}

/*
Return n-controlled version of the provided gate.

    @param
gate: Gate to turn into its controlled version
n: Number of controls (default: 1)

@example
    @code

C(NOT) | (c, q) # equivalent to CNOT | (c, q)
 */
export function C(gate, n = 1) {
  return new ControlledGate(gate, n)
}

/*
Wrapper class allowing to apply a (single-qubit) gate to every qubit in a
quantum register. Allowed syntax is to supply either a qureg or a tuple
which contains only one qureg.

    @example
@code

Tensor(H) | x # applies H to every qubit in the list of qubits x
Tensor(H) | (x,) # alternative to be consistent with other syntax
 */
export class Tensor extends BasicGate {
  constructor(gate) {
    super()
    this.gate = gate
  }

  getInverse() {
    return new Tensor(getInverse(this.gate))
  }

  or(qubits) {
    const isTuple = arrayIsTuple(qubits)
    let array = null
    if (isTuple) {
      if (qubits.length !== 1) {
        throw new Error('wrong length')
      }
      array = qubits[0]
    } else {
      array = qubits
    }
    if (!Array.isArray(array)) {
      throw new Error('should be array type!')
    }
    array.forEach(q => this.gate.or(q))
  }

  toString() {
    return `Tensor(${this.gate.toString()})`
  }
}

export const All = Tensor