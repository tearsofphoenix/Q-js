import {expect} from 'chai'
import math from 'mathjs'
import {AutoReplacer, DummyEngine, InstructionFilter} from '../../cengines';
import MainEngine from '../../cengines/main'
import {
  BasicGate, ClassicalInstructionGate,
  Ph, R, Rx, Ry, Rz, X, Measure
} from '../../ops';
import arb1q, {_recognize_arb1qubit} from './arb1qubit2rzandry';
import {Control} from '../../meta';
import Simulator from '../../backends/simulators/simulator';
import DecompositionRuleSet from '../../cengines/replacer/decompositionruleset';

describe('arb1qubit to rz & ry test', () => {
  it('should test_recognize_correct_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    new Ph(0.1).or(qubit)
    new R(0.2).or(qubit)
    new Rx(0.3).or(qubit)
    X.or(qubit)
    eng.flush(true)
    // Don't test initial allocate and trailing deallocate and flush gate.
    const cmds = saving_backend.receivedCommands
    cmds.slice(1, cmds.length - 2).forEach(cmd => expect(_recognize_arb1qubit(cmd)).to.equal(true))
  });

  it('should test_recognize_incorrect_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    // Does not have matrix attribute:
    new BasicGate().or(qubit)
    // Two qubit gate:
    const two_qubit_gate = new BasicGate()
    two_qubit_gate.matrix = math.matrix([[1, 0, 0, 0], [0, 1, 0, 0],
      [0, 0, 1, 0], [0, 0, 0, 1]])
    two_qubit_gate.or(qubit)
    // Controlled single qubit gate:
    const ctrl_qubit = eng.allocateQubit()
    Control(eng, ctrl_qubit, () => new Rz(0.1).or(qubit))
    eng.flush(true)

    saving_backend.receivedCommands.forEach(cmd => expect(_recognize_arb1qubit(cmd)).to.equal(false))
  });


  function z_y_decomp_gates(eng, cmd) {
    const g = cmd.gate
    if (g instanceof ClassicalInstructionGate) {
      return true
    }
    if (cmd.controlQubits.length === 0) {
      if ((g instanceof Ry) || (g instanceof Rz) || (g instanceof Ph)) return true
    }
    return false
  }

  /*
Creates a unitary 2x2 matrix given parameters.

    Any unitary 2x2 matrix can be parametrized by:
    U = exp(ia) [[exp(j*b) * cos(d), exp(j*c) * sin(d)],
        [-exp(-j*c) * sin(d), exp(-j*b) * cos(d)]]
with 0 <= d <= pi/2 and 0 <= a,b,c < 2pi. If a==0, then
det(U) == 1 and hence U is element of SU(2).

    Args:
a,b,c (float): parameters 0 <= a,b,c < 2pi
d (float): parameter 0 <= d <= pi/2

Returns:
    2x2 matrix as nested lists
 */
  function create_unitary_matrix(a, b, c, d) {
    const mc = math.complex
    const mm = math.multiply
    const exp = math.exp
    const ph = math.exp(mc(0, a)) // global phase
    const cosd = math.cos(d)
    const sind = math.sin(d)
    const result = mm(math.matrix([
      [mm(exp(mc(0, b)), cosd), mm(exp(mc(0, c)), sind)],
      [mm(mm(exp(mc(0, -c)), -1), sind), mm(exp(mc(0, -b)), cosd)]]), ph)
    return result
  }


  function create_test_matrices() {
    const params = [[0.2, 0.3, 0.5, math.pi * 0.4],
      [1e-14, 0.3, 0.5, 0],
      [0.4, 0.0, math.pi * 2, 0.7],
      [0.0, 0.2, math.pi * 1.2, 1.5], // element of SU[2]
      [0.4, 0.0, math.pi * 1.3, 0.8],
      [0.4, 4.1, math.pi * 1.3, 0],
      [5.1, 1.2, math.pi * 1.5, math.pi / 2.0],
      [1e-13, 1.2, math.pi * 3.7, math.pi / 2.0],
      [0, math.pi / 2.0, 0, 0],
      [math.pi / 2.0, -math.pi / 2.0, 0, 0],
      [math.pi / 2.0, math.pi / 2.0, 0.1, 0.4],
      [math.pi * 1.5, math.pi / 2.0, 0, 0.4]]
    const matrices = []
    params.forEach(([a, b, c, d]) => matrices.push(create_unitary_matrix(a, b, c, d)))
    return matrices
  }

  it('should test_decomposition', () => {
    const data = create_test_matrices()
    data.forEach((gate_matrix) => {
      const states = [[1, 0], [0, 1]]
      states.forEach((basis_state) => {
        // Create single qubit gate with gate_matrix
        const test_gate = new BasicGate()
        test_gate.matrix = gate_matrix

        const correct_dummy_eng = new DummyEngine(true)
        const correct_eng = new MainEngine(new Simulator(), [correct_dummy_eng])

        const rule_set = new DecompositionRuleSet(arb1q)
        const test_dummy_eng = new DummyEngine(true)
        const test_eng = new MainEngine(new Simulator(),
          [new AutoReplacer(rule_set),
            new InstructionFilter(z_y_decomp_gates), test_dummy_eng])

        const correct_qb = correct_eng.allocateQubit()
        correct_eng.flush()
        const test_qb = test_eng.allocateQubit()
        test_eng.flush()

        correct_eng.backend.setWavefunction(basis_state, correct_qb)
        test_eng.backend.setWavefunction(basis_state, test_qb)

        test_gate.or(test_qb)
        test_gate.or(correct_qb)

        test_eng.flush()
        correct_eng.flush()

        expect(correct_dummy_eng.receivedCommands[2].gate.equal(test_gate)).to.equal(true)
        expect(test_dummy_eng.receivedCommands[2].gate.equal(test_gate)).to.equal(false)

        const ss = ['0', '1']
        ss.forEach((fstate) => {
          const test = test_eng.backend.getAmplitude(fstate, test_qb)
          const correct = correct_eng.backend.getAmplitude(fstate, correct_qb)
          expect(correct.re).to.be.closeTo(test.re, 1e-12)
          expect(correct.im).to.be.closeTo(test.im, 1e-12)
        })

        Measure.or(test_qb)
        Measure.or(correct_qb)
      })
    })
  });

  it('should test_decomposition_errors', () => {
    const data = [[[2, 0], [0, 4]],
      [[0, 2], [4, 0]],
      [[1, 2], [4, 0]]]
    data.forEach((gate_matrix) => {
      const test_gate = new BasicGate()
      test_gate.matrix = math.matrix(gate_matrix)
      const rule_set = new DecompositionRuleSet(arb1q)
      const eng = new MainEngine(new DummyEngine(),
        [new AutoReplacer(rule_set),
          new InstructionFilter(z_y_decomp_gates)])
      const qb = eng.allocateQubit()
      expect(() => test_gate.or(qb)).to.throw()
    })
  });
})
