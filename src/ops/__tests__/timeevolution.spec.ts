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

import { expect } from 'chai'
import { complex, Complex, exp, deepEqual, matrix } from 'mathjs'
import QubitOperator from '@/ops/qubitoperator'
import TimeEvolution from '@/ops/timeevolution'
import { tuple } from '@/libs/util'
import { BasicGate } from '@/ops/basics'
import { MainEngine } from '@/cengines/main'
import { DummyEngine } from '@/cengines/testengine'
import { Ph } from '@/ops/gates';
import { hashArray as ha, arrayFromHash as ah } from '@/libs/term';
import { IMathGate } from '@/interfaces';

const mc = complex

describe('time evolution test', () => {
  it('should test_time_evolution_init_int_time', () => {
    const coefficients = [0.5, 2.303]
    coefficients.forEach((coefficient) => {
      const hamiltonian = new QubitOperator('X0 Z1').mul(coefficient)
      hamiltonian.iadd(new QubitOperator('Z2', 0.5))
      const gate1 = new TimeEvolution(2, hamiltonian)
      expect(gate1.hamiltonian.isClose(hamiltonian)).to.equal(true)
      expect(gate1.time).to.equal(2)
    })
  });

  it('should test_init_float_time', () => {
    const coefficients = [0.5, 2.303]
    coefficients.forEach((coefficient) => {
      const hamiltonian = new QubitOperator('X0 Z1').mul(coefficient)
      hamiltonian.iadd(new QubitOperator('Z2', 0.5))
      const gate1 = new TimeEvolution(2.1, hamiltonian)
      expect(gate1.hamiltonian.isClose(hamiltonian)).to.equal(true)
      expect(gate1.time).to.equal(2.1)
    })
  });

  it('should test_init_makes_copy', () => {
    let hamiltonian = new QubitOperator('X0 Z1')
    const gate = new TimeEvolution(2.1, hamiltonian)
    // @ts-ignore
    hamiltonian = undefined
    expect(typeof gate.hamiltonian !== 'undefined').to.equal(true)
  });

  it('should test_init_bad_time', () => {
    const hamiltonian = new QubitOperator('Z2', 0.5)
    expect(() => new TimeEvolution(mc(0, 1.5) as any, hamiltonian)).to.throw()
  });

  it('should test_init_bad_hamiltonian', () => {
    expect(() => new TimeEvolution(2, 'something else' as any)).to.throw()
  });

  it('should test_init_not_hermitian', () => {
    const hamiltonian = new QubitOperator('Z2', mc(0, 1e-12))
    expect(() => new TimeEvolution(1, hamiltonian)).to.throw()
  });

  it('should test_init_cast_complex_to_float', () => {
    const hamiltonian = new QubitOperator('Z2', mc(2, 0))
    const gate = new TimeEvolution(1, hamiltonian)
    const v = gate.hamiltonian.terms[ha(tuple([2, 'Z']))]
    expect(typeof v === 'number').to.equal(true)
    expect(v).to.equal(2.0)
  });

  it('should test_init_negative_time', () => {
    const hamiltonian = new QubitOperator('Z2', 2)
    const gate = new TimeEvolution(-1, hamiltonian)
    expect(gate.time).to.equal(-1)
  });

  it('should test_get_inverse', () => {
    const hamiltonian = new QubitOperator('Z2', 2)
    const gate = new TimeEvolution(2, hamiltonian)
    const inverse = gate.getInverse()
    expect(gate.time).to.equal(2)
    expect(gate.hamiltonian.isClose(hamiltonian)).to.equal(true)
    expect(inverse.time).to.equal(-2)
    expect(inverse.hamiltonian.isClose(hamiltonian)).to.equal(true)
  });

  it('should test_get_merged_one_term', () => {
    const hamiltonian = new QubitOperator('Z2', 2)
    const gate = new TimeEvolution(2, hamiltonian)
    const hamiltonian2 = new QubitOperator('Z2', 4)
    const gate2 = new TimeEvolution(5, hamiltonian2)
    const merged = gate.getMerged(gate2) as TimeEvolution;
    // This is not a requirement, the hamiltonian could also be the other
    // if we change implementation
    expect(merged.hamiltonian.isClose(hamiltonian)).to.equal(true)
    expect(merged.time).to.equal(12)
  });

  it('should test_get_merged_multiple_terms', () => {
    const hamiltonian = new QubitOperator('Z2', 2)
    hamiltonian.iadd(new QubitOperator('X3', 1))
    const gate = new TimeEvolution(2, hamiltonian)
    const hamiltonian2 = new QubitOperator('Z2', 4)
    hamiltonian2.iadd(new QubitOperator('X3', 2 + 1e-10))
    const gate2 = new TimeEvolution(5, hamiltonian2)
    const merged = gate.getMerged(gate2) as TimeEvolution;
    // This is not a requirement, the hamiltonian could also be the other
    // if we change implementation
    expect(merged.hamiltonian.isClose(hamiltonian)).to.equal(true)
    expect(merged.time).to.equal(12)
  });

  it('should test_get_merged_not_close_enough', () => {
    const hamiltonian = new QubitOperator('Z2', 2)
    hamiltonian.iadd(new QubitOperator('X3', 1))
    const gate = new TimeEvolution(2, hamiltonian)
    const hamiltonian2 = new QubitOperator('Z2', 4)
    hamiltonian2.iadd(new QubitOperator('X3', 2 + 1e-8))
    const gate2 = new TimeEvolution(5, hamiltonian2)
    expect(() => gate.getMerged(gate2)).to.throw()
  });

  it('should test_get_merged_bad_gate', () => {
    const hamiltonian = new QubitOperator('Z2', 2)
    const gate = new TimeEvolution(2, hamiltonian)
    const other = new BasicGate()
    expect(() => gate.getMerged(other)).to.throw()
  });

  it('should test_get_merged_different_hamiltonian', () => {
    const hamiltonian = new QubitOperator('Z2', 2)
    const gate = new TimeEvolution(2, hamiltonian)
    const hamiltonian2 = new QubitOperator('Y2', 2)
    const gate2 = new TimeEvolution(2, hamiltonian2)
    expect(() => gate.getMerged(gate2)).to.throw()
  });

  it('should test_or_one_qubit', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qubit = eng.allocateQubit()
    const hamiltonian = new QubitOperator('Z0', 2)
    new TimeEvolution(2.1, hamiltonian).or(qubit[0])
    new TimeEvolution(3, hamiltonian).or(tuple(qubit[0]))
    eng.flush()

    const cmd1 = saving_backend.receivedCommands[1]
    expect((cmd1.gate as TimeEvolution).hamiltonian.isClose(hamiltonian)).to.equal(true)
    expect((cmd1.gate as TimeEvolution).time).to.equal(2.1)
    expect(cmd1.qubits.length === 1 && cmd1.qubits[0].length === 1).to.equal(true)
    expect(cmd1.qubits[0][0].id === qubit[0].id).to.equal(true)

    const cmd2 = saving_backend.receivedCommands[2]

    expect((cmd2.gate as TimeEvolution).hamiltonian.isClose(hamiltonian)).to.equal(true)
    expect((cmd2.gate as TimeEvolution).time).to.equal(3)
    expect(cmd2.qubits.length === 1 && cmd2.qubits[0].length === 1).to.equal(true)
    expect(cmd2.qubits[0][0].id === qubit[0].id).to.equal(true)
  });

  it('should test_eq_not_implemented', () => {
    const hamiltonian = new QubitOperator('X0 Z1')
    const gate = new TimeEvolution(2.1, hamiltonian)
    expect(() => gate.equal()).to.throw()
  });

  it('should test string', () => {
    const hamiltonian = new QubitOperator('X0 Z1')
    hamiltonian.iadd(new QubitOperator('Y1', 0.5))
    const gate = new TimeEvolution(2.1, hamiltonian)
    expect(gate.toString() === 'exp(-2.1j * (0.5 Y1 +\n1 X0 Z1))' || gate.toString() === 'exp(-2.1j * (1 X0 Z1 +\n0.5 Y1))').to.equal(true)
  });

  it('should test_or_one_qureg', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qureg = eng.allocateQureg(5)
    const hamiltonian = new QubitOperator('X0 Z4', 2)
    new TimeEvolution(2.1, hamiltonian).or(qureg)
    new TimeEvolution(3, hamiltonian).or(tuple(qureg))
    eng.flush()

    const rescaled_h = new QubitOperator('X0 Z1', 2)
    const cmd1 = saving_backend.receivedCommands[5]
    expect((cmd1.gate as TimeEvolution).hamiltonian.isClose(rescaled_h)).to.equal(true)
    expect((cmd1.gate as TimeEvolution).time).to.equal(2.1)
    expect(cmd1.qubits.length === 1 && cmd1.qubits[0].length === 2).to.equal(true)
    expect(cmd1.qubits[0][0].id === qureg[0].id).to.equal(true)
    expect(cmd1.qubits[0][1].id === qureg[4].id).to.equal(true)

    const cmd2 = saving_backend.receivedCommands[6]
    expect((cmd2.gate as TimeEvolution).hamiltonian.isClose(rescaled_h)).to.equal(true)
    expect((cmd2.gate as TimeEvolution).time).to.equal(3)
    expect(cmd2.qubits.length === 1 && cmd2.qubits[0].length === 2).to.equal(true)
    expect(cmd2.qubits[0][0].id === qureg[0].id).to.equal(true)
    expect(cmd2.qubits[0][1].id === qureg[4].id).to.equal(true)
  });

  it('should test_or_two_qubits_error', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qureg = eng.allocateQureg(2)
    const hamiltonian = new QubitOperator('Z0', 2)
    expect(() => new TimeEvolution(2.1, hamiltonian).or(tuple(qureg[0], qureg[1]))).to.throw()
  });

  it('should test_or_two_quregs_error', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qureg = eng.allocateQureg(2)
    const qureg2 = eng.allocateQureg(2)
    const hamiltonian = new QubitOperator('Z0', 2)
    expect(() => new TimeEvolution(2.1, hamiltonian).or(tuple(qureg, qureg2))).to.throw()
  });

  it('should test_or_not_enough_qubits', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qureg = eng.allocateQureg(2)
    const hamiltonian = new QubitOperator('Z0 X3', 2)
    expect(() => new TimeEvolution(2.1, hamiltonian).or(qureg)).to.throw()
  });

  it('should test_or_multiple_terms', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qureg = eng.allocateQureg(4)
    const hamiltonian = new QubitOperator('X0 Z3', 2)
    hamiltonian.iadd(new QubitOperator('Y1', 0.5))
    new TimeEvolution(2.1, hamiltonian).or(qureg)
    eng.flush()

    const rescaled_h = new QubitOperator('X0 Z2', 2)
    rescaled_h.iadd(new QubitOperator('Y1', 0.5))

    const cmd1 = saving_backend.receivedCommands[4]
    expect((cmd1.gate as TimeEvolution).hamiltonian.isClose(rescaled_h)).to.equal(true)
    expect((cmd1.gate as TimeEvolution).time).to.equal(2.1)
    expect(cmd1.qubits.length === 1 && cmd1.qubits[0].length === 3).to.equal(true)

    expect(cmd1.qubits[0][0].id === qureg[0].id).to.equal(true)
    expect(cmd1.qubits[0][1].id === qureg[1].id).to.equal(true)
    expect(cmd1.qubits[0][2].id === qureg[3].id).to.equal(true)
  });

  it('should test_or_gate_not_mutated', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qureg = eng.allocateQureg(4)
    const hamiltonian = new QubitOperator('X0 Z3', 2)
    hamiltonian.iadd(new QubitOperator('Y1', 0.5))
    const correct_h = hamiltonian.copy()
    const gate = new TimeEvolution(2.1, hamiltonian)
    gate.or(qureg)
    eng.flush()

    expect(gate.hamiltonian.isClose(correct_h)).to.equal(true)
    expect(gate.time).to.equal(2.1)
  });

  it('should test_or_gate_identity', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qureg = eng.allocateQureg(4)
    const hamiltonian = new QubitOperator([], 3.4)
    const correct_h = hamiltonian.copy()
    const gate = new TimeEvolution(2.1, hamiltonian)
    gate.or(qureg)
    eng.flush()
    const cmd = saving_backend.receivedCommands[4]

    expect(cmd.gate instanceof Ph).to.equal(true)
    expect(cmd.gate.equal(new Ph(-3.4 * 2.1))).to.equal(true)
    const correct = matrix([
      [exp(mc(0, -3.4 * 2.1)), 0] as any,
      [0, exp(mc(0, -3.4 * 2.1))]])

    expect(deepEqual((cmd.gate as IMathGate).matrix, correct)).to.equal(true)
  });
})
