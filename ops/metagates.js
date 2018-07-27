/*
* Contains meta gates, i.e.,
* DaggeredGate (Represents the inverse of an arbitrary gate)
* ControlledGate (Represents a controlled version of an arbitrary gate)
* Tensor/All (Applies a single qubit gate to all supplied qubits), e.g.,
    Example:
.. code-block:: python

Tensor(H) | (qubit1, qubit2) # apply H to qubit #1 and #2

As well as the meta functions
* get_inverse (Tries to access the get_inverse member function of a gate
and upon failure returns a DaggeredGate)
* C (Creates an n-ary controlled version of an arbitrary gate)
*/
import math from 'mathjs'
import {BasicGate} from './basics'
import Cycle from './_cycle'

/*
Wrapper class allowing to execute the inverse of a gate, even when it does
not define one.

    If there is a replacement available, then there is also one for the
    inverse, namely the replacement function run in reverse, while inverting
    all gates. This class enables using this emulation automatically.

    A DaggeredGate is returned automatically when employing the get_inverse-
function on a gate which does not provide a get_inverse() member function.

Example:
    .. code-block:: python

with Dagger(eng):
MySpecialGate | qubits

will create a DaggeredGate if MySpecialGate does not implement
get_inverse. If there is a decomposition function available, an auto-
replacer engine can automatically replace the inverted gate by a call to
the decomposition function inside a "with Dagger"-statement.
 */
export class DaggeredGate extends BasicGate {
  /*
    Initialize a DaggeredGate representing the inverse of the gate 'gate'.

    Args:
gate: Any gate object of which to represent the inverse.
     */
  constructor(gate) {
    super()
    this.gate = gate
    this.matrix = math.ctranspose(gate.matrix)
  }

  getInverse() {
    return this.gate
  }
}

/*
Return the inverse of a gate.

    Tries to call gate.get_inverse and, upon failure, creates a DaggeredGate
instead.

    Args:
gate: Gate of which to get the inverse

Example:
    .. code-block:: python

get_inverse(H) # returns a Hadamard gate (HGate object)
 */
export function getInverse(gate) {
  try {
    return gate.getInverse()
  } catch (e) {
    return new DaggeredGate(gate)
  }
}

Cycle.add('getInverse', getInverse)

/*

Controlled version of a gate.

    Note:
Use the meta function :func:`C()` to create a controlled gate

A wrapper class which enables (multi-) controlled gates. It overloads
the __or__-operator, using the first qubits provided as control qubits.
    The n control-qubits need to be the first n qubits. They can be in
separate quregs.

    Example:
.. code-block:: python

ControlledGate(gate, 2) | (qb0, qb2, qb3) # qb0 & qb2 are controls
C(gate, 2) | (qb0, qb2, qb3) # This is much nicer.
C(gate, 2) | ([qb0,qb2], qb3) # Is equivalent

Note:
    Use :func:`C` rather than ControlledGate, i.e.,

.. code-block:: python

C(X, 2) == Toffoli
 */
export class ControlledGate extends BasicGate {
  /*
    Initialize a ControlledGate object.

    Args:
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

    Args:
qubits (tuple of lists of Qubit objects): qubits to which to apply
the gate.
     */
  or(qubits) {
    qubits = BasicGate.makeTupleOfQureg(qubits)
    const ctrl = []
    const gateQuregs = []
    let addingToControls = true
    qubits.forEach((reg) => {
      if (addingToControls) {
        ctrl.push(reg)
        addingToControls = ctrl.length < this.n
      } else {
        gateQuregs.push(reg)
      }
    })

    // # Test that there were enough control quregs and that that
    // # the last control qubit was the last qubit in a qureg.
    if (ctrl.length != this.n) {
      throw new Error('Wrong number of control qubits. '
            + 'First qureg(s) need to contain exactly '
            + 'the required number of control quregs.')
    }

    // TODO
    // with projectq.meta.Control(gate_quregs[0][0].engine, ctrl):
    // self._gate | tuple(gate_quregs)
  }
}

/*
Return n-controlled version of the provided gate.

    Args:
gate: Gate to turn into its controlled version
n: Number of controls (default: 1)

Example:
    .. code-block:: python

C(NOT) | (c, q) # equivalent to CNOT | (c, q)
 */
export function C(gate, n = 1) {
  return new ControlledGate(gate, n)
}

/*
Wrapper class allowing to apply a (single-qubit) gate to every qubit in a
quantum register. Allowed syntax is to supply either a qureg or a tuple
which contains only one qureg.

    Example:
.. code-block:: python

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
    if (qubits.length === 1) {
      const q = qubits[0]
      if (Array.isArray(q)) {
        q.forEach(looper => this.gate.or(looper))
      } else {
        throw new Error('wrong type')
      }
    } else {
      throw new Error('wrong length')
    }
  }
}

export const All = Tensor
