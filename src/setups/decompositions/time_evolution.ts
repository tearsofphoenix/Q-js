
/*
Registers decomposition for the TimeEvolution gates.

    An exact straight forward decomposition of a TimeEvolution gate is possible
if the hamiltonian has only one term or if all the terms commute with each
  other in which case one can implement each term individually.
*/

import assert from 'assert'
import QubitOperator, { stringToArray } from '@/ops/qubitoperator';
import { len, setEqual, setFromRange } from '@/libs/polyfill';
import { Compute, Control, Uncompute } from '@/meta';
import TimeEvolution from '@/ops/timeevolution';
import { tuple } from '@/libs/util';
import DecompositionRule from '@/cengines/replacer/decompositionrule';
import { CNOT, Rx, Ry, Rz, H } from '@/ops';
import { ICommand } from '@/interfaces';

// Recognize all TimeEvolution gates with >1 terms but which all commute.
function _recognize_time_evolution_commuting_terms(cmd: ICommand) {
  const { hamiltonian } = cmd.gate
  if (len(hamiltonian.terms) === 1) {
    return false
  } else {
    const id_op = new QubitOperator([], 0.0)
    const keys = Object.keys(hamiltonian.terms)
    for (let i = 0; i < keys.length; ++i) {
      const k = keys[i]
      const term = stringToArray(k)
      const coefficient = hamiltonian.terms[k]
      const test_op = new QubitOperator(term, coefficient)
      for (let j = 0; j < keys.length; ++j) {
        const other = keys[j]
        const other_op = new QubitOperator(stringToArray(other), hamiltonian.terms[other])
        const commutator = test_op.mul(other_op).sub(other_op.mul(test_op))
        if (!commutator.isClose(id_op, 1e-9, 1e-9)) {
          return false
        }
      }
    }
  }
  return true
}

function _decompose_time_evolution_commuting_terms(cmd: ICommand) {
  const qureg = cmd.qubits
  const eng = cmd.engine
  const { hamiltonian, time } = cmd.gate
  Control(eng, cmd.controlQubits, () => {
    Object.keys(hamiltonian.terms).forEach((key) => {
      const coefficient = hamiltonian.terms[key]
      const term = stringToArray(key)
      const ind_operator = new QubitOperator(term, coefficient)
      new TimeEvolution(time, ind_operator).or(qureg)
    })
  })
}

function _recognize_time_evolution_individual_terms(cmd: ICommand) {
  return len(cmd.gate.hamiltonian.terms) === 1
}

/**
Implements a TimeEvolution gate with a hamiltonian having only one term.

    To implement exp(-i * t * hamiltonian), where the hamiltonian is only one
term, e.g., hamiltonian = X0 x Y1 X Z2, we first perform local
transformations to in order that all Pauli operators in the hamiltonian
are Z. We then implement  exp(-i * t * (Z1 x Z2 x Z3) and transform the
basis back to the original. For more details see, e.g.,

    James D. Whitfield, Jacob Biamonte & Aspuru-Guzik
Simulation of electronic structure Hamiltonians using quantum computers,
    Molecular Physics, 109:5, 735-750 (2011).

    or

Nielsen and Chuang, Quantum Computation and Information.
 */
function _decompose_time_evolution_individual_terms(cmd: ICommand) {
  assert(len(cmd.qubits) === 1)
  const qureg = cmd.qubits[0]
  const eng = cmd.engine
  const { time, hamiltonian } = cmd.gate
  assert(len(hamiltonian.terms) === 1)
  let term = Object.keys(hamiltonian.terms)[0]
  term = stringToArray(term)
  const coefficient = hamiltonian.terms[term]
  const check_indices = new Set()

  // Check that hamiltonian is not identity term,
  // Previous __or__ operator should have apply a global phase instead:
  assert(term.length !== 0)

  // hamiltonian has only a single local operator
  if (len(term) === 1) {
    Control(eng, cmd.controlQubits, () => {
      const [idx, action] = term[0]
      if (action === 'X') {
        new Rx(time * coefficient * 2.0).or(qureg[idx])
      } else if (action === 'Y') {
        new Ry(time * coefficient * 2.0).or(qureg[idx])
      } else {
        new Rz(time * coefficient * 2.0).or(qureg[idx])
      }
    })

    // hamiltonian has more than one local operator
  } else {
    Control(eng, cmd.controlQubits, () => {
      Compute(eng, () => {
        // Apply local basis rotations
        term.forEach(([index, action]) => {
          check_indices.add(index)
          if (action === 'X') {
            H.or(qureg[index])
          } else if (action === 'Y') {
            new Rx(Math.PI / 2.0).or(qureg[index])
          }
        })

        // Check that qureg had exactly as many qubits as indices:
        assert(setEqual(check_indices, setFromRange(qureg.length)))
        // Compute parity
        for (let i = 0; i < qureg.length - 1; ++i) {
          CNOT.or(tuple(qureg[i], qureg[i + 1]))
        }
      })

      new Rz(time * coefficient * 2.0).or(qureg[qureg.length - 1])
      // Uncompute parity and basis change
      Uncompute(eng)
    })
  }
}

export const rule_commuting_terms = new DecompositionRule(
  TimeEvolution,
  _decompose_time_evolution_commuting_terms,
  _recognize_time_evolution_commuting_terms
)

export const rule_individual_terms = new DecompositionRule(
  TimeEvolution,
  _decompose_time_evolution_individual_terms,
  _recognize_time_evolution_individual_terms
)

export default [rule_commuting_terms, rule_individual_terms]
