import {BasicGate} from './basics'
import QubitOperator from './qubitoperator'
import {setEqual} from '../utils/polyfill';
import {applyCommand} from './command';
import {makeTuple} from '../libs/util';

/*
Gate for time evolution under a Hamiltonian (QubitOperator object).

This gate is the unitary time evolution propagator:
    exp(-i * H * t),
        where H is the Hamiltonian of the system and t is the time. Note that -i
factor is stored implicitely.

    Example:
.. code-block:: python

wavefunction = eng.allocate_qureg(5)
hamiltonian = 0.5 * QubitOperator("X0 Z1 Y5")
# Apply exp(-i * H * t) to the wavefunction:
    TimeEvolution(time=2.0, hamiltonian=hamiltonian) | wavefunction

Attributes:
    time(float, int): time t
hamiltonian(QubitOperator): hamiltonaian H
 */
export default class TimeEvolution extends BasicGate {
  /*
  Initialize time evolution gate.

    Note:
The hamiltonian must be hermitian and therefore only terms with
    real coefficients are allowed.
    Coefficients are internally converted to float.

    Args:
time (float, or int): time to evolve under (can be negative).
hamiltonian (QubitOperator): hamiltonian to evolve under.

    Raises:
TypeError: If time is not a numeric type and hamiltonian is not a
QubitOperator.
    NotHermitianOperatorError: If the input hamiltonian is not
hermitian (only real coefficients).
   */
  constructor(time, hamiltonian) {
    super()
    if (typeof time !== 'number') {
      throw new Error('time needs to be a (real) numeric type.')
    }

    if (!(hamiltonian instanceof QubitOperator)) {
      throw new Error('hamiltonian needs to be QubitOperator object.')
    }

    this.time = time
    this.hamiltonian = hamiltonian.copy()
    hamiltonian.terms.forEach((term) => {
      const item = this.hamiltonian[term]
      if (item.imag === 0) {
        this.hamiltonian[term] = item.real
      } else {
        throw new Error('hamiltonian must be '
        + 'hermitian and hence only '
        + 'have real coefficients.')
      }
    })
  }

  getInverse() {
    return new TimeEvolution(-this.time, this.hamiltonian)
  }

  /*
  Return self merged with another TimeEvolution gate if possible.

    Two TimeEvolution gates are merged if:
1) both have the same terms
2) the proportionality factor for each of the terms
must have relative error <= 1e-9 compared to the
proportionality factors of the other terms.

    Note:
While one could merge gates for which both hamiltonians commute,
    we are not doing this as in general the resulting gate would have
to be decomposed again.

    Note:
We are not comparing if terms are proportional to each other with
    an absolute tolerance. It is up to the user to remove terms close
to zero because we cannot choose a suitable absolute error which
works for everyone. Use, e.g., a decomposition rule for that.

                                                            Args:
other: TimeEvolution gate

Raises:
    NotMergeable: If the other gate is not a TimeEvolution gate or
hamiltonians are not suitable for merging.

                                      Returns:
New TimeEvolution gate equivalent to the two merged gates.
   */
  getMerged(other) {
    const rel_tol = 1e-9
    if (other instanceof TimeEvolution && setEqual(this.hamiltonian.terms, other.hamiltonian.terms)) {
      let factor
      this.hamiltonian.terms.forEach((term) => {
        if (typeof factor === 'undefined') {
          factor = this.hamiltonian.terms[term] / other.hamiltonian.terms[term]
        } else {
          const tmp = this.hamiltonian.terms[term] / other.hamiltonian.terms[term]
          if (Math.abs(factor - tmp) > rel_tol * Math.max(Math.abs(factor), Math.abs(tmp))) {
            throw new Error('Cannot merge these two gates.')
          }
        }
      })

      const newTime = this.time + other.time / factor
      return new TimeEvolution(newTime, this.hamiltonian)
    } else {
      throw new Error('Cannot merge these two gates.')
    }
  }

  /*
  Operator| overload which enables the following syntax:

    .. code-block:: python

TimeEvolution(...) | qureg
TimeEvolution(...) | (qureg,)
TimeEvolution(...) | qubit
TimeEvolution(...) | (qubit,)

Unlike other gates, this gate is only allowed to be applied to one
quantum register or one qubit.

    Example:

.. code-block:: python

wavefunction = eng.allocate_qureg(5)
hamiltonian = QubitOperator("X1 Y3", 0.5)
TimeEvolution(time=2.0, hamiltonian=hamiltonian) | wavefunction

While in the above example the TimeEvolution gate is applied to 5
qubits, the hamiltonian of this TimeEvolution gate acts only
non-trivially on the two qubits wavefunction[1] and wavefunction[3].
    Therefore, the operator| will rescale the indices in the hamiltonian
and sends the equivalent of the following new gate to the MainEngine:

    .. code-block:: python

h = QubitOperator("X0 Y1", 0.5)
TimeEvolution(2.0, h) | [wavefunction[1], wavefunction[3]]

which is only a two qubit gate.

    Args:
qubits: one Qubit object, one list of Qubit objects, one Qureg
object, or a tuple of the former three cases.
   */
  or(qubits) {
    // Check that input is only one qureg or one qubit
    qubits = this.makeTu(qubits)
    if (qubits.length !== 1) {
      throw new Error('Only one qubit or qureg allowed.')
    }
    // Check that if hamiltonian has only an identity term,
    // apply a global phase:
    if (this.hamiltonian.terms.length === 1 && this.hamiltonian.terms[[]]) {
      new Ph(-this.time * this.hamiltonian.terms[[]]).or(qubits[0][0])
      return
    }
    const num_qubits = qubits[0].length
    let non_trivial_qubits = new Set()

    for (const term of this.hamiltonian.terms) {
      term.forEach((action, index) => {
        non_trivial_qubits.add(index)
      })
    }

    if (Math.max(...non_trivial_qubits) >= num_qubits) {
      throw new Error('hamiltonian acts on more qubits than the gate is applied to.')
    }
    // create new TimeEvolution gate with rescaled qubit indices in
    // this.hamiltonian which are ordered from
    // 0,...,len(non_trivial_qubits) - 1
    const new_index = {}
    non_trivial_qubits = Array.from(non_trivial_qubits).sort()

    non_trivial_qubits.forEach((looper, i) => {
      new_index[looper] = i
    })

    const new_hamiltonian = new QubitOperator()
    assert(new_hamiltonian.terms.length === 0, '')

    this.hamiltonian.terms.forEach((term) => {
      const newTerm = makeTuple(term.map((action, index) => [new_index[index], action]))
      new_hamiltonian.terms[newTerm] = this.hamiltonian.terms[term]
    })

    const new_gate = new TimeEvolution(this.time, new_hamiltonian)
    const new_qubits = non_trivial_qubits.map((looper, i) => qubits[0][i])
    // Apply new gate
    const cmd = new_gate.generateCommand(new_qubits)
    applyCommand(cmd)
  }

  equal(other) {
    throw new Error('Not implemented')
  }

  toString() {
    return `exp((0, ${-this.time}) * (${this.hamiltonian}))`
  }
}
