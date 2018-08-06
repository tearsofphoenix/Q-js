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
import { DummyEngine } from './testengine'
import MainEngine from './main'
import IBM5QubitMapper from './ibm5qubitmapper'
import { CNOT } from '../ops/shortcuts'
import { tuple } from '../libs/util'
import IBMBackend from '../backends/ibm/ibm'
import SwapAndCNOTFlipper from './swapandcnotflipper'
import { H } from '../ops/gates'
import { All } from '../ops/metagates'

describe('ibm 5qubit mapper test', () => {
  it('should test_ibm5qubitmapper_invalid_circuit', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new IBM5QubitMapper()])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    const qb2 = eng.allocateQubit()
    const qb3 = eng.allocateQubit()
    CNOT.or(tuple(qb1, qb2))
    CNOT.or(tuple(qb0, qb1))
    CNOT.or(tuple(qb0, qb2))
    CNOT.or(tuple(qb3, qb1))
    expect(() => {
      CNOT.or(tuple(qb3, qb2))
      eng.flush()
    }).to.throw()
  });

  it('should test_ibm5qubitmapper_valid_circuit1', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new IBM5QubitMapper()])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    const qb2 = eng.allocateQubit()
    const qb3 = eng.allocateQubit()
    const qb4 = eng.allocateQubit()
    CNOT.or(tuple(qb0, qb1))
    CNOT.or(tuple(qb0, qb2))
    CNOT.or(tuple(qb0, qb3))
    CNOT.or(tuple(qb0, qb4))
    CNOT.or(tuple(qb1, qb2))
    CNOT.or(tuple(qb3, qb4))
    CNOT.or(tuple(qb4, qb3))
    eng.flush()
  });

  it('should test_ibm5qubitmapper_valid_circuit2', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new IBM5QubitMapper()])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    const qb2 = eng.allocateQubit()
    const qb3 = eng.allocateQubit()
    const qb4 = eng.allocateQubit()
    CNOT.or(tuple(qb3, qb1))
    CNOT.or(tuple(qb3, qb2))
    CNOT.or(tuple(qb3, qb0))
    CNOT.or(tuple(qb3, qb4))
    CNOT.or(tuple(qb1, qb2))
    CNOT.or(tuple(qb0, qb4))
    CNOT.or(tuple(qb2, qb1))
    eng.flush()
  });

  it('should test_ibm5qubitmapper_valid_circuit2_ibmqx4', () => {
    const backend = new DummyEngine(true)

    class FakeIBMBackend extends IBMBackend {

    }

    const fake = new FakeIBMBackend('ibmqx4', true)
    fake.receive = backend.receive
    fake.isAvailable = backend.isAvailable
    backend.isLastEngine = true

    const eng = new MainEngine(fake, [new IBM5QubitMapper()])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    const qb2 = eng.allocateQubit()
    const qb3 = eng.allocateQubit()
    const qb4 = eng.allocateQubit()
    CNOT.or(tuple(qb3, qb1))
    CNOT.or(tuple(qb3, qb2))
    CNOT.or(tuple(qb3, qb0))
    CNOT.or(tuple(qb3, qb4))
    CNOT.or(tuple(qb1, qb2))
    CNOT.or(tuple(qb0, qb4))
    CNOT.or(tuple(qb2, qb1))
    eng.flush()
  });

  it('should test_ibm5qubitmapper_optimizeifpossible', () => {
    const backend = new DummyEngine(true)
    const connectivity = new Set([[2, 1], [4, 2], [2, 0], [3, 2], [3, 4], [1, 0]])
    const eng = new MainEngine(backend, [new IBM5QubitMapper(), new SwapAndCNOTFlipper(connectivity)])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    const qb2 = eng.allocateQubit()
    const qb3 = eng.allocateQubit()
    CNOT.or(tuple(qb1, qb2))
    CNOT.or(tuple(qb2, qb1))
    CNOT.or(tuple(qb1, qb2))

    eng.flush()
    backend.receivedCommands.forEach(cmd => console.log(cmd.toString()))
    let hadamard_count = backend.receivedCommands.filter(cmd => cmd.gate.equal(H)).length

    expect(hadamard_count).to.equal(4)
    backend.receivedCommands = []

    CNOT.or(tuple(qb2, qb1))
    CNOT.or(tuple(qb1, qb2))
    CNOT.or(tuple(qb2, qb1))

    eng.flush()

    hadamard_count = backend.receivedCommands.filter(cmd => cmd.gate.equal(H)).length
    expect(hadamard_count).to.equal(4)
  });

  it('should test_ibm5qubitmapper_toomanyqubits', () => {
    const backend = new DummyEngine(true)
    const connectivity = new Set([[2, 1], [4, 2], [2, 0], [3, 2], [3, 4], [1, 0]])
    const eng = new MainEngine(backend, [new IBM5QubitMapper(), new SwapAndCNOTFlipper(connectivity)])
    const qubits = eng.allocateQureg(6)
    new All(H).or(qubits)
    CNOT.or(tuple(qubits[0], qubits[1]))
    expect(() => eng.flush()).to.throw()
  });
})
