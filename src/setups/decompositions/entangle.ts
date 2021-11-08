
// Decompose the entangle gate.
import { Control } from '@/meta/control';
import { All } from '@/ops/metagates';
import {
  X, H, EntangleGate
} from '@/ops/gates';
import { DecompositionRule } from '@/cengines/replacer/decompositionrule';
import { ICommand } from '@/interfaces';

const _decompose_entangle = (cmd: ICommand) => {
  const qr = cmd.qubits[0]
  const eng = cmd.engine

  Control(eng, cmd.controlQubits, () => {
    H.or(qr[0])
    Control(eng, qr[0], () => new All(X).or(qr.slice(1)))
  })
}

export default [
  new DecompositionRule(EntangleGate, _decompose_entangle)
]
