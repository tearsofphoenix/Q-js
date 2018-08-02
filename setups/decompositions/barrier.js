import DecompositionRule from '../../cengines/replacer/decompositionrule'
import {BarrierGate} from '../../ops/gates'

export function _decompose_barrier(cmd) {
  // Throw out all barriers if they are not supported.
}

export function _recognize_barrier(cmd) {
  // Recognize all barriers. "
  return true
}

export default [
  new DecompositionRule(BarrierGate, _decompose_barrier, _recognize_barrier)
]
