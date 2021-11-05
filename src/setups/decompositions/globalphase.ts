
// Throw out global phases (no controls).
;
import DecompositionRule from '../../cengines/replacer/decompositionrule';
import { Ph } from '../../ops/gates';
import { ICommand } from '@/interfaces';

const _decompose_PhNoCtrl = (cmd: ICommand) => { };

// Recognize global phases (no controls).
const _recognize_PhNoCtrl = (cmd: ICommand) => cmd.controlCount === 0

export default [
  new DecompositionRule(Ph, _decompose_PhNoCtrl, _recognize_PhNoCtrl)
]
