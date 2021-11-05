import { expect } from 'chai'
import {
  Measure,
  Ph, Rx, Ry, X, XGate
} from '@/ops/gates';
import { Control } from '@/meta/control';
import { QFT } from '@/ops/qftgate';
import { _recognize_CnU } from '@/setups/decompositions/cnu2toffoliandcu';
import { DummyEngine } from '@/cengines/testengine';
import MainEngine from '@/cengines/main';
import { ClassicalInstructionGate } from '@/ops/basics';
import { len } from '@/libs/polyfill';
import Simulator from '@/backends/simulators/simulator';
import DecompositionRuleSet from '@/cengines/replacer/decompositionruleset';
import cnu2toffoliandcu from '@/setups/decompositions/cnu2toffoliandcu';
import { AutoReplacer, InstructionFilter } from '@/cengines/replacer/replacer';
import { All } from '@/ops/metagates';

describe('cnu 2 toffoli and cu test', () => {
  it('should test_recognize_correct_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    const ctrl_qureg = eng.allocateQureg(2)
    const ctrl_qureg2 = eng.allocateQureg(3)
    eng.flush()
    Control(eng, ctrl_qureg, () => {
      new Ph(0.1).or(qubit)
      new Ry(0.2).or(qubit)
    })

    Control(eng, ctrl_qureg2, () => {
      QFT.or(qubit.concat(ctrl_qureg))
      X.or(qubit)
    })
    eng.flush() // To make sure gates arrive before deallocate gates
    eng.flush(true)
    // Don't test initial 6 allocate and flush and trailing deallocate
    // and two flush gates.
    const cmds = saving_backend.receivedCommands
    cmds.slice(7, cmds.length - 8).forEach(cmd => expect(_recognize_CnU(cmd)).to.equal(true))
  });

  it('should test_recognize_incorrect_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    const ctrl_qubit = eng.allocateQubit()
    const ctrl_qureg = eng.allocateQureg(2)
    eng.flush()

    Control(eng, ctrl_qubit, () => new Rx(0.3).or(qubit))
    X.or(qubit)

    Control(eng, ctrl_qureg, () => X.or(qubit))
    eng.flush(true)

    saving_backend.receivedCommands.forEach(cmd => expect(_recognize_CnU(cmd)).to.equal(false))
  });

  it('should test_decomposition', () => {
    const _decomp_gates = (eng, cmd) => {
      const g = cmd.gate
      if (g instanceof ClassicalInstructionGate) {
        return true
      }

      const n = len(cmd.controlQubits)
      if (n <= 1) {
        return true
      }
      return n === 2 && g instanceof XGate
    }

    for (let basis_state_index = 0; basis_state_index < 16; ++basis_state_index) {
      const basis_state = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      basis_state[basis_state_index] = 1.0
      const correct_dummy_eng = new DummyEngine(true)
      const correct_eng = new MainEngine(new Simulator(), [correct_dummy_eng])
      const rule_set = new DecompositionRuleSet(cnu2toffoliandcu)
      const test_dummy_eng = new DummyEngine(true)
      const test_eng = new MainEngine(new Simulator(), [new AutoReplacer(rule_set),
      new InstructionFilter(_decomp_gates), test_dummy_eng])
      const test_sim = test_eng.backend

      const correct_sim = correct_eng.backend
      const correct_qb = correct_eng.allocateQubit()
      const correct_ctrl_qureg = correct_eng.allocateQureg(3)
      correct_eng.flush()

      const test_qb = test_eng.allocateQubit()
      const test_ctrl_qureg = test_eng.allocateQureg(3)
      test_eng.flush()

      correct_sim.setWavefunction(basis_state, correct_qb.concat(correct_ctrl_qureg))
      test_sim.setWavefunction(basis_state, test_qb.concat(test_ctrl_qureg))

      Control(test_eng, test_ctrl_qureg.slice(0, 2), () => new Rx(0.4).or(test_qb))
      Control(test_eng, test_ctrl_qureg, () => new Ry(0.6).or(test_qb))

      Control(correct_eng, correct_ctrl_qureg.slice(0, 2), () => new Rx(0.4).or(correct_qb))
      Control(correct_eng, correct_ctrl_qureg, () => new Ry(0.6).or(correct_qb))

      test_eng.flush()
      correct_eng.flush()

      expect(len(correct_dummy_eng.receivedCommands)).to.equal(8)
      correct_dummy_eng.receivedCommands.forEach(cmd => console.log(cmd.toString()))
      expect(len(test_dummy_eng.receivedCommands)).to.equal(20)

      for (let fstate = 0; fstate < 16; ++fstate) {
        let binary_state = fstate.toString(2)
        const append = 4 - binary_state.length
        if (append > 0) {
          for (let i = 0; i < append; ++i) {
            binary_state = `0${binary_state}`
          }
        }

        const test = test_sim.getAmplitude(binary_state, test_qb.concat(test_ctrl_qureg))
        const correct = correct_sim.getAmplitude(binary_state, correct_qb.concat(correct_ctrl_qureg))
        expect(test.re).to.be.closeTo(correct.re, 1e-12)
      }

      new All(Measure).or(test_qb.concat(test_ctrl_qureg))
      new All(Measure).or(correct_qb.concat(correct_ctrl_qureg))
      test_eng.flush(true)
      correct_eng.flush(true)
    }
  });
})
