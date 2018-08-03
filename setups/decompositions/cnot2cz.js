// Decompose CNOT gates
import {Compute, Uncompute} from '../../meta/compute';
import {H, XGate} from '../../ops/gates';
import {tuple} from '../../libs/util';
import {getControlCount} from '../../meta/control'
import {CZ} from '../../ops/shortcuts'
import DecompositionRule from '../../cengines/replacer/decompositionrule';

const _decompose_cnot = (cmd) => {
  const ctrl = cmd.controlQubits
  const eng = cmd.engine
  Compute(eng, () => {
    H.or(cmd.qubits[0])
  })
  CZ.or(tuple(ctrl[0], cmd.qubits[0][0]))
  Uncompute(eng)
}

export const _recognize_cnot = cmd => (getControlCount(cmd) === 1)

export default [
  new DecompositionRule(XGate, _decompose_cnot, _recognize_cnot)
]
