/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {expect} from 'chai'
import math from 'mathjs'
import {TrivialMapper} from './classicalsimulator.spec'
import {BasicGate, BasicMathGate} from '../../ops/basics'
import {DummyEngine} from '../../cengines/testengine';
import MainEngine from '../../cengines/main';
import {
  Allocate, H, Measure, X, Rx, Ry, Rz, Z, S
} from '../../ops/gates';
import Simulator from './simulator'
import {len} from '../../libs/polyfill';
import {CNOT} from '../../ops/shortcuts';
import {tuple} from '../../libs/util';
import {All} from '../../ops/metagates';
import {BasicQubit} from '../../types/qubit';
import {Command} from '../../ops/command';
import {LogicalQubitIDTag} from '../../meta/tag';
import {NotYetMeasuredError} from '../../meta/error';
import {Control} from '../../meta/control';
import {Dagger} from '../../meta/dagger';
import LocalOptimizer from '../../cengines/optimize';
import QubitOperator from '../../ops/qubitoperator';

describe('simulator test', () => {
  class Mock1QubitGate extends BasicGate {
    constructor() {
      super()
      this.cnt = 0
    }

    get matrix() {
      this.cnt += 1
      return math.matrix([[0, 1], [1, 0]])
    }
  }

  class Mock6QubitGate extends BasicGate {
    constructor() {
      super()
      this.cnt = 0
    }

    get matrix() {
      this.cnt += 1
      return math.identity(2 ** 6)
    }
  }

  class MockNoMatrixGate extends BasicGate {
    constructor() {
      super()
      this.cnt = 0
    }

    get matrix() {
      this.cnt += 1
      throw new Error('AttributeError')
    }
  }

  it('should test_simulator_is_available', () => {
    const sim = new Simulator()

    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [])
    const qubit = eng.allocateQubit()
    Measure.or(qubit)
    new BasicMathGate(x => x).or(qubit)
    qubit[0].deallocate()

    expect(backend.receivedCommands.length).to.equal(4)

    // Test that allocate, measure, basic math, and deallocate are available.
    backend.receivedCommands.forEach(cmd => sim.isAvailable(cmd))

    const new_cmd = backend.receivedCommands[backend.receivedCommands.length - 1]

    new_cmd.gate = new Mock1QubitGate()
    expect(sim.isAvailable(new_cmd)).to.equal(true)
    expect(new_cmd.gate.cnt).to.equal(1)

    new_cmd.gate = new Mock6QubitGate()
    expect(sim.isAvailable(new_cmd)).to.equal(false)
    expect(new_cmd.gate.cnt).to.equal(1)

    new_cmd.gate = new MockNoMatrixGate()

    expect(sim.isAvailable(new_cmd)).to.equal(false)
    expect(new_cmd.gate.cnt).to.equal(1)
  });

  it('should test_simulator_cheat', () => {
    const sim = new Simulator()

    // cheat function should return a tuple
    expect(Array.isArray(sim.cheat())).to.equal(true)
    // first entry is the qubit mapping.
    // should be empty:
    const c = sim.cheat()
    console.log(c)
    expect(Object.keys(sim.cheat()[0]).length).to.equal(0)
    // state vector should only have 1 entry:
    expect(sim.cheat()[1].length).to.equal(1)
    const eng = new MainEngine(sim, [])
    const qubit = eng.allocateQubit()

    // one qubit has been allocated
    expect(Object.keys(sim.cheat()[0]).length).to.equal(1)
    expect(sim.cheat()[0][0]).to.equal(0)

    console.log(sim.cheat()[1])
    expect(sim.cheat()[1].length).to.equal(1)
    expect(math.deepEqual(sim.cheat()[1][0], math.complex(1, 0))).to.equal(true)

    qubit[0].deallocate()
    // should be empty:
    expect(Object.keys(sim.cheat()[0]).length).to.equal(0)
    // state vector should only have 1 entry:
    expect(len(sim.cheat()[1])).to.equal(1)
  });

  it('should test_simulator_functional_measurement', () => {
    const sim = new Simulator()

    const eng = new MainEngine(sim, [])
    const qubits = eng.allocateQureg(5)
    // entangle all qubits:
    H.or(qubits[0])
    qubits.slice(1).forEach((qb) => {
      CNOT.or(tuple(qubits[0], qb))
    })

    new All(Measure).or(qubits)

    const bit_value_sum = qubits.reduce((accu, current) => accu + current.toNumber(), 0)
    expect(bit_value_sum === 0 || bit_value_sum === 5).to.equal(true)
  });

  it('should test_simulator_measure_mapped_qubit', () => {
    const sim = new Simulator()

    const eng = new MainEngine(sim, [])
    const qb1 = new BasicQubit(eng, 1)
    const qb2 = new BasicQubit(eng, 2)
    const cmd0 = new Command(eng, Allocate, tuple([qb1]))
    const cmd1 = new Command(eng, X, tuple([qb1]))
    const cmd2 = new Command(eng, Measure, tuple([qb1]), [], [new LogicalQubitIDTag(2)])

    expect(() => qb1.toNumber()).to.throw(NotYetMeasuredError)
    expect(() => qb2.toNumber()).to.throw(NotYetMeasuredError)
    eng.send([cmd0, cmd1, cmd2])
    eng.flush()

    expect(() => qb1.toNumber()).to.throw(NotYetMeasuredError)
    expect(qb2.toNumber()).to.equal(1)
  });


  class Plus2Gate extends BasicMathGate {
    constructor() {
      super(x => tuple(x + 2))
    }
  }

  it('should test_simulator_emulation', () => {
    const sim = new Simulator()

    const eng = new MainEngine(sim, [])
    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const qubit3 = eng.allocateQubit()

    Control(eng, qubit3, () => new Plus2Gate().or(tuple(qubit1.concat(qubit2))))

    expect(math.equal(sim.cheat()[1][0], math.complex(1, 0))).to.equal(true)

    X.or(qubit3)

    Control(eng, qubit3, () => new Plus2Gate().or(tuple(qubit1.concat(qubit2))))
    expect(sim.cheat()[1][6]).to.equal(true)

    new All(Measure).or(tuple(qubit1.concat(qubit2).concat(qubit3)))
  });

  it('should test_simulator_kqubit_gate', () => {
    const sim = new Simulator()
    const m1 = new Rx(0.3).matrix
    const m2 = new Rx(0.8).matrix
    const m3 = new Ry(0.1).matrix
    const m4 = math.multiply(new Rz(0.9).matrix, new Ry(-0.1).matrix)
    const m = math.kron(m4, math.kron(m3, math.kron(m2, m1)))

    class KQubitGate extends BasicGate {
      get matrix() {
        return m
      }
    }

    const eng = new MainEngine(sim, [])
    const qureg = eng.allocateQureg(4)
    const qubit = eng.allocateQubit()
    new Rx(-0.3).or(qureg[0])
    new Rx(-0.8).or(qureg[1])
    new Ry(-0.1).or(qureg[2])
    new Rz(-0.9).or(qureg[3])
    new Ry(0.1).or(qureg[3])
    X.or(qubit)
    Control(eng, qubit, () => new KQubitGate().or(qureg))

    X.or(qubit)

    Control(eng, qubit, () => Dagger(eng, () => new KQubitGate().or(qureg)))

    expect(sim.getAmplitude('00000', qubit.concat(qureg))).to.equal(1)

    class LargerGate extends BasicGate {
      get matrix() {
        return math.identiy(2 ** 6)
      }
    }

    expect(() => new LargerGate().or(tuple(qureg.concat(qubit)))).to.throw()
  });

  it('should test_simulator_kqubit_exception', () => {
    const sim = new Simulator()

    const m1 = new Rx(0.3).matrix
    const m2 = new Rx(0.8).matrix
    const m3 = new Ry(0.1).matrix
    const m4 = math.multiply(new Rz(0.9).matrix, new Ry(-0.1).matrix)
    const m = math.kron(m4, math.kron(m3, math.kron(m2, m1)))

    class KQubitGate extends BasicGate {
      get matrix() {
        return m
      }
    }

    const eng = new MainEngine(sim, [])
    const qureg = eng.allocateQureg(3)
    expect(() => new KQubitGate().or(qureg)).to.throw()
    expect(() => H.or(qureg)).to.throw()
  });

  it('should test_simulator_probability', () => {
    const sim = new Simulator()
    const mapper = new TrivialMapper()
    const engine_list = [new LocalOptimizer()]
    if (mapper) {
      engine_list.push(mapper)
    }

    const eng = new MainEngine(sim, engine_list)
    const qubits = eng.allocateQureg(6)
    new All(H).or(qubits)
    eng.flush()
    const bits = [0, 0, 1, 0, 1, 0]
    for (let i = 0; i < 6; ++i) {
      expect(eng.backend.getProbability(bits.slice(0, i), qubits.slice(0, i))).to.equal(0.5 ** i)
    }

    const extra_qubit = eng.allocateQubit()
    expect(() => eng.backend.getProbability([0], extra_qubit)).to.throw()

    extra_qubit.deallocate()
    new All(H).or(qubits)
    new Ry(2 * math.acos(math.sqrt(0.3))).or(qubits[0])
    eng.flush()
    expect(eng.backend.getProbability([0], [qubits[0]])).to.equal(0.3)

    new Ry(2 * math.acos(math.sqrt(0.4))).or(qubits[2])
    eng.flush()
    expect(eng.backend.getProbability([0], [qubits[2]])).to.equal(0.4)

    expect(eng.backend.getProbability([0, 0], [qubits[0], qubits[2]])).to.equal(0.12)
    expect(eng.backend.getProbability([0, 1], [qubits[0], qubits[2]])).to.equal(0.18)
    expect(eng.backend.getProbability([1, 0], [qubits[0], qubits[2]])).to.equal(0.28)
    new All(Measure).or(qubits)
  });

  it('should test_simulator_amplitude', () => {
    const engine_list = [new LocalOptimizer()]
    engine_list.push(new TrivialMapper())

    const eng = new MainEngine(new Simulator(), engine_list)
    const qubits = eng.allocateQureg(6)
    new All(X).or(qubits)
    new All(H).or(qubits)
    eng.flush()
    let bits = [0, 0, 1, 0, 1, 0]
    expect(math.equal(eng.backend.getAmplitude(bits, qubits), math.complex(1.0 / 8, 0))).to.equal(true)
    bits = [0, 0, 0, 0, 1, 0]
    expect(math.equal(eng.backend.getAmplitude(bits, qubits), math.complex(-1.0 / 8, 0))).to.equal(true)
    bits = [0, 1, 1, 0, 1, 0]
    expect(math.equal(eng.backend.getAmplitude(bits, qubits), math.complex(-1.0 / 8, 0))).to.equal(true)
    new All(H).or(qubits)
    new All(X).or(qubits)
    new Ry(2 * math.acos(0.3)).or(qubits[0])
    eng.flush()
    bits = [0, 0, 0, 0, 0, 0]
    expect(math.equal(eng.backend.getAmplitude(bits, qubits), math.complex(0.3, 0))).to.equal(true)
    bits[0] = 1
    expect(math.equal(eng.backend.getAmplitude(bits, qubits), math.complex(math.sqrt(0.91), 0))).to.equal(true)

    new All(Measure).or(qubits)
    // raises if not all qubits are in the list:
    expect(() => eng.backend.getAmplitude(bits, qubits.slice(0, qubits.length - 1))).to.throw()

    // doesn't just check for length:
    expect(() => eng.backend.getAmplitude(bits, qubits.slice(0, qubits.length - 1).concat(qubits[0]))).to.throw()
    const extra_qubit = eng.allocateQubit()
    eng.flush()
    // there is a new qubit now!
    expect(() => eng.backend.getAmplitude(bits, qubits)).to.throw()
  });

  it('should test_simulator_expectation', () => {
    const sim = new Simulator()
    const mapper = new TrivialMapper()
    const engine_list = [mapper]

    const eng = new MainEngine(sim, engine_list)
    const qureg = eng.allocateQureg(3)
    const op0 = new QubitOperator('Z0')
    let expectation = sim.getExpectationValue(op0, qureg)
    expect(expectation).to.equal(1)

    X.or(qureg[0])
    expectation = sim.getExpectationValue(op0, qureg)
    expect(expectation).to.equal(1)

    H.or(qureg[0])
    const op1 = QubitOperator('X0')
    expectation = sim.getExpectationValue(op1, qureg)
    expect(expectation).to.equal(-1)

    Z.or(qureg[0])
    expectation = sim.getExpectationValue(op1, qureg)
    expect(expectation).to.equal(1)

    X.or(qureg[0])
    S.or(qureg[0])
    Z.or(qureg[0])
    X.or(qureg[0])

    const op2 = QubitOperator('Y0')
    expectation = sim.getExpectationValue(op2, qureg)
    expect(expectation).to.equal(1)

    Z.or(qureg[0])
    expectation = sim.getExpectationValue(op2, qureg)
    expect(expectation).to.equal(-1)

    let op_sum = new QubitOperator('Y0 X1 Z2').add(new QubitOperator('X1'))
    H.or(qureg[1])
    X.or(qureg[2])
    expectation = sim.getExpectationValue(op_sum, qureg)

    expect(expectation).to.equal(2)

    op_sum = new QubitOperator('Y0 X1 Z2').add(new QubitOperator('X1'))
    X.or(qureg[2])
    expectation = sim.getExpectationValue(op_sum, qureg)

    expect(expectation).to.equal(0)

    const op_id = new QubitOperator([]).mul(0.4)
    expectation = sim.getExpectationValue(op_id, qureg)
    expect(expectation).to.equal(0.4)
  });
})


