// """ Decompose the Toffoli gate into CNOT, H, T, and Tdagger gates. """
import {tuple} from '../../libs/util';
import Gates, {H, NOT, T} from '../../ops/gates';
import {CNOT} from '../../ops/shortcuts';
import DecompositionRule from '../../cengines/replacer/decompositionrule';


const {Tdag} = Gates

const _decompose_toffoli = (cmd) => {
  const ctrl = cmd.controlQubits

  const target = cmd.qubits[0]
  const c1 = ctrl[0]
  const c2 = ctrl[1]

  H.or(target)
  CNOT.or(tuple(c1, target))
  T.or(c1)
  Tdag.or(target)
  CNOT.or(tuple(c2, target))
  CNOT.or(tuple(c2, c1))
  Tdag.or(c1)
  T.or(target)
  CNOT.or(tuple(c2, c1))
  CNOT.or(tuple(c1, target))
  Tdag.or(target)
  CNOT.or(tuple(c2, target))
  T.or(target)
  T.or(c2)
  H.or(target)
}

const _recognize_toffoli = cmd => cmd.controlCount === 2

export default [
  new DecompositionRule(NOT.constructor, _decompose_toffoli, _recognize_toffoli)
]
