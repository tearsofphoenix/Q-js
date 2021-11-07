import { Control } from '@/meta/control';
import DecompositionRule from '@/cengines/replacer/decompositionrule';
import { R, Rz, Ph } from '@/ops/gates';
import { ICommand, IMathGate } from '@/interfaces';

const _decompose_R = (cmd: ICommand) => {
  const ctrl = cmd.controlQubits
  const eng = cmd.engine
  const gate = cmd.gate

  Control(eng, ctrl, () => {
    const { angle } = (gate as IMathGate);
    new Ph(0.5 * angle).or(cmd.qubits)
    new Rz(angle).or(cmd.qubits)
  })
}

export default [
  new DecompositionRule(R, _decompose_R)
]
