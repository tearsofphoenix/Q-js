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
import Command from '../../ops/command';
import {LogicalQubitIDTag} from '../../meta/tag';
import {NotYetMeasuredError} from '../../meta/error';
import {Control} from '../../meta/control';
import {Dagger} from '../../meta/dagger';
import LocalOptimizer from '../../cengines/optimize';
import QubitOperator, {stringToArray} from '../../ops/qubitoperator';
import BasicMapperEngine from '../../cengines/basicmapper'
import TimeEvolution from '../../ops/timeevolution';

/**
 *
 * @param m {Matrix}
 * @param idx {Number}
 * @returns {Complex}
 */
function getMatrixValue(m, idx) {
  let v
  if (m.subset) {
    v = m.subset(math.index(idx))
  } else {
    v = m[idx]
  }
  if (typeof v === 'number') {
    v = math.complex(v, 0)
  }
  return v
}

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

class Plus2Gate extends BasicMathGate {
  constructor() {
    super((x) => {
      return [x + 2]
    })
  }
}

function convertNativeMatrix(vec) {
  const m = math.zeros(vec.length)
  vec.forEach((val, idx) => {
    m.subset(math.index(idx), math.complex(val.re, val.im))
  })
  return m
}

const settings = [
  ['CPP Simulator Test', false, null, false],
  ['JS Simulator Test', false, null, true]
]

