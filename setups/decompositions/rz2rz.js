import {Control, getControlCount} from '../../meta/control';
import {Compute, Uncompute} from '../../meta/compute';
import {H, Rx, Rz} from '../../ops/gates';
import DecompositionRule from '../../cengines/replacer/decompositionrule';

const _decompose_rx = (cmd) => {
  const qubit = cmd.qubits[0]
  const eng = cmd.engine
  const angle = cmd.gate.angle

  Control(eng, cmd.controlQubits, () => {
    Compute(eng, () => {
      H.or(qubit)
    })
    new Rz(angle).or(qubit)
    Uncompute(eng)
  })
}

const _recognize_RxNoCtrl = cmd => getControlCount(cmd) === 0

export default [
  new DecompositionRule(Rx, _decompose_rx, _recognize_RxNoCtrl)
]
