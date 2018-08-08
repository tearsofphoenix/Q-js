import {expect} from 'chai'
import math from 'mathjs'
import {BasicMathGate, ClassicalInstructionGate} from '../../ops/basics';
import {len} from '../polyfill';
import DecompositionRuleSet from '../../cengines/replacer/decompositionruleset';
import qft2crandhadamard from '../../setups/decompositions/qft2crandhadamard';
import swap2cnot from '../../setups/decompositions/swap2cnot';
import defaultrules from './defaultrules'
import {AutoReplacer, InstructionFilter} from '../../cengines/replacer/replacer';
import {AddConstant, AddConstantModN, MultiplyByConstantModN} from './gates';
import {All} from '../../ops/metagates';
import {Measure, X} from '../../ops/gates';
import Simulator from '../../backends/simulators/simulator';
import MainEngine from '../../cengines/main';

function init(engine, quint, value) {
  for (let i = 0; i < quint.length; ++i) {
    if (((value >> i) & 1) == 1) {
      X.or(quint[i])
    }
  }
}

function no_math_emulation(eng, cmd) {
  if (cmd.gate instanceof BasicMathGate) {
    return false
  }
  if (cmd.gate instanceof ClassicalInstructionGate) {
    return true
  }

  try {
    return len(cmd.gate.matrix) === 2
  } catch (e) {
    return false
  }
}

const rule_set = new DecompositionRuleSet([...defaultrules, ...qft2crandhadamard, ...swap2cnot])

describe('constant math test', () => {
  it('should test_adder', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [new AutoReplacer(rule_set),
      new InstructionFilter(no_math_emulation)])
    const qureg = eng.allocateQureg(4)
    init(eng, qureg, 4)

    new AddConstant(3).or(qureg)

    let m = sim.cheat()[1]
    expect(math.abs(m.subset(math.index(7)))).to.be.closeTo(1, 1e-12)

    init(eng, qureg, 7) // reset
    init(eng, qureg, 2)

    // check for overflow -> should be 15+2 = 1 (mod 16)
    new AddConstant(15).or(qureg)
    m = sim.cheat()[1]
    expect(math.abs(m.subset(math.index(1)))).to.be.closeTo(1, 1e-12)

    new All(Measure).or(qureg)
  });

  it('should test_modadder', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [new AutoReplacer(rule_set),
      new InstructionFilter(no_math_emulation)])

    const qureg = eng.allocateQureg(4)
    init(eng, qureg, 4)

    new AddConstantModN(3, 6).or(qureg)
    let m = sim.cheat()[1]
    expect(math.abs(m.subset(math.index(1)))).to.closeTo(1, 1e-12)

    init(eng, qureg, 1) // reset
    init(eng, qureg, 7)

    new AddConstantModN(10, 13).or(qureg)
    m = sim.cheat()[1]
    expect(math.abs(m.subset(math.index(4)))).to.closeTo(1, 1e-12)

    new All(Measure).or(qureg)
  });

  it('should test_modmultiplier', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [new AutoReplacer(rule_set),
      new InstructionFilter(no_math_emulation)])

    const qureg = eng.allocateQureg(4)
    init(eng, qureg, 4)

    new MultiplyByConstantModN(3, 7).or(qureg)

    let m = sim.cheat()[1]
    expect(math.abs(m.subset(math.index(5)))).to.closeTo(1, 1e-12)

    init(eng, qureg, 5) // reset
    init(eng, qureg, 7)

    new MultiplyByConstantModN(4, 13).or(qureg)

    m = sim.cheat()[1]
    expect(math.abs(m.subset(math.index(2)))).to.closeTo(1, 1e-12)

    new All(Measure).or(qureg)
  });
})
