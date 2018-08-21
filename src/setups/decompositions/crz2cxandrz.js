;
import {NOT, Rz} from '../../ops/gates';
import {C} from '../../ops/metagates';
import {tuple} from '../../libs/util';
import DecompositionRule from '../../cengines/replacer/decompositionrule';

const _decompose_CRz = (cmd) => {
  const qubit = cmd.qubits[0]
  const ctrl = cmd.controlQubits
  const gate = cmd.gate
  const n = cmd.controlCount

  new Rz(0.5 * gate.angle).or(qubit)
  C(NOT, n).or(tuple(ctrl, qubit))
  new Rz(-0.5 * gate.angle).or(qubit)
  C(NOT, n).or(tuple(ctrl, qubit))
}

const _recognize_CRz = cmd => cmd.controlCount >= 1

export default [
  new DecompositionRule(Rz, _decompose_CRz, _recognize_CRz)
]
