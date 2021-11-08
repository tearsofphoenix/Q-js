import { expect } from 'chai'
import {
  SqrtSwapGate, SqrtSwap, All, Measure
} from '@/ops'
import {
  DummyEngine, MainEngine, DecompositionRuleSet, AutoReplacer, InstructionFilter
} from '@/cengines'
import { Simulator } from '@/backends/simulators/simulator'
import sqrtswap2cnot from '@/setups/decompositions/sqrtswap2cnot'
import { tuple } from '@/libs/util'
import { len } from '@/libs/polyfill'

describe('SqrtSwap to CNOT test', () => {
  function _decomp_gates(eng, cmd) {
    if (cmd.gate instanceof SqrtSwapGate) {
      return false
    }
    return true
  }
  it('should test', () => {
    const states = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0],
    [0, 0, 0, 1]]
    states.forEach((basis_state) => {
      const correct_dummy_eng = new DummyEngine(true)
      const correct_eng = new MainEngine(new Simulator(), [correct_dummy_eng])
      const rule_set = new DecompositionRuleSet([...sqrtswap2cnot])
      const test_dummy_eng = new DummyEngine(true)
      const test_eng = new MainEngine(new Simulator(),
        [
          new AutoReplacer(rule_set),
          new InstructionFilter(_decomp_gates),
          test_dummy_eng])
      const test_sim = test_eng.backend
      const correct_sim = correct_eng.backend
      const correct_qureg = correct_eng.allocateQureg(2)
      correct_eng.flush()
      const test_qureg = test_eng.allocateQureg(2)
      test_eng.flush()

      correct_sim.setWavefunction(basis_state, correct_qureg)
      test_sim.setWavefunction(basis_state, test_qureg)

      SqrtSwap.or(tuple(test_qureg[0], test_qureg[1]))
      test_eng.flush()
      SqrtSwap.or(tuple(correct_qureg[0], correct_qureg[1]))
      correct_eng.flush()

      expect(len(test_dummy_eng.receivedCommands)).to.not.equal(len(correct_dummy_eng.receivedCommands))

      for (let i = 0; i < 4; ++i) {
        let binary_state = i.toString(2)
        if (binary_state.length < 2) {
          binary_state = `0${binary_state}`
        }
        const test = test_sim.getAmplitude(binary_state, test_qureg)
        const correct = correct_sim.getAmplitude(binary_state, correct_qureg)
        expect(correct.re).to.be.closeTo(test.re, 1e-12)
        expect(correct.im).to.be.closeTo(test.im, 1e-12)
      }

      new All(Measure).or(test_qureg)
      new All(Measure).or(correct_qureg)
      test_eng.flush(true)
      correct_eng.flush(true)
    })
  });
})
