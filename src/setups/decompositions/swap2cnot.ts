import { Compute, Uncompute } from '@/meta/compute';
import { CNOT } from '@/ops/shortcuts';
import { tuple } from '@/libs/util';
import { Control } from '@/meta/control';
import { DecompositionRule } from '@/cengines/replacer/decompositionrule';
import { SwapGate } from '@/ops/gates';
import { ICommand } from '@/interfaces';

const _decompose_swap = (cmd: ICommand) => {
  const ctrl = cmd.controlQubits
  const eng = cmd.engine
  Compute(eng, () => {
    CNOT.or(tuple(cmd.qubits[0], cmd.qubits[1]))
  })
  Control(eng, ctrl, () => {
    CNOT.or(tuple(cmd.qubits[1], cmd.qubits[0]))
  })
  Uncompute(eng)
}

export default [
  new DecompositionRule(SwapGate, _decompose_swap)
]
