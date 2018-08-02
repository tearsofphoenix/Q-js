import {BasicGate} from '../../ops/basics'
import { isKindclassOf } from '../../libs/util'

// A rule for breaking down specific gates into sequences of simpler gates.
export default class DecompositionRule {
  /*
    Args:
    gate_class (type): The type of gate that this rule decomposes.

    The gate class is redundant information used to make lookups
faster when iterating over a circuit and deciding "which rules
apply to this gate?" again and again.

    Note that this parameter is a gate type, not a gate instance.
    You supply gate_class=MyGate or gate_class=MyGate().__class__,
    not gate_class=MyGate().

gate_decomposer (function[projectq.ops.Command]): Function which,
    given the command to decompose, applies a sequence of gates
corresponding to the high-level function of a gate of type
gate_class.

gate_recognizer (function[projectq.ops.Command] : boolean): A
predicate that determines if the decomposition applies to the
given command (on top of the filtering by gate_class).

For example, a decomposition rule may only to apply rotation
gates that rotate by a specific angle.

    If no gate_recognizer is given, the decomposition applies to
all gates matching the gate_class.
     */
  constructor(gateClass, gateDecomposer, gateRecognizer = () => true) {
    // Check for common gate_class type mistakes.
    if (gateClass instanceof BasicGate) {
      throw new Error('gate_class is a gate instance instead of a type of BasicGate.'
            + '\nDid you pass in someGate instead of someGate.__class__?')
    }

    if (!isKindclassOf(gateClass, BasicGate)) {
      throw new Error('Invalid class type, you should pass a subclass of BasicGate!')
    }

    this.gateClass = gateClass
    this.gateDecomposer = gateDecomposer
    this.gateRecognizer = gateRecognizer
  }
}