settings.forEach(([testName, gate_fusion, rndSeed, forceSimulation]) => {
  describe(testName, () => {
    it('should test_simulator_is_available', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)

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
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)

      // cheat function should return a tuple
      expect(Array.isArray(sim.cheat())).to.equal(true)
      // first entry is the qubit mapping.
      // should be empty:

      expect(Object.keys(sim.cheat()[0]).length).to.equal(0)
      // state vector should only have 1 entry:
      expect(len(sim.cheat()[1])).to.equal(1)
      const eng = new MainEngine(sim, [])
      const qubit = eng.allocateQubit()

      // one qubit has been allocated
      expect(len(sim.cheat()[0])).to.equal(1)
      expect(sim.cheat()[0][0]).to.equal(0)

      expect(len(sim.cheat()[1])).to.equal(2)
      const v = getMatrixValue(sim.cheat()[1], 0)

      expect(v.re).to.equal(1)
      expect(v.im).to.equal(0)

      qubit[0].deallocate()
      // should be empty:
      expect(Object.keys(sim.cheat()[0]).length).to.equal(0)
      // state vector should only have 1 entry:
      expect(len(sim.cheat()[1])).to.equal(1)
    });

    it('should test_simulator_functional_measurement', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)

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
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)

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

    it('should test_simulator_emulation', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)

      const eng = new MainEngine(sim, [])
      const qubit1 = eng.allocateQubit()
      const qubit2 = eng.allocateQubit()
      const qubit3 = eng.allocateQubit()

      Control(eng, qubit3, () => new Plus2Gate().or(tuple(qubit1.concat(qubit2))))

      let v = getMatrixValue(sim.cheat()[1], 0)
      expect(v.re).to.equal(1)
      X.or(qubit3)
      Control(eng, qubit3, () => new Plus2Gate().or(tuple(qubit1.concat(qubit2))))
      v = getMatrixValue(sim.cheat()[1], 6)
      expect(v.re).to.equal(1)
      expect(v.im).to.equal(0)

      new All(Measure).or(tuple(qubit1.concat(qubit2).concat(qubit3)))
    });

    it('should test_simulator_kqubit_gate', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
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

      expect(sim.getAmplitude('00000', qubit.concat(qureg)).re).to.be.closeTo(1, 1e-12)

      class LargerGate extends BasicGate {
        get matrix() {
          return math.identiy(2 ** 6)
        }
      }

      expect(() => new LargerGate().or(tuple(qureg.concat(qubit)))).to.throw()
    });

    it('should test_simulator_kqubit_exception', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)

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
      const mp = new TrivialMapper()

      const test = (mapper) => {
        const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)

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
          expect(eng.backend.getProbability(bits.slice(0, i), qubits.slice(0, i))).to.be.closeTo(0.5 ** i, 1e-12)
        }

        const extra_qubit = eng.allocateQubit()
        expect(() => eng.backend.getProbability([0], extra_qubit)).to.throw()

        extra_qubit.deallocate()
        new All(H).or(qubits)
        new Ry(2 * math.acos(math.sqrt(0.3))).or(qubits[0])
        eng.flush()
        expect(eng.backend.getProbability([0], [qubits[0]])).to.be.closeTo(0.3, 1e-12)

        new Ry(2 * math.acos(math.sqrt(0.4))).or(qubits[2])
        eng.flush()
        expect(eng.backend.getProbability([0], [qubits[2]])).to.be.closeTo(0.4, 1e-12)

        expect(eng.backend.getProbability([0, 0], [qubits[0], qubits[2]])).to.be.closeTo(0.12, 1e-12)
        expect(eng.backend.getProbability([0, 1], [qubits[0], qubits[2]])).to.be.closeTo(0.18, 1e-12)
        expect(eng.backend.getProbability([1, 0], [qubits[0], qubits[2]])).to.be.closeTo(0.28, 1e-12)
        new All(Measure).or(qubits)
      }

      test(mp)
      test()
    });

    it('should test_simulator_amplitude', () => {
      const mp = new TrivialMapper()
      const test = (mapper) => {
        const engine_list = [new LocalOptimizer()]
        if (mapper) {
          engine_list.push(mapper)
        }

        const eng = new MainEngine(new Simulator(gate_fusion, rndSeed, forceSimulation), engine_list)
        const qubits = eng.allocateQureg(6)
        new All(X).or(qubits)
        new All(H).or(qubits)
        eng.flush()
        let bits = [0, 0, 1, 0, 1, 0]
        expect(eng.backend.getAmplitude(bits, qubits).re).to.be.closeTo(1.0 / 8, 1e-12)
        bits = [0, 0, 0, 0, 1, 0]

        expect(eng.backend.getAmplitude(bits, qubits).re).to.be.closeTo(-1.0 / 8, 1e-12)
        bits = [0, 1, 1, 0, 1, 0]
        expect(eng.backend.getAmplitude(bits, qubits).re).to.be.closeTo(-1.0 / 8, 1e-12)
        new All(H).or(qubits)
        new All(X).or(qubits)
        new Ry(2 * math.acos(0.3)).or(qubits[0])
        eng.flush()
        bits = [0, 0, 0, 0, 0, 0]
        expect(eng.backend.getAmplitude(bits, qubits).re).to.be.closeTo(0.3, 1e-12)
        bits[0] = 1
        expect(eng.backend.getAmplitude(bits, qubits).re).to.be.closeTo(math.sqrt(0.91), 1e-12)

        new All(Measure).or(qubits)
        // raises if not all qubits are in the list:
        expect(() => eng.backend.getAmplitude(bits, qubits.slice(0, qubits.length - 1))).to.throw()

        // doesn't just check for length:
        expect(() => eng.backend.getAmplitude(bits, qubits.slice(0, qubits.length - 1).concat(qubits[0]))).to.throw()
        const extra_qubit = eng.allocateQubit()
        eng.flush()
        // there is a new qubit now!
        expect(() => eng.backend.getAmplitude(bits, qubits)).to.throw()
      }
      test(mp)
      test()
    });

    it('should test_simulator_expectation', () => {
      const mp = new TrivialMapper()

      const test = (mapper) => {
        const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
        const engine_list = mapper ? [mapper] : []

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
      }
      test(mp)
      test()
    });

    it('should test_simulator_expectation_exception', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
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
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
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
      const mp = new TrivialMapper()

      const test = (mapper) => {
        const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
        const engine_list = mapper ? [mapper] : []

        const eng = new MainEngine(sim, engine_list)
        const qureg = eng.allocateQureg(3)
        let v = sim.cheat()
        const op = new QubitOperator('X0 Y1 Z2')
        sim.applyQubitOperator(op, qureg)
        v = sim.cheat()
        X.or(qureg[0])
        v = sim.cheat()
        Y.or(qureg[1])
        v = sim.cheat()
        Z.or(qureg[2])
        v = sim.cheat()
        let ret = sim.getAmplitude('000', qureg)
        v = sim.cheat()
        expect(ret.re).to.be.closeTo(1, 1e-12)

        H.or(qureg[0])
        const op_H = (new QubitOperator('X0').add(new QubitOperator('Z0'))).mul(1.0 / math.sqrt(2.0))
        sim.applyQubitOperator(op_H, [qureg[0]])

        ret = sim.getAmplitude('000', qureg)
        expect(ret.re).to.be.closeTo(1, 1e-12)

        const op_Proj0 = new QubitOperator('').add(new QubitOperator('Z0')).mul(0.5)
        const op_Proj1 = new QubitOperator('').sub(new QubitOperator('Z0')).mul(0.5)
        H.or(qureg[0])
        sim.applyQubitOperator(op_Proj0, [qureg[0]])

        ret = sim.getAmplitude('000', qureg)
        expect(ret.re).to.be.closeTo(1.0 / math.sqrt(2.0), 1e-12)
        sim.applyQubitOperator(op_Proj1, [qureg[0]])

        ret = sim.getAmplitude('000', qureg)
        expect(ret.re).to.be.closeTo(0, 1e-12)
      }

      test(mp)
      test()
    });

    it('should test_simulator_time_evolution', function () {
      this.timeout(600 * 1000)

      console.log('start time evolution', Date.now())

      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
      const N = 8 // number of qubits
      const time_to_evolve = 1.1 // time to evolve for
      const eng = new MainEngine(sim, [])
      const qureg = eng.allocateQureg(N)
      // initialize in random wavefunction by applying some gates:
      qureg.forEach((qb) => {
        new Rx(Math.random()).or(qb)
        new Ry(Math.random()).or(qb)
      })
      eng.flush()
      // Use cheat to get initial start wavefunction:
      let [_, init_wavefunction] = eng.backend.cheat()
      init_wavefunction = math.clone(init_wavefunction)
      const Qop = QubitOperator
      const op = new Qop('X0 Y1 Z2 Y3 X4').mul(0.3)
      op.iadd(new Qop([]).mul(1.1))
      op.iadd(new Qop('Y0 Z1 X3 Y5').mul(-1.4))
      op.iadd(new Qop('Y1 X2 X3 Y4').mul(-1.1))
      const ctrl_qubit = eng.allocateQubit()
      H.or(ctrl_qubit)
      Control(eng, ctrl_qubit, () => new TimeEvolution(time_to_evolve, op).or(qureg))
      eng.flush()
      let [qbit_to_bit_map2, final_wavefunction] = eng.backend.cheat()
      final_wavefunction = math.clone(final_wavefunction)
      const map = {}
      Object.assign(map, qbit_to_bit_map2)
      qbit_to_bit_map2 = map
      new All(Measure).or(qureg.concat(ctrl_qubit))

      console.log('end time evolution', Date.now())
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
      const gates = {X: x_sp, Y: y_sp, Z: z_sp}

      let res_matrix = 0
      Object.keys(op.terms).forEach((k) => {
        // id_sp * N
        const matrix = [id_sp, id_sp, id_sp, id_sp, id_sp, id_sp, id_sp, id_sp]
        const t = stringToArray(k)
        const c = op.terms[k]
        t.forEach(([idx, gate]) => {
          matrix[qbit_to_bit_map2[qureg[idx].id]] = gates[gate]
        })
        matrix.reverse()
        res_matrix = math.add(res_matrix, math.multiply(build_matrix(matrix), c))
      })

      res_matrix = math.multiply(res_matrix, mc(0, -time_to_evolve))

      init_wavefunction = math.flatten(init_wavefunction)
      init_wavefunction = convertNativeMatrix(init_wavefunction)
      final_wavefunction = math.flatten(final_wavefunction)
      final_wavefunction = convertNativeMatrix(final_wavefunction)

      console.log('tick', Date.now())
      const res = math.multiply(math.expm(res_matrix), init_wavefunction)
      console.log('tick', Date.now())

      const count = len(final_wavefunction)
      const half = Math.floor(count / 2)
      const hadamard_f = 1.0 / math.sqrt(2.0)
      // check evolution and control
      const tail = getMatrixValue(final_wavefunction, math.range(half, count))
      const head = getMatrixValue(final_wavefunction, math.range(0, half))

      expect(math.deepEqual(math.multiply(hadamard_f, res), tail)).to.equal(true)
      expect(math.deepEqual(head, math.multiply(hadamard_f, init_wavefunction))).to.equal(true)
    });

    it('should test_simulator_set_wavefunction', () => {
      const mp = new TrivialMapper()

      const test = (mapper) => {
        const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
        const engine_list = [new LocalOptimizer()]
        if (mapper) {
          engine_list.push(mapper)
        }

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
      }

      test(mp)
      test()
    });

    it('should test_simulator_set_wavefunction_always_complex', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
      const eng = new MainEngine(sim)
      const qubit = eng.allocateQubit()
      eng.flush()
      const wf = [1.0, 0]
      eng.backend.setWavefunction(wf, qubit)
      Y.or(qubit)
      eng.flush()
      const c = eng.backend.getAmplitude('1', qubit)
      expect(math.abs(math.complex(c.re, c.im))).to.be.closeTo(1, 1e-12)
    });

    it('should test_simulator_collapse_wavefunction', () => {
      const mp = new TrivialMapper()
      const test = (mapper) => {
        const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
        const engine_list = [new LocalOptimizer()]
        if (mapper) {
          engine_list.push(mapper)
        }

        const eng = new MainEngine(sim, engine_list)
        const qubits = eng.allocateQureg(4)
        // unknown qubits: raises
        expect(() => eng.backend.collapseWavefunction(qubits, [0, 0, 0, 0])).to.throw()
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
        expect(probability).to.be.closeTo(0.5, 1e-12)

        eng.backend.setWavefunction([1.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], qubits)
        H.or(qubits[0])
        CNOT.or(tuple(qubits[0], qubits[1]))
        eng.flush()
        eng.backend.collapseWavefunction([qubits[0]], [1])
        probability = eng.backend.getProbability([1, 1], qubits.slice(0, 2))
        expect(probability).to.be.closeTo(1, 1e-12)
      }
      test(mp)
      test()
    });

    it('should test_simulator_no_uncompute_exception', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
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

      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
      sim._simulator = new MockSimulatorBackend()

      const eng = new MainEngine(sim)
      eng.flush()

      expect(sim._simulator.run_cnt).to.equal(1)
    });

    it('should test_simulator_send', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
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
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
      const eng = new MainEngine(sim, [])
      const qubits = eng.allocateQureg(5)
      // entangle all qubits:
      H.or(qubits[0])
      qubits.slice(1).forEach(qb => CNOT.or(tuple(qubits[0], qb)))

      // check the state vector:
      let m = sim.cheat()[1]
      m = convertNativeMatrix(m)
      expect(math.abs(getMatrixValue(m, 0)) ** 2).to.be.closeTo(0.5, 1e-12)
      expect(math.abs(getMatrixValue(m, 31)) ** 2).to.be.closeTo(0.5, 1e-12)

      for (let i = 1; i < 31; ++i) {
        let v = sim.cheat()[1][i]
        v = math.complex(v.re, v.im)
        expect(math.abs(v)).to.be.closeTo(0, 1e-12)
      }

      // unentangle all except the first 2
      qubits.slice(2).forEach(qb => CNOT.or(tuple(qubits[0], qb)))

      // entangle using Toffolis
      qubits.slice(2).forEach(qb => Toffoli.or(tuple(qubits[0], qubits[1], qb)))

      // check the state vector:
      console.log(sim.cheat()[1][0], sim.cheat()[1][31])

      m = sim.cheat()[1]
      m = convertNativeMatrix(m)
      const v31 = math.re(math.abs(getMatrixValue(m, 31)))
      expect(math.re(math.abs(getMatrixValue(m, 0)))).to.be.closeTo(Math.SQRT1_2, 1e-12)
      expect(v31).to.be.closeTo(Math.SQRT1_2, 1e-12)

      for (let i = 1; i < 31; ++i) {
        let v = sim.cheat()[1][i]
        v = math.complex(v.re, v.im)
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
      let v0 = getMatrixValue(mm, 0)
      v0 = math.complex(v0.re, v0.im)
      expect(math.re(math.abs(v0))).to.be.closeTo(1, 1e-12)
      for (let i = 1; i < 32; ++i) {
        let v = sim.cheat()[1][i]
        v = math.complex(v.re, v.im)
        expect(math.re(math.abs(v))).to.be.closeTo(0, 1e-12)
      }

      new All(Measure).or(qubits)
    });

    it('should test_simulator_convert_logical_to_mapped_qubits', () => {
      const sim = new Simulator(gate_fusion, rndSeed, forceSimulation)
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
})
