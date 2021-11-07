import assert from 'assert'
import DecompositionRule from '@/cengines/replacer/decompositionrule'
import { CNOT, SqrtSwapGate, SqrtX } from '@/ops'
import { len } from '@/libs/polyfill'
import { Compute, Control, Uncompute } from '@/meta'
import { tuple } from '@/libs/util'
import { ICommand } from '@/interfaces';
/**
 * Decompose (controlled) swap gates.
 * @private
 */
function _decompose_sqrtswap(cmd: ICommand) {
  assert(len(cmd.qubits) === 2 && len(cmd.qubits[0]) === 1 && len(cmd.qubits[1]) === 1)
  const ctrl = cmd.controlQubits
  const qubit0 = cmd.qubits[0][0]
  const qubit1 = cmd.qubits[1][0]
  const eng = cmd.engine

  Control(eng, ctrl, () => {
    Compute(eng, () => {
      CNOT.or(tuple(qubit0, qubit1))
    })
    Control(eng, qubit1, () => {
      SqrtX.or(qubit0)
    })

    Uncompute(eng)
  })
}

export default [
  new DecompositionRule(SqrtSwapGate, _decompose_sqrtswap)
]
