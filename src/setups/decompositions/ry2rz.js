import {Control, getControlCount} from '../../meta/control';
import {Compute, Uncompute} from '../../meta/compute';
import {Rx, Ry, Rz} from '../../ops/gates';
import DecompositionRule from '../../cengines/replacer/decompositionrule';

export const _decompose_ry = (cmd) => {
  const qubit = cmd.qubits[0]
  const eng = cmd.engine
  const angle = cmd.gate.angle

  Control(eng, cmd.controlQubits, () => {
    Compute(eng, () => {
      new Rx(Math.PI / 2.0).or(qubit)
    })
    new Rz(angle).or(qubit)
    Uncompute(eng)
  })
}

export const _recognize_RyNoCtrl = cmd => getControlCount(cmd) === 0

export default [
  new DecompositionRule(Ry, _decompose_ry, _recognize_RyNoCtrl)
]