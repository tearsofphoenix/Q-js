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
import {TrivialMapper} from './shared.spec'
import {BasicGate, BasicMathGate} from '../../ops/basics'
import {DummyEngine} from '../../cengines/testengine';
import MainEngine from '../../cengines/main';
import {
  Allocate, H, Measure, X, Y, Rx, Ry, Rz, Z, S
} from '../../ops/gates';
import Simulator from './simulator'
import {len} from '../../libs/polyfill';
import { CNOT, Toffoli } from '../../ops/shortcuts';
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
import BasicMapperEngine from '../../cengines/basicmapper'

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

  let sim
  before(() => sim = new Simulator())

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
    expect(len(sim.cheat()[1])).to.equal(1)
    const eng = new MainEngine(sim, [])
    const qubit = eng.allocateQubit()

    // one qubit has been allocated
    expect(len(sim.cheat()[0])).to.equal(1)
    expect(sim.cheat()[0][0]).to.equal(0)

    expect(len(sim.cheat()[1])).to.equal(2)
    expect(math.deepEqual(sim.cheat()[1].subset(math.index(0)), math.complex(1, 0))).to.equal(true)

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
    console.log(155, bit_value_sum)
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
      super(x => {
        return [x + 2]
      })
    }
  }

  it('should test_simulator_emulation', () => {
    const sim = new Simulator()

    const eng = new MainEngine(sim, [])
    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const qubit3 = eng.allocateQubit()

    Control(eng, qubit3, () => new Plus2Gate().or(tuple(qubit1.concat(qubit2))))

    expect(math.equal(sim.cheat()[1].subset(math.index(0)), 1)).to.equal(true)
    console.log(sim.cheat())
    X.or(qubit3)
    console.log(sim.cheat())
    console.log('=================')
    Control(eng, qubit3, () => new Plus2Gate().or(tuple(qubit1.concat(qubit2))))
    console.log(sim.cheat())
    expect(sim.cheat()[1].subset(math.index(6))).to.deep.equal(math.complex(1, 0))

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
    console.log('-------------------------------------------------')
    Control(eng, qubit, () => new KQubitGate().or(qureg))
    console.log('-------------------------------------------------')

    X.or(qubit)

    Control(eng, qubit, () => Dagger(eng, () => new KQubitGate().or(qureg)))

    expect(sim.getAmplitude('00000', qubit.concat(qureg))).to.be.closeTo(1, 1e-12)

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
    expect(eng.backend.getAmplitude(bits, qubits)).to.be.closeTo(1.0 / 8, 1e-12)
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
    expect(math.re(expectation)).to.equal(1)

    X.or(qureg[0])
    expectation = sim.getExpectationValue(op0, qureg)
    expect(expectation).to.equal(-1)

    H.or(qureg[0])
    const op1 = new QubitOperator('X0')
    expectation = sim.getExpectationValue(op1, qureg)
    expect(expectation).to.be.closeTo(-1, 1e-12)

    Z.or(qureg[0])
    expectation = sim.getExpectationValue(op1, qureg)
    expect(expectation).to.be.closeTo(1, 1e-12)

    X.or(qureg[0])
    S.or(qureg[0])
    Z.or(qureg[0])
    X.or(qureg[0])

    const op2 = new QubitOperator('Y0')
    expectation = sim.getExpectationValue(op2, qureg)
    expect(expectation).to.be.closeTo(1, 1e-12)

    Z.or(qureg[0])
    expectation = sim.getExpectationValue(op2, qureg)
    expect(expectation).to.be.closeTo(-1, 1e-12)

    let op_sum = new QubitOperator('Y0 X1 Z2').add(new QubitOperator('X1'))
    H.or(qureg[1])
    X.or(qureg[2])
    expectation = sim.getExpectationValue(op_sum, qureg)

    expect(expectation).to.be.closeTo(2, 1e-12)

    op_sum = new QubitOperator('Y0 X1 Z2').add(new QubitOperator('X1'))
    X.or(qureg[2])
    expectation = sim.getExpectationValue(op_sum, qureg)

    expect(expectation).to.be.closeTo(0, 1e-12)

    const op_id = new QubitOperator([]).mul(0.4)
    expectation = sim.getExpectationValue(op_id, qureg)
    expect(expectation).to.be.closeTo(0.4, 1e-12)
  });

  it('should test_simulator_expectation_exception', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [])
    const qureg = eng.allocateQureg(3)
    const op = new QubitOperator('Z2')
    sim.getExpectationValue(op, qureg)
    const op2 = new QubitOperator('Z3')
    expect(() => sim.getExpectationValue(op2, qureg)).to.throw()
    const op3 = new QubitOperator('Z1').add(new QubitOperator('X1 Y3'))
    expect(() => sim.getExpectationValue(op3, qureg)).to.throw()
  });

  it('should test_simulator_applyqubitoperator_exception', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [])
    const qureg = eng.allocateQureg(3)
    const op = new QubitOperator('Z2')
    sim.applyQubitOperator(op, qureg)
    const op2 = new QubitOperator('Z3')
    expect(() => sim.applyQubitOperator(op2, qureg)).to.throw()
    const op3 = new QubitOperator('Z1').add(new QubitOperator('X1 Y3'))
    expect(() => sim.applyQubitOperator(op3, qureg)).to.throw()
  });

  it('should test_simulator_applyqubitoperator', () => {
    const sim = new Simulator()
    const mapper = new TrivialMapper()
    const engine_list = [mapper]

    const eng = new MainEngine(sim, engine_list)
    const qureg = eng.allocateQureg(3)
    const op = new QubitOperator('X0 Y1 Z2')
    sim.applyQubitOperator(op, qureg)
    X.or(qureg[0])
    Y.or(qureg[1])
    Z.or(qureg[2])
    expect(math.abs(sim.getAmplitude('000', qureg))).to.be.closeTo(1, 1e-12)

    H.or(qureg[0])
    const op_H = (new QubitOperator('X0').add(new QubitOperator('Z0'))).mul(1.0 / math.sqrt(2.0))
    sim.applyQubitOperator(op_H, [qureg[0]])
    expect(math.abs(sim.getAmplitude('000', qureg))).to.be.closeTo(1, 1e-12)

    const op_Proj0 = (new QubitOperator('').add(new QubitOperator('Z0'))).mul(0.5)
    const op_Proj1 = (new QubitOperator('').sub(new QubitOperator('Z0'))).mul(0.5)
    H.or(qureg[0])
    sim.applyQubitOperator(op_Proj0, [qureg[0]])
    expect(math.abs(sim.getAmplitude('000', qureg))).to.be.closeTo(1.0 / math.sqrt(2.0), 1e-12)
    sim.applyQubitOperator(op_Proj1, [qureg[0]])
    expect(math.abs(sim.getAmplitude('000', qureg))).to.be.closeTo(0, 1e-12)
  });

  it('should test_simulator_time_evolution', () => {
    //     const sim = new Simulator()
    //     const N = 8  // number of qubits
    // let time_to_evolve = 1.1  // time to evolve for
    //     const eng = new MainEngine(sim, [])
    //   const qureg = eng.allocateQureg(N)
    // // initialize in random wavefunction by applying some gates:
    //     qureg.forEach(qb => {
    //       new Rx(Math.random()).or(qb)
    //       new Ry(Math.random()).or(qb)
    //     })
    // eng.flush()
    // // Use cheat to get initial start wavefunction:
    //     let [qubit_to_bit_map, init_wavefunction] = eng.backend.cheat()
    // let Qop = QubitOperator
    // let op = new Qop("X0 Y1 Z2 Y3 X4").mul(0.3)
    // op.iadd(new Qop([]).mul(1.1))
    // op.iadd(new Qop("Y0 Z1 X3 Y5").mul(-1.4))
    // op.iadd(new Qop("Y1 X2 X3 Y4").mul(-1.1))
    // const ctrl_qubit = eng.allocateQubit()
    // H.or(ctrl_qubit)
    // Control(eng, ctrl_qubit, () => new TimeEvolution(time_to_evolve, op).or(qureg))
    // eng.flush()
    // [qbit_to_bit_map, final_wavefunction] = eng.backend.cheat()
    // new All(Measure).or(qureg.concat(ctrl_qubit))
    // // Check manually:
    //
    //     const build_matrix = (list_single_matrices) => {
    //       res = list_single_matrices[0]
    //       for i in range(1, len(list_single_matrices)):
    //       res = scipy.sparse.kron(res, list_single_matrices[i])
    //       return res
    //     }
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
  });

  it('should test_simulator_set_wavefunction', () => {
    const sim = new Simulator()
    const mapper = new TrivialMapper()
    const engine_list = [new LocalOptimizer(), mapper]

    const eng = new MainEngine(sim, engine_list)
    const qubits = eng.allocateQureg(2)
    const wf = [0.0, 0.0, math.sqrt(0.2), math.sqrt(0.8)]
    expect(() => eng.backend.setWavefunction(wf, qubits)).to.throw()
    eng.flush()
    eng.backend.setWavefunction(wf, qubits)

    expect(eng.backend.getProbability('1', [qubits[0]])).to.be.closeTo(0.8, 1e-12)
    expect(eng.backend.getProbability('01', qubits)).to.be.closeTo(0.2, 1e-12)
    expect(eng.backend.getProbability('1', [qubits[1]])).to.be.closeTo(1, 1e-12)
    new All(Measure).or(qubits)
  });

  it('should test_simulator_set_wavefunction_always_complex', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim)
    const qubit = eng.allocateQubit()
    eng.flush()
    const wf = [1.0, 0]
    eng.backend.setWavefunction(wf, qubit)
    Y.or(qubit)
    eng.flush()
    expect(math.abs(eng.backend.getAmplitude('1', qubit))).to.be.closeTo(1, 1e-12)
  });

  it('should test_simulator_collapse_wavefunction', () => {
    const sim = new Simulator()
    const mapper = new TrivialMapper()
    const engine_list = [new LocalOptimizer(), mapper]

    const eng = new MainEngine(sim, engine_list)
    const qubits = eng.allocateQureg(4)
    // unknown qubits: raises
    expect(() => eng.backend.collapseWavefunction(qubits, [0] * 4)).to.throw()
    eng.flush()
    eng.backend.collapseWavefunction(qubits, [0, 0, 0, 0])
    const v = eng.backend.getProbability([0, 0, 0, 0], qubits)
    console.log(544, v)
    expect(v).to.be.closeTo(1, 1e-12)
    new All(H).or(qubits.slice(1))
    eng.flush()
    expect(eng.backend.getProbability([0, 0, 0, 0], qubits)).to.be.closeTo(0.125, 1e-12)

    // impossible outcome: raises
    expect(() => eng.backend.collapseWavefunction(qubits, [1, 0, 0, 0])).to.throw()
    eng.backend.collapseWavefunction(qubits.slice(0, qubits.length - 1), [0, 1, 0])
    let probability = eng.backend.getProbability([0, 1, 0, 1], qubits)
    expect(probability).to.be.closeTo(0.5)

    eng.backend.setWavefunction([1.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], qubits)
    H.or(qubits[0])
    CNOT.or(tuple(qubits[0], qubits[1]))
    eng.flush()
    eng.backend.collapseWavefunction([qubits[0]], [1])
    probability = eng.backend.getProbability([1, 1], qubits.slice(0, 2))
    expect(probability).to.be.closeTo(1, 1e-12)
  });

  it('should test_simulator_no_uncompute_exception', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [])
    const qubit = eng.allocateQubit()
    H.or(qubit)
    expect(() => qubit[0].deallocate()).to.throw()

    // If you wanted to keep using the qubit, you shouldn't have deleted it.
    expect(qubit[0].id).to.equal(-1)
  });

  it('should test_simulator_flush', () => {
    class MockSimulatorBackend {
      constructor() {
        this.run_cnt = 0
      }

      run() {
        this.run_cnt += 1
      }
    }

    const sim = new Simulator()
    sim._simulator = new MockSimulatorBackend()

    const eng = new MainEngine(sim)
    eng.flush()

    expect(sim._simulator.run_cnt).to.equal(1)
  });

  it('should test_simulator_send', () => {
    const sim = new Simulator()
    const backend = new DummyEngine(true)

    const eng = new MainEngine(backend, [sim])

    const qubit = eng.allocateQubit()
    H.or(qubit)
    Measure.or(qubit)
    qubit.deallocate()
    eng.flush()

    expect(len(backend.receivedCommands)).to.equal(5)
  });

  it('should test_simulator_functional_entangle', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [])
    const qubits = eng.allocateQureg(5)
    // entangle all qubits:
    H.or(qubits[0])
    qubits.slice(1).forEach(qb => CNOT.or(tuple(qubits[0], qb)))

    // check the state vector:
    let m = sim.cheat()[1]
    expect(math.abs(m.subset(math.index(0))) ** 2).to.be.closeTo(0.5, 1e-12)
    expect(math.abs(m.subset(math.index(31))) ** 2).to.be.closeTo(0.5, 1e-12)

    for (let i = 1; i < 31; ++i) {
      const v = sim.cheat()[1][i] || math.complex(0, 0)
      expect(math.abs(v)).to.be.closeTo(0, 1e-12)
    }

    // unentangle all except the first 2
    qubits.slice(2).forEach(qb => CNOT.or(tuple(qubits[0], qb)))

    // entangle using Toffolis
    qubits.slice(2).forEach(qb => Toffoli.or(tuple(qubits[0], qubits[1], qb)))

    // check the state vector:
    console.log(sim.cheat()[1][0], sim.cheat()[1][31])

    m = sim.cheat()[1]
    const v31 = math.re(math.abs(m.subset(math.index(31))))
    expect(math.re(math.abs(m.subset(math.index(0))))).to.be.closeTo(Math.SQRT1_2, 1e-12)
    expect(v31).to.be.closeTo(Math.SQRT1_2, 1e-12)

    for (let i = 1; i < 31; ++i) {
      const v = sim.cheat()[1][i] || math.complex(0, 0)
      expect(math.abs(v)).to.be.closeTo(0, 1e-12)
    }

    // uncompute using multi-controlled NOTs
    Control(eng, qubits.slice(0, qubits.length - 1), () => X.or(qubits[qubits.length - 1]))
    Control(eng, qubits.slice(0, qubits.length - 2), () => X.or(qubits[qubits.length - 2]))
    Control(eng, qubits.slice(0, qubits.length - 3), () => X.or(qubits[qubits.length - 3]))
    CNOT.or(tuple(qubits[0], qubits[1]))
    H.or(qubits[0])

    // check the state vector:
    const mm = sim.cheat()[1]
    const v0 = mm.subset(math.index(0))
    expect(math.re(math.abs(v0))).to.be.closeTo(1, 1e-12)
    for (let i = 1; i < 32; ++i) {
      const v = sim.cheat()[1][i] || math.complex(0, 0)
      expect(math.re(math.abs(v))).to.be.closeTo(0, 1e-12)
    }

    new All(Measure).or(qubits)
  });

  it('should test_simulator_convert_logical_to_mapped_qubits', () => {
    const mapper = new BasicMapperEngine()

    const receive = (command_list) => { }

    mapper.receive = receive
    const eng = new MainEngine(sim, [mapper])
    const qubit0 = eng.allocateQubit()
    const qubit1 = eng.allocateQubit()
    mapper.currentMapping = {
      [qubit0[0].id]: qubit1[0].id,
      [qubit1[0].id]: qubit0[0].id
    }
    expect(sim.convertLogicalToMappedQureg(qubit0.concat(qubit1))).to.deep.equal(qubit1.concat(qubit0))
  });
})
