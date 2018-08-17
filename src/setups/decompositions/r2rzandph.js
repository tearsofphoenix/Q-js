import {Control} from '../../meta/control';
import DecompositionRule from '../../cengines/replacer/decompositionrule';
import {R, Rz, Ph} from '../../ops/gates';

const _decompose_R = (cmd) => {
  const ctrl = cmd.controlQubits
  const eng = cmd.engine
  const gate = cmd.gate

  Control(eng, ctrl, () => {
    new Ph(0.5 * gate.angle).or(cmd.qubits)
    new Rz(gate.angle).or(cmd.qubits)
  })
}

export default [
  new DecompositionRule(R, _decompose_R)
]
