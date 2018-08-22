import {expect} from 'chai'
import math from 'mathjs';
import MainEngine from '../../../src/cengines/main';
import {AutoReplacer, DummyEngine, InstructionFilter} from '../../../src/cengines';
import QubitOperator from '../../../src/ops/qubitoperator';
import TimeEvolution from '../../../src/ops/timeevolution';
import {rule_commuting_terms, rule_individual_terms} from '../../../src/setups/decompositions/time_evolution'
import {len} from '../../../src/libs/polyfill';
import {
  All, ClassicalInstructionGate, Measure, Ph, Rx, Ry, Rz
} from '../../../src/ops';
import DecompositionRuleSet from '../../../src/cengines/replacer/decompositionruleset';
import {Control} from '../../../src/meta';
import Simulator from '../../../src/backends/simulators/simulator';

function convertNativeMatrix(vec) {
  const m = math.zeros(vec.length)
  vec.forEach((val, idx) => {
    m.subset(math.index(idx), math.complex(val.re, val.im))
  })
  return m
}

describe('time evolution test', () => {
  it('should test_recognize_commuting_terms', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const wavefunction = eng.allocateQureg(5)
    const op1 = new QubitOperator('X1 Y2', 0.5)
    const op2 = new QubitOperator('Y2 X4', -0.5)
    const op3 = new QubitOperator([], 0.5)
    const op4 = new QubitOperator('X1 Y2', 0.5).add(new QubitOperator('X2', 1e-10))
    const op5 = new QubitOperator('X1 Y2', 0.5).add(new QubitOperator('X2', 1e-8))
    const op6 = new QubitOperator('X2', 1.0)
    new TimeEvolution(1.0, op1.add(op2).add(op3).add(op4)).or(wavefunction)
    new TimeEvolution(1.0, op1.add(op5)).or(wavefunction)
    new TimeEvolution(1.0, op1.add(op6)).or(wavefunction)
    new TimeEvolution(1.0, op1).or(wavefunction)

    const cmd1 = saving_backend.receivedCommands[5]
    const cmd2 = saving_backend.receivedCommands[6]
    const cmd3 = saving_backend.receivedCommands[7]
    const cmd4 = saving_backend.receivedCommands[8]

    expect(rule_commuting_terms.gateRecognizer(cmd1)).to.equal(true)
    expect(rule_commuting_terms.gateRecognizer(cmd2)).to.equal(false)
    expect(rule_commuting_terms.gateRecognizer(cmd3)).to.equal(false)
    expect(rule_commuting_terms.gateRecognizer(cmd4)).to.equal(false)
  });

  it('should test_decompose_commuting_terms', () => {
    const saving_backend = new DummyEngine(true)

    const my_filter = (_, cmd) => {
      return (len(cmd.qubits[0]) <= 2 || cmd.gate instanceof ClassicalInstructionGate)
    }

    const rules = new DecompositionRuleSet([rule_commuting_terms])
    const replacer = new AutoReplacer(rules)
    const filter_eng = new InstructionFilter(my_filter)
    const eng = new MainEngine(saving_backend, [replacer, filter_eng])
    const qureg = eng.allocateQureg(5)
    Control(eng, qureg[3], () => {
      const op1 = new QubitOperator('X1 Y2', 0.7)
      const op2 = new QubitOperator('Y2 X4', -0.8)
      const op3 = new QubitOperator([], 0.6)
      new TimeEvolution(1.5, op1.add(op2).add(op3)).or(qureg)
    })
    const cmd1 = saving_backend.receivedCommands[5]
    const cmd2 = saving_backend.receivedCommands[6]
    const cmd3 = saving_backend.receivedCommands[7]

    const found = [false, false, false]
    const scaled_op1 = new QubitOperator('X0 Y1', 0.7)
    const scaled_op2 = new QubitOperator('Y0 X1', -0.8)
    const cmds = [cmd1, cmd2, cmd3]
    const pgate = new Ph(-1.5 * 0.6)
    cmds.forEach((cmd) => {
      if (pgate.equal(cmd.gate)
      && cmd.qubits[0][0].id === qureg[1].id // 1st qubit of [1,2,4]
      && cmd.controlQubits[0].id === qureg[3].id) {
        found[0] = true
      } else if ((cmd.gate instanceof TimeEvolution)
      && cmd.gate.hamiltonian.isClose(scaled_op1)
      && Math.abs(cmd.gate.time - 1.5) < 1e-12
      && cmd.qubits[0][0].id === qureg[1].id
      && cmd.qubits[0][1].id === qureg[2].id
      && cmd.controlQubits[0].id === qureg[3].id) {
        found[1] = true
      } else if ((cmd.gate instanceof TimeEvolution)
      && cmd.gate.hamiltonian.isClose(scaled_op2)
          && Math.abs(cmd.gate.time - 1.5) < 1e-12
      && cmd.qubits[0][0].id === qureg[2].id
      && cmd.qubits[0][1].id === qureg[4].id
      && cmd.controlQubits[0].id === qureg[3].id) {
        found[2] = true
      }
    })

    expect(found.indexOf(false) === -1).to.equal(true)
  });

  it('should test_recognize_individual_terms', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const wavefunction = eng.allocateQureg(5)
    const op1 = new QubitOperator('X1 Y2', 0.5)
    const op2 = new QubitOperator('Y2 X4', -0.5)
    const op3 = new QubitOperator('X2', 1.0)
    new TimeEvolution(1.0, op1.add(op2)).or(wavefunction)
    new TimeEvolution(1.0, op2).or(wavefunction)
    new TimeEvolution(1.0, op3).or(wavefunction)

    const cmd1 = saving_backend.receivedCommands[5]
    const cmd2 = saving_backend.receivedCommands[6]
    const cmd3 = saving_backend.receivedCommands[7]

    expect(rule_individual_terms.gateRecognizer(cmd1)).to.equal(false)
    expect(rule_individual_terms.gateRecognizer(cmd2)).to.equal(true)
    expect(rule_individual_terms.gateRecognizer(cmd3)).to.equal(true)
  });

  it('should test_decompose_individual_terms', () => {
    const saving_eng = new DummyEngine(true)

    function my_filter(_, cmd) {
      return !(cmd.gate instanceof TimeEvolution)
    }

    const rules = new DecompositionRuleSet([rule_individual_terms])
    const replacer = new AutoReplacer(rules)
    const filter_eng = new InstructionFilter(my_filter)
    const eng = new MainEngine(new Simulator(), [replacer, filter_eng, saving_eng])
    const qureg = eng.allocateQureg(5)
    // initialize in random wavefunction by applying some gates:
    new Rx(0.1).or(qureg[0])
    new Ry(0.2).or(qureg[1])
    new Rx(0.45).or(qureg[2])
    new Rx(0.6).or(qureg[3])
    new Ry(0.77).or(qureg[4])
    eng.flush()
    // Use cheat to get initial start wavefunction:
    let [qubit_to_bit_map, init_wavefunction] = eng.backend.cheat()
    // Apply one qubit gates:
    const op1 = new QubitOperator([], 0.6)
    const op2 = new QubitOperator('X2', 0.21)
    const op3 = new QubitOperator('Y1', 0.33)
    const op4 = new QubitOperator('Z3', 0.42)
    const op5 = new QubitOperator('X0 Y1 Z2 Z4', -0.5)
    new TimeEvolution(1.1, op1).or(qureg)
    eng.flush()
    let [qbit_to_bit_map1, final_wavefunction1] = eng.backend.cheat()
    final_wavefunction1 = math.flatten(final_wavefunction1)
    final_wavefunction1 = convertNativeMatrix(final_wavefunction1)
    new TimeEvolution(1.2, op2).or(qureg)
    eng.flush()
    let [qbit_to_bit_map2, final_wavefunction2] = eng.backend.cheat()
    final_wavefunction2 = math.flatten(final_wavefunction2)
    final_wavefunction2 = convertNativeMatrix(final_wavefunction2)

    new TimeEvolution(1.3, op3).or(qureg)
    eng.flush()
    let [qbit_to_bit_map3, final_wavefunction3] = eng.backend.cheat()
    new TimeEvolution(1.4, op4).or(qureg)
    eng.flush()
    let [qbit_to_bit_map4, final_wavefunction4] = eng.backend.cheat()
    new TimeEvolution(1.5, op5).or(qureg)
    eng.flush()
    let [qbit_to_bit_map5, final_wavefunction5] = eng.backend.cheat()
    new All(Measure).or(qureg)
    // Check manually:

    const build_matrix = (list_single_matrices) => {
      let res = list_single_matrices[0]
      for (let i = 1; i < len(list_single_matrices); ++i) {
        res = math.kron(res, list_single_matrices[i])
      }
      return res
    }

    const mc = math.complex
    const id_sp = math.identity(2, 'sparse')
    const x_sp = math.sparse([[0.0, 1.0], [1.0, 0.0]])
    const y_sp = math.sparse([[0.0, mc(0, -1.0)], [mc(0, 1.0), 0.0]])
    const z_sp = math.sparse([[1.0, 0.0], [0.0, -1.0]])

    const matrix1 = math.multiply(math.identity(2 ** 5), mc(0, -0.6 * 1.1))
    init_wavefunction = math.flatten(init_wavefunction)
    init_wavefunction = convertNativeMatrix(init_wavefunction)
    const step1 = math.multiply(math.expm(matrix1), math.matrix(init_wavefunction))
    expect(math.deepEqual(step1, final_wavefunction1)).to.equal(true)

    const matrix2_list = []
    for (let i = 0; i < 5; ++i) {
      if (i === qbit_to_bit_map2[qureg[2].id]) {
        matrix2_list.push(x_sp)
      } else {
        matrix2_list.push(id_sp)
      }
    }
    matrix2_list.reverse()
    const matrix2 = math.multiply(build_matrix(matrix2_list), mc(0, 0.21 * 1.2 * -1.0))
    const step2 = math.multiply(math.expm(matrix2), step1)
    expect(math.deepEqual(step2, final_wavefunction2)).to.equal(true)

    final_wavefunction3 = math.flatten(final_wavefunction3)
    final_wavefunction3 = convertNativeMatrix(final_wavefunction3)
    const matrix3_list = []
    for (let i = 0; i < 5; ++i) {
      if (i === qbit_to_bit_map3[qureg[1].id]) {
        matrix3_list.push(y_sp)
      } else {
        matrix3_list.push(id_sp)
      }
    }
    matrix3_list.reverse()
    const matrix3 = math.multiply(build_matrix(matrix3_list), mc(0, 0.33 * 1.3 * -1.0))
    const step3 = math.multiply(math.expm(matrix3), final_wavefunction2)
    expect(math.deepEqual(step3, final_wavefunction3)).to.equal(true)

    final_wavefunction4 = convertNativeMatrix(math.flatten(final_wavefunction4))
    const matrix4_list = []
    for (let i = 0; i < 5; ++i) {
      if (i === qbit_to_bit_map4[qureg[3].id]) {
        matrix4_list.push(z_sp)
      } else {
        matrix4_list.push(id_sp)
      }
    }
    matrix4_list.reverse()
    const matrix4 = math.multiply(build_matrix(matrix4_list), mc(0, 0.42 * 1.4 * -1.0))
    const step4 = math.multiply(math.expm(matrix4), final_wavefunction3)
    expect(math.deepEqual(step4, final_wavefunction4)).to.equal(true)

    const matrix5_list = []
    for (let i = 0; i < 5; ++i) {
      if (i === qbit_to_bit_map5[qureg[0].id]) {
        matrix5_list.push(x_sp)
      } else if (i === qbit_to_bit_map5[qureg[1].id]) {
        matrix5_list.push(y_sp)
      } else if (i === qbit_to_bit_map5[qureg[2].id]) {
        matrix5_list.push(z_sp)
      } else if (i === qbit_to_bit_map5[qureg[4].id]) {
        matrix5_list.push(z_sp)
      } else {
        matrix5_list.push(id_sp)
      }
    }
    matrix5_list.reverse()
    const matrix5 = math.multiply(build_matrix(matrix5_list), mc(0, -0.5 * 1.5 * -1.0))
    const step5 = math.multiply(math.expm(matrix5), final_wavefunction4)

    final_wavefunction5 = convertNativeMatrix(math.flatten(final_wavefunction5))
    expect(math.deepEqual(step5, final_wavefunction5)).to.equal(true)
  });
});
