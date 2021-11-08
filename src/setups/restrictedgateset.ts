import assert from 'assert'
import {
  BasicMathGate, ClassicalInstructionGate, CNOT, ControlledGate, QFT, Swap
} from '../ops';
import { getInverse } from '../ops/_cycle';
import { DecompositionRuleSet } from '../cengines/replacer/decompositionruleset';
import { instanceOf, isKindclassOf } from '../libs/util';
import { len } from '../libs/polyfill';
import { AutoReplacer, InstructionFilter } from '../cengines';
import { TagRemover } from '../cengines/tagremover'
import { LocalOptimizer } from '../cengines/optimize'
import math from '../libs/math/defaultrules'
import decompositions from './decompositions'
import { IEngine, ICommand, IGate, GateClass, IQubit } from '@/interfaces';
import { SpecialGate } from './constants';

function high_level_gates(eng: IEngine, cmd: ICommand) {
  const g = cmd.gate
  if (eng.next.isAvailable(cmd)) {
    return true
  }
  if (QFT.equal(g) || QFT.equal(getInverse(g)) || Swap.equal(g)) {
    return true
  }
  if (g instanceof BasicMathGate) {
    return false
  }
  return true
}

function one_and_two_qubit_gates(eng: IEngine, cmd: ICommand) {
  const all_qubits = []
  cmd.allQubits.forEach(qr => qr.forEach(q => all_qubits.push(q)))

  if (cmd.gate instanceof ClassicalInstructionGate) {
    // This is required to allow Measure, Allocate, Deallocate, Flush
    return true
  } else if (eng.next.isAvailable(cmd)) {
    return true
  } else if (all_qubits.length <= 2) {
    return true
  } else {
    return false
  }
}

/**
Returns an engine list to compile to a restricted gate set.

    Note:
If you choose a new gate set for which the compiler does not yet have
standard rules, it raises an `NoGateDecompositionError` or a
    `RuntimeError: maximum recursion depth exceeded...`. Also note that
even the gate sets which work might not yet be optimized. So make sure
to double check and potentially extend the decomposition rules.
    This implemention currently requires that the one qubit gates must
contain Rz and at least one of {Ry(best), Rx, H} and the two qubit gate
must contain CNOT (recommended) or CZ.

    Note:
Classical instructions gates such as e.g. Flush and Measure are
automatically allowed.

    @example
    getEngineList(tuple(Rz, Ry, Rx, H), tuple(CNOT), tuple(TimeEvolution))

@param {string|Array.<BasicGate>} one_qubit_gates "any" allows any one qubit gate, otherwise provide
a tuple of the allowed gates. If the gates are instances of a class (e.g. X), it allows all gates
which are equal to it. If the gate is a class (Rz), it allows all instances of this class. Default is "any"
 @param {string|Array.<BasicGate>} two_qubit_gates "any" allows any two qubit gate, otherwise provide
a tuple of the allowed gates. If the gates are instances of a class (e.g. CNOT), it allows all gates
which are equal to it. If the gate is a class, it allows all instances of this class.
Default is (CNOT,).
 @param {string|Array.<BasicGate>} other_gates A tuple of the allowed gates. If the gates are
instances of a class (e.g. QFT), it allows all gates which are equal to it. If the gate is a
class, it allows all instances of this class.

@throws {Error} If input is for the gates is not "any" or a tuple.
    @return {Array<BasicEngine>} A list of suitable compiler engines.
 */
export function getEngineList(one_qubit_gates: GateClass[] | SpecialGate = SpecialGate.Any,
  two_qubit_gates: IGate[] | SpecialGate = [CNOT], other_gates = []) {
  if (two_qubit_gates !== SpecialGate.Any && !Array.isArray(two_qubit_gates)) {
    throw new Error("two_qubit_gates parameter must be 'any' or a tuple. "
      + 'When supplying only one gate, make sure to correctly '
      + "create the tuple (don't miss the comma), "
      + 'e.g. tuple(CNOT)')
  }
  if (one_qubit_gates !== SpecialGate.Any && !Array.isArray(one_qubit_gates)) {
    throw new Error("one_qubit_gates parameter must be 'any' or a tuple.")
  }

  if (!Array.isArray(other_gates)) {
    throw new Error('other_gates parameter must be a tuple.')
  }
  const rule_set = new DecompositionRuleSet([...math, ...decompositions])
  const allowed_gate_classes: GateClass[] = []
  const allowed_gate_instances: any[] = []
  if (one_qubit_gates !== 'any') {
    one_qubit_gates.forEach((gate) => {
      if (typeof gate === 'function') {
        allowed_gate_classes.push(gate)
      } else {
        allowed_gate_instances.push([gate, 0])
      }
    })
  }
  if (two_qubit_gates !== SpecialGate.Any) {
    two_qubit_gates.forEach((gate) => {
      if (typeof gate === 'function') {
        //  Controlled gate classes don't yet exists and would require
        //  separate treatment
        assert(!isKindclassOf(gate, ControlledGate))
        allowed_gate_classes.push(gate)
      } else if (gate instanceof ControlledGate) {
        allowed_gate_instances.push([gate.gate, gate.n])
      } else {
        allowed_gate_instances.push([gate, 0])
      }
    })
  }

  other_gates.forEach((gate: any) => {
    if (typeof gate === 'function') {
      //  Controlled gate classes don't yet exists and would require
      //  separate treatment
      assert(!isKindclassOf(gate, ControlledGate))
      allowed_gate_classes.push(gate)
    } else if (gate instanceof ControlledGate) {
      allowed_gate_instances.push([gate.gate, gate.n])
    } else {
      allowed_gate_instances.push([gate, 0])
    }
  })

  function low_level_gates(eng: IEngine, cmd: ICommand) {
    const all_qubits: IQubit[] = []
    cmd.allQubits.forEach(qr => qr.forEach(q => all_qubits.push(q)))

    if (cmd.gate instanceof ClassicalInstructionGate) {
      // This is required to allow Measure, Allocate, Deallocate, Flush
      return true
    } else if (one_qubit_gates === 'any' && len(all_qubits) === 1) {
      return true
    } else if (two_qubit_gates === 'any' && len(all_qubits) === 2) {
      return true
    } else if (instanceOf(cmd.gate, allowed_gate_classes)) {
      return true
    } else {
      const cn = cmd.controlQubits.length
      const idx = allowed_gate_instances.findIndex((looper) => {
        try {
          return cmd.gate.equal(looper[0]) && cn === looper[1]
        } catch (e) {
          return false
        }
      })
      if (idx !== -1) {
        return true
      }
    }
    return false
  }

  return [
    new AutoReplacer(rule_set),
    new TagRemover(),
    new InstructionFilter(high_level_gates),
    new LocalOptimizer(5),
    new AutoReplacer(rule_set),
    new TagRemover(),
    new InstructionFilter(one_and_two_qubit_gates),
    new LocalOptimizer(5),
    new AutoReplacer(rule_set),
    new TagRemover(),
    new InstructionFilter(low_level_gates),
    new LocalOptimizer(5),
  ]
}
