import {expect} from 'chai'
import math from 'mathjs'
import {ClassicalInstructionGate} from '../../ops/basics';
import {len} from '../../libs/polyfill';
import Gates, {
  Entangle, Ph, Rz, T, X, Measure, H, R
} from '../../ops/gates';
import {AutoReplacer, InstructionFilter} from '../../cengines/replacer/replacer';
import DecompositionRuleSet from '../../cengines/replacer/decompositionruleset';
import Simulator from '../../backends/simulators/simulator';
import MainEngine from '../../cengines/main'
import entangle from './entangle'
import {All} from '../../ops/metagates'
import globalphase from './globalphase'
import r2rzandph from './r2rzandph'
import {DummyEngine} from '../../cengines/testengine';
import {tuple} from '../../libs/util';
import {CRz, Toffoli} from '../../ops/shortcuts';
import {Control} from '../../meta/control'
import crz2cxandrz from './crz2cxandrz'
import ph2r from './ph2r'
import toffoli2cnotandtgate from './toffoli2cnotandtgate'

const {Tdag} = Gates

describe('gates test', () => {
  const low_level_gates = (eng, cmd) => {
    const g = cmd.gate
    if (g instanceof ClassicalInstructionGate) {
      return true
    }

    if (len(cmd.controlQubits) === 0) {
      if (g.equal(T) || g.equal(Tdag) || g.equal(H) || g instanceof Rz || g instanceof Ph) {
        return true
      }
    } else if (len(cmd.controlQubits) === 1 && g.equal(X)) {
      return true
    }
    return false
  }

  it('should test_entangle', () => {
    const rule_set = new DecompositionRuleSet(entangle)
    const sim = new Simulator()
    const eng = new MainEngine(sim,
      [new AutoReplacer(rule_set),
        new InstructionFilter(low_level_gates)])
    const qureg = eng.allocateQureg(4)
    Entangle.or(qureg)

    const m = sim.cheat()[1]
    const v1 = m[0]
    const v2 = m[len(m) - 1]
    expect(v1.re).to.be.closeTo(Math.SQRT1_2, 1e-12)
    expect(v2.re).to.be.closeTo(Math.SQRT1_2, 1e-12)

    new All(Measure).or(qureg)
  });

  it('should test_globalphase', () => {
    const low_level_gates_noglobalphase = (eng, cmd) => (low_level_gates(eng, cmd)
    && !(cmd.gate instanceof Ph) && !(cmd.gate instanceof R))


    const rule_set = new DecompositionRuleSet([...globalphase, ...r2rzandph])
    const dummy = new DummyEngine(true)
    const eng = new MainEngine(dummy, [new AutoReplacer(rule_set), new InstructionFilter(low_level_gates_noglobalphase)])

    const qubit = eng.allocateQubit()
    new R(1.2).or(qubit)

    let rz_count = 0
    dummy.receivedCommands.forEach((cmd) => {
      expect(cmd.gate instanceof R).to.equal(false)
      if (cmd.gate instanceof Rz) {
        rz_count += 1
        expect(cmd.gate.equal(new Rz(1.2))).to.equal(true)
      }
    })
    expect(rz_count).to.equal(1)
  });

  it('should test_gate_decompositions', () => {
    const run_circuit = (eng) => {
      const qureg = eng.allocateQureg(4)
      new All(H).or(qureg)
      CRz(3.0).or(tuple(qureg[0], qureg[1]))
      Toffoli.or(tuple(qureg[1], qureg[2], qureg[3]))

      Control(eng, qureg.slice(0, 2), () => new Ph(1.43).or(qureg[2]))
      return qureg
    }

    const sim = new Simulator()
    const eng = new MainEngine(sim, [])
    const rule_set = new DecompositionRuleSet([...r2rzandph, ...crz2cxandrz, ...toffoli2cnotandtgate, ...ph2r])

    const qureg = run_circuit(eng)

    const sim2 = new Simulator()
    const eng_lowlevel = new MainEngine(sim2, [new AutoReplacer(rule_set), new InstructionFilter(low_level_gates)])
    const qureg2 = run_circuit(eng_lowlevel)

    const m = sim.cheat()[1]
    const m2 = sim2.cheat()[1]
    m.forEach((val, idx) => {
      const v2 = m2[idx]
      expect(val.re).to.be.closeTo(v2.re, 1e-12)
      expect(val.im).to.be.closeTo(v2.im, 1e-12)
    })

    new All(Measure).or(qureg)
    new All(Measure).or(qureg2)
  });
})
