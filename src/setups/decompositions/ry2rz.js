import {Control} from '../../meta/control'
import {Compute, Uncompute} from '../../meta/compute';
import {Rx, Ry, Rz} from '../../ops/gates';
import DecompositionRule from '../../cengines/replacer/decompositionrule';

/**
 * @ignore
 * @param {Command} cmd
 * @private
 */
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

/**
 * @ignore
 * @param {Command} cmd
 * @return {boolean}
 * @private
 */
export const _recognize_RyNoCtrl = cmd => cmd.controlCount === 0

export default [
  new DecompositionRule(Ry, _decompose_ry, _recognize_RyNoCtrl)
]