// def (sim, mapper):

//
//
// def test_simulator_expectation_exception(sim):
// eng = MainEngine(sim, [])
// qureg = eng.allocateQureg(3)
// op = QubitOperator('Z2')
// sim.get_expectation_value(op, qureg)
// op2 = QubitOperator('Z3')
// with pytest.raises(Exception):
// sim.get_expectation_value(op2, qureg)
// op3 = QubitOperator('Z1') + QubitOperator('X1 Y3')
// with pytest.raises(Exception):
// sim.get_expectation_value(op3, qureg)
//
//
// def test_simulator_applyqubitoperator_exception(sim):
// eng = MainEngine(sim, [])
// qureg = eng.allocateQureg(3)
// op = QubitOperator('Z2')
// sim.apply_qubit_operator(op, qureg)
// op2 = QubitOperator('Z3')
// with pytest.raises(Exception):
// sim.apply_qubit_operator(op2, qureg)
// op3 = QubitOperator('Z1') + QubitOperator('X1 Y3')
// with pytest.raises(Exception):
// sim.apply_qubit_operator(op3, qureg)
//
//
// def test_simulator_applyqubitoperator(sim, mapper):
// engine_list = []
// if mapper is not None:
//     engine_list.append(mapper)
// eng = MainEngine(sim, engine_list=engine_list)
// qureg = eng.allocateQureg(3)
// op = QubitOperator('X0 Y1 Z2')
// sim.apply_qubit_operator(op, qureg)
// X.or(qureg[0]
// Y.or(qureg[1]
// Z.or(qureg[2]
// assert sim.get_amplitude('000', qureg) == pytest.approx(1.)
//
// H.or(qureg[0]
// op_H = 1. / math.sqrt(2.) * (QubitOperator('X0') + QubitOperator('Z0'))
// sim.apply_qubit_operator(op_H, [qureg[0]])
// assert sim.get_amplitude('000', qureg) == pytest.approx(1.)
//
// op_Proj0 = 0.5 * (QubitOperator('') + QubitOperator('Z0'))
// op_Proj1 = 0.5 * (QubitOperator('') - QubitOperator('Z0'))
// H.or(qureg[0]
// sim.apply_qubit_operator(op_Proj0, [qureg[0]])
// assert sim.get_amplitude('000', qureg) == pytest.approx(1. / math.sqrt(2.))
// sim.apply_qubit_operator(op_Proj1, [qureg[0]])
// assert sim.get_amplitude('000', qureg) == pytest.approx(0.)
//
//
// def test_simulator_time_evolution(sim):
// N = 8  # number of qubits
// time_to_evolve = 1.1  # time to evolve for
//     eng = MainEngine(sim, [])
//   qureg = eng.allocateQureg(N)
// # initialize in random wavefunction by applying some gates:
//     for qb in qureg:
// Rx(random.random()).or(qb
// Ry(random.random()).or(qb
// eng.flush()
// # Use cheat to get initial start wavefunction:
//     qubit_to_bit_map, init_wavefunction = copy.deepcopy(eng.backend.cheat())
// Qop = QubitOperator
// op = 0.3 * Qop("X0 Y1 Z2 Y3 X4")
// op += 1.1 * Qop(())
// op += -1.4 * Qop("Y0 Z1 X3 Y5")
// op += -1.1 * Qop("Y1 X2 X3 Y4")
// ctrl_qubit = eng.allocateQubit()
// H.or(ctrl_qubit
// with Control(eng, ctrl_qubit):
// TimeEvolution(time_to_evolve, op).or(qureg
// eng.flush()
// qbit_to_bit_map, final_wavefunction = copy.deepcopy(eng.backend.cheat())
// All(Measure).or(qureg + ctrl_qubit
// # Check manually:
//
//     def build_matrix(list_single_matrices):
// res = list_single_matrices[0]
// for i in range(1, len(list_single_matrices)):
// res = scipy.sparse.kron(res, list_single_matrices[i])
// return res
// id_sp = scipy.sparse.identity(2, format="csr", dtype=complex)
// x_sp = scipy.sparse.csr_matrix([[0., 1.], [1., 0.]], dtype=complex)
// y_sp = scipy.sparse.csr_matrix([[0., -1.j], [1.j, 0.]], dtype=complex)
// z_sp = scipy.sparse.csr_matrix([[1., 0.], [0., -1.]], dtype=complex)
// gates = [x_sp, y_sp, z_sp]
//
// res_matrix = 0
// for t, c in op.terms.items():
// matrix = [id_sp] * N
// for idx, gate in t:
// matrix[qbit_to_bit_map[qureg[idx].id]] = gates[ord(gate) -
// ord('X')]
// matrix.reverse()
// res_matrix += build_matrix(matrix) * c
// res_matrix *= -1j * time_to_evolve
//
// init_wavefunction = math.array(init_wavefunction, copy=False)
// final_wavefunction = math.array(final_wavefunction, copy=False)
// res = scipy.sparse.linalg.expm_multiply(res_matrix, init_wavefunction)
//
// half = int(len(final_wavefunction) / 2)
// hadamard_f = 1. / math.sqrt(2.)
// # check evolution and control
// assert math.allclose(hadamard_f * res, final_wavefunction[half:])
// assert math.allclose(final_wavefunction[:half], hadamard_f *
// init_wavefunction)
//
//
// def test_simulator_set_wavefunction(sim, mapper):
// engine_list = [LocalOptimizer()]
// if mapper is not None:
//     engine_list.append(mapper)
// eng = MainEngine(sim, engine_list=engine_list)
// qubits = eng.allocateQureg(2)
// wf = [0., 0., math.sqrt(0.2), math.sqrt(0.8)]
// with pytest.raises(RuntimeError):
// eng.backend.set_wavefunction(wf, qubits)
// eng.flush()
// eng.backend.set_wavefunction(wf, qubits)
// assert pytest.approx(eng.backend.getProbability('1', [qubits[0]])) == .8
// assert pytest.approx(eng.backend.getProbability('01', qubits)) == .2
// assert pytest.approx(eng.backend.getProbability('1', [qubits[1]])) == 1.
// All(Measure).or(qubits
//
//
// def test_simulator_set_wavefunction_always_complex(sim):
// """ Checks that wavefunction is always complex """
// eng = MainEngine(sim)
// qubit = eng.allocateQubit()
// eng.flush()
// wf = [1., 0]
// eng.backend.set_wavefunction(wf, qubit)
// Y.or(qubit
// eng.flush()
// assert eng.backend.get_amplitude('1', qubit) == pytest.approx(1j)
//
//
// def test_simulator_collapse_wavefunction(sim, mapper):
// engine_list = [LocalOptimizer()]
// if mapper is not None:
//     engine_list.append(mapper)
// eng = MainEngine(sim, engine_list=engine_list)
// qubits = eng.allocateQureg(4)
// # unknown qubits: raises
// with pytest.raises(RuntimeError):
// eng.backend.collapse_wavefunction(qubits, [0] * 4)
// eng.flush()
// eng.backend.collapse_wavefunction(qubits, [0] * 4)
// assert pytest.approx(eng.backend.getProbability([0] * 4, qubits)) == 1.
// All(H).or(qubits[1:]
// eng.flush()
// assert pytest.approx(eng.backend.getProbability([0] * 4, qubits)) == .125
// # impossible outcome: raises
// with pytest.raises(RuntimeError):
// eng.backend.collapse_wavefunction(qubits, [1] + [0] * 3)
// eng.backend.collapse_wavefunction(qubits[:-1], [0, 1, 0])
// probability = eng.backend.getProbability([0, 1, 0, 1], qubits)
// assert probability == pytest.approx(.5)
// eng.backend.set_wavefunction([1.] + [0.] * 15, qubits)
// H.or(qubits[0]
// CNOT.or((qubits[0], qubits[1])
// eng.flush()
// eng.backend.collapse_wavefunction([qubits[0]], [1])
// probability = eng.backend.getProbability([1, 1], qubits[0:2])
// assert probability == pytest.approx(1.)
//
//
// def test_simulator_no_uncompute_exception(sim):
// eng = MainEngine(sim, [])
// qubit = eng.allocateQubit()
// H.or(qubit
// with pytest.raises(RuntimeError):
// qubit[0].__del__()
// # If you wanted to keep using the qubit, you shouldn't have deleted it.
// assert qubit[0].id == -1
//
//
// class MockSimulatorBackend(object):
// def __init__(self):
// self.run_cnt = 0
//
// def run(self):
// self.run_cnt += 1
//
//
// def test_simulator_flush():
// sim = Simulator()
// sim._simulator = MockSimulatorBackend()
//
// eng = MainEngine(sim)
// eng.flush()
//
// assert sim._simulator.run_cnt == 1
//
//
// def test_simulator_send():
// sim = Simulator()
// backend = DummyEngine(save_commands=True)
//
// eng = MainEngine(backend, [sim])
//
// qubit = eng.allocateQubit()
// H.or(qubit
// Measure.or(qubit
// del qubit
// eng.flush()
//
// assert len(backend.received_commands) == 5
//
//
// def test_simulator_functional_entangle(sim):
// eng = MainEngine(sim, [])
// qubits = eng.allocateQureg(5)
// # entangle all qubits:
//     H.or(qubits[0]
// for qb in qubits[1:]:
// CNOT.or((qubits[0], qb)
//
// # check the state vector:
//     assert .5 == pytest.approx(abs(sim.cheat()[1][0])**2)
// assert .5 == pytest.approx(abs(sim.cheat()[1][31])**2)
// for i in range(1, 31):
// assert 0. == pytest.approx(abs(sim.cheat()[1][i]))
//
// # unentangle all except the first 2
// for qb in qubits[2:]:
// CNOT.or((qubits[0], qb)
//
// # entangle using Toffolis
// for qb in qubits[2:]:
// Toffoli.or((qubits[0], qubits[1], qb)
//
// # check the state vector:
//     assert .5 == pytest.approx(abs(sim.cheat()[1][0])**2)
// assert .5 == pytest.approx(abs(sim.cheat()[1][31])**2)
// for i in range(1, 31):
// assert 0. == pytest.approx(abs(sim.cheat()[1][i]))
//
// # uncompute using multi-controlled NOTs
// with Control(eng, qubits[0:-1]):
// X.or(qubits[-1]
// with Control(eng, qubits[0:-2]):
// X.or(qubits[-2]
// with Control(eng, qubits[0:-3]):
// X.or(qubits[-3]
// CNOT.or((qubits[0], qubits[1])
// H.or(qubits[0]
//
// # check the state vector:
//     assert 1. == pytest.approx(abs(sim.cheat()[1][0])**2)
// for i in range(1, 32):
// assert 0. == pytest.approx(abs(sim.cheat()[1][i]))
//
// All(Measure).or(qubits
//
//
// def test_simulator_convert_logical_to_mapped_qubits(sim):
// mapper = BasicMapperEngine()
//
// def receive(command_list):
// pass
//
// mapper.receive = receive
// eng = MainEngine(sim, [mapper])
// qubit0 = eng.allocateQubit()
// qubit1 = eng.allocateQubit()
// mapper.current_mapping = {qubit0[0].id: qubit1[0].id,
//     qubit1[0].id: qubit0[0].id}
// assert (sim._convert_logical_to_mapped_qureg(qubit0 + qubit1) ==
//     qubit1 + qubit0)
