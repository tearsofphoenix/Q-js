import { expect } from 'chai'
import math from 'mathjs'
import { AutoReplacer, DummyEngine, InstructionFilter } from '@/cengines';
import MainEngine from '@/cengines/main';
import { Control } from '@/meta';
import {
  All,
  BasicGate, ClassicalInstructionGate, Measure, Ph, R, Rx, Ry, Rz, X, XGate
} from '@/ops';
import carb1q, { _recognize_carb1qubit, _recognize_v } from '@/setups/decompositions/carb1qubit2cnotrzandry';
import { instanceOf } from '@/libs/util';
import { create_test_matrices } from './arb1qubit2rzandry.spec';
import Simulator from '@/backends/simulators/simulator';
import DecompositionRuleSet from '@/cengines/replacer/decompositionruleset'

describe('carb1qubit to cnot rz & ry test', () => {
  it('should test_recognize_correct_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    const ctrl_qubit = eng.allocateQubit()
    eng.flush()
    Control(eng, ctrl_qubit, () => {
      new Ph(0.1).or(qubit)
      new R(0.2).or(qubit)
      new Rx(0.3).or(qubit)
      X.or(qubit)
    })

    eng.flush(true)
    // Don't test initial two allocate and flush and trailing deallocate
    // and flush gate.
    const cmds = saving_backend.receivedCommands
    cmds.slice(3, cmds.length - 3).forEach(cmd => expect(_recognize_carb1qubit(cmd)).to.equal(true))
  });

  it('should test_recognize_incorrect_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    const ctrl_qubit = eng.allocateQubit()
    const ctrl_qureg = eng.allocateQureg(2)
    eng.flush()
    Control(eng, ctrl_qubit, () => {
      // Does not have matrix attribute:
      new BasicGate().or(qubit)
      // Two qubit gate:
      const two_qubit_gate = new BasicGate()
      two_qubit_gate.matrix = [[1, 0, 0, 0], [0, 1, 0, 0],
      [0, 0, 1, 0], [0, 0, 0, 1]]
      two_qubit_gate.or(qubit)
    })

    Control(eng, ctrl_qureg, () => {
      // Too many Control qubits:
      new Rx(0.3).or(qubit)
    })
    eng.flush(true)
    saving_backend.receivedCommands.forEach(cmd => expect(_recognize_carb1qubit(cmd)).to.equal(false))
  });

  function _decomp_gates(eng, cmd) {
    const g = cmd.gate
    if (g instanceof ClassicalInstructionGate) {
      return true
    }
    const cn = cmd.controlCount
    if (cn === 0 && instanceOf(g, [Ry, Rz, Ph])) {
      return true
    }
    if (cn === 1 && instanceOf(g, [XGate, Ph])) {
      return true
    }
    return false
  }

  it('should test_recognize_v', () => {
    const mc = math.complex
    const data = [[[1, 0], [0, -1]],
    [[0, mc(0, -1)], [mc(0, 1), 0]]]
    data.forEach(gate_matrix => expect(_recognize_v(gate_matrix).length).to.equal(3))
  });

  it('should test_decomposition', () => {
    const data = create_test_matrices()
    data.forEach((gate_matrix) => {
      // Create single qubit gate with gate_matrix
      const test_gate = new BasicGate()
      test_gate.matrix = gate_matrix
      const states = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0],
      [0, 0, 0, 1]]
      states.forEach((basis_state) => {
        const correct_dummy_eng = new DummyEngine(true)
        const correct_eng = new MainEngine(new Simulator(),
          [correct_dummy_eng])

        const rule_set = new DecompositionRuleSet(carb1q)
        const test_dummy_eng = new DummyEngine(true)
        const test_eng = new MainEngine(new Simulator(),
          [new AutoReplacer(rule_set),
          new InstructionFilter(_decomp_gates),
            test_dummy_eng])
        const test_sim = test_eng.backend
        const correct_sim = correct_eng.backend

        const correct_qb = correct_eng.allocateQubit()
        const correct_ctrl_qb = correct_eng.allocateQubit()
        correct_eng.flush()
        const test_qb = test_eng.allocateQubit()
        const test_ctrl_qb = test_eng.allocateQubit()
        test_eng.flush()

        correct_sim.setWavefunction(basis_state, correct_qb.concat(correct_ctrl_qb))
        test_sim.setWavefunction(basis_state, test_qb.concat(test_ctrl_qb))

        Control(test_eng, test_ctrl_qb, () => test_gate.or(test_qb))
        Control(correct_eng, correct_ctrl_qb, () => test_gate.or(correct_qb))

        test_eng.flush()
        correct_eng.flush()

        expect(correct_dummy_eng.receivedCommands[3].gate.equal(test_gate)).to.equal(true)
        expect(test_dummy_eng.receivedCommands[3].gate.equal(test_gate)).to.equal(false)

        const bs = ['00', '01', '10', '11']
        bs.forEach((fstate) => {
          const test = test_sim.getAmplitude(fstate, test_qb.concat(test_ctrl_qb))
          const correct = correct_sim.getAmplitude(fstate, correct_qb.concat(correct_ctrl_qb))
          expect(correct.re).to.be.closeTo(test.re, 1e-12)
          expect(correct.im).to.be.closeTo(test.im, 1e-12)
        })

        new All(Measure).or(test_qb.concat(test_ctrl_qb))
        new All(Measure).or(correct_qb.concat(correct_ctrl_qb))
        test_eng.flush(true)
        correct_eng.flush(true)
      })
    })
  });
})
