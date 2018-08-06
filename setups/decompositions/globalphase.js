
// Throw out global phases (no controls).
import {getControlCount} from '../../meta/control';
import DecompositionRule from '../../cengines/replacer/decompositionrule';
import {Ph} from '../../ops/gates';

const _decompose_PhNoCtrl = (cmd) => { };

// Recognize global phases (no controls).
const _recognize_PhNoCtrl = cmd => getControlCount(cmd) === 0

export default [
  new DecompositionRule(Ph, _decompose_PhNoCtrl, _recognize_PhNoCtrl)
]
