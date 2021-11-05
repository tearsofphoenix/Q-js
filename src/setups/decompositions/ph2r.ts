import { Control } from '../../meta/control'
import { Ph, R } from '../../ops/gates';
import DecompositionRule from '../../cengines/replacer/decompositionrule';
import { ICommand } from '@/interfaces';

// Decompose the controlled phase gate (C^nPh(phase)).
const _decompose_Ph = (cmd: ICommand) => {
  const ctrl = cmd.controlQubits
  const gate = cmd.gate
  const eng = cmd.engine

  Control(eng, ctrl.slice(1), () => new R(gate.angle).or(ctrl[0]))
}

// Recognize the controlled phase gate.
const _recognize_Ph = (cmd: ICommand) => cmd.controlCount >= 1

export default [
  new DecompositionRule(Ph, _decompose_Ph, _recognize_Ph)
]
