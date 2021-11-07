
import { Control } from '@/meta/control'
import { XGate } from '@/ops/gates';
import DecompositionRule from '@/cengines/replacer/decompositionrule';
import { BasicGate } from '@/ops/basics';
import { Compute, Uncompute } from '@/meta/compute';
import { Toffoli } from '@/ops/shortcuts';
import { tuple } from '@/libs/util';
import { ICommand } from '@/interfaces';

/**
* 
 Recognize an arbitrary gate which has n>=2 control qubits, except a Toffoli gate.
*/
export const _recognize_CnU = (cmd: ICommand) => {
  const count = cmd.controlCount
  if (count === 2) {
    if (!(cmd.gate instanceof XGate)) {
      return true
    }
  } else if (count > 2) {
    return true
  }
  return false
}

/**
* 
Decompose a multi-controlled gate U into a single-controlled U.
    It uses (n-1) work qubits and 2 * (n-1) Toffoli gates.
 */
export const _decompose_CnU = (cmd: ICommand) => {
  const eng = cmd.engine
  const ctrl_qureg = cmd.controlQubits
  const { qubits, gate } = cmd
  const n = cmd.controlCount
  const ancilla_qureg = eng.allocateQureg(n - 1)

  Compute(eng, () => {
    Toffoli.or(tuple(ctrl_qureg[0], ctrl_qureg[1], ancilla_qureg[0]))
    for (let ctrl_index = 2; ctrl_index < n; ++ctrl_index) {
      Toffoli.or(tuple(ctrl_qureg[ctrl_index], ancilla_qureg[ctrl_index - 2], ancilla_qureg[ctrl_index - 1]))
    }
  })

  Control(eng, ancilla_qureg[ancilla_qureg.length - 1], () => gate.or(qubits))
  Uncompute(eng)
}

export default [
  new DecompositionRule(BasicGate, _decompose_CnU, _recognize_CnU)
]
