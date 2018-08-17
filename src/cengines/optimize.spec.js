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
import LocalOptimizer from './optimize'
import {DummyEngine} from './testengine'
import MainEngine from './main'
import {tuple, instanceOf} from '../libs/util';
import {
  AllocateQubitGate, X, H, Rx
} from '../ops/gates'
import {CNOT} from '../ops/shortcuts'
import {ClassicalInstructionGate, FastForwardingGate} from '../ops/basics'

describe('optimize test', () => {
  it('should test_local_optimizer_caching', () => {
    const local_optimizer = new LocalOptimizer(4)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [local_optimizer])
    // Test that it caches for each qubit 3 gates
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    expect(backend.receivedCommands.length).to.equal(0)

    H.or(qb0)
    H.or(qb1)
    CNOT.or(tuple(qb0, qb1))

    expect(backend.receivedCommands.length).to.equal(0)

    new Rx(0.5).or(qb0)

    expect(backend.receivedCommands.length).to.equal(1)
    expect(backend.receivedCommands[0].gate.equal(new AllocateQubitGate())).to.equal(true)

    H.or(qb0)

    expect(backend.receivedCommands.length).to.equal(2)
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    // Another gate on qb0 means it needs to send CNOT but clear pipeline of qb1
    new Rx(0.6).or(qb0)

    expect(backend.receivedCommands.length).to.equal(5)
    expect(backend.receivedCommands[2].gate.equal(new AllocateQubitGate())).to.equal(true)
    expect(backend.receivedCommands[3].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[3].qubits[0][0].id).to.equal(qb1[0].id)
    expect(backend.receivedCommands[4].gate.equal(X)).to.equal(true)
    expect(backend.receivedCommands[4].controlQubits[0].id).to.equal(qb0[0].id)
    expect(backend.receivedCommands[4].qubits[0][0].id).to.equal(qb1[0].id)
  });

  it('should test_local_optimizer_flush_gate', () => {
    const local_optimizer = new LocalOptimizer(4)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [local_optimizer])
    // Test that it caches for each qubit 3 gates
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    H.or(qb0)
    H.or(qb1)

    expect(backend.receivedCommands.length).to.equal(0)
    eng.flush()
    // Two allocate gates, two H gates and one flush gate
    expect(backend.receivedCommands.length).to.equal(5)
  });

  it('should test_local_optimizer_fast_forwarding_gate', () => {
    const local_optimizer = new LocalOptimizer(4)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [local_optimizer])
    // Test that FastForwardingGate (e.g. Deallocate) flushes that qb0 pipeline
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    H.or(qb0)
    H.or(qb1)

    expect(backend.receivedCommands.length).to.equal(0)

    qb0[0].deallocate()
    // As Deallocate gate is a FastForwardingGate, we should get gates of qb0
    expect(backend.receivedCommands.length).to.equal(3)
  });

  it('should test_local_optimizer_cancel_inverse', () => {
    const local_optimizer = new LocalOptimizer(4)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [local_optimizer])
    // Test that it cancels inverses (H, CNOT are self-inverse)
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()

    expect(backend.receivedCommands.length).to.equal(0)
    for (let i = 0; i < 11; ++i) {
      H.or(qb0)
    }
    expect(backend.receivedCommands.length).to.equal(0)

    for (let i = 0; i < 11; ++i) {
      CNOT.or(tuple(qb0, qb1))
    }
    expect(backend.receivedCommands.length).to.equal(0)

    eng.flush()
    const received_commands = []
    // Remove Allocate and Deallocate gates
    backend.receivedCommands.forEach((cmd) => {
      if (!(instanceOf(cmd.gate, [FastForwardingGate, ClassicalInstructionGate]))) {
        received_commands.push(cmd)
      }
    })

    expect(received_commands.length).to.equal(2)
    expect(received_commands[0].gate.equal(H)).to.equal(true)
    expect(received_commands[0].qubits[0][0].id).to.equal(qb0[0].id)

    expect(received_commands[1].gate.equal(X)).to.equal(true)
    expect(received_commands[1].qubits[0][0].id).to.equal(qb1[0].id)
    expect(received_commands[1].controlQubits[0].id).to.equal(qb0[0].id)
  });

  it('should test_local_optimizer_mergeable_gates', () => {
    const local_optimizer = new LocalOptimizer(4)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [local_optimizer])
    // Test that it merges mergeable gates such as Rx
    const qb0 = eng.allocateQubit()
    for (let i = 0; i < 10; ++i) {
      new Rx(0.5).or(qb0)
    }

    expect(backend.receivedCommands.length).to.equal(0)
    eng.flush()
    // Expect allocate, one Rx gate, and flush gate
    expect(backend.receivedCommands.length).to.equal(3)
    expect(backend.receivedCommands[1].gate.equal(new Rx(10 * 0.5))).to.equal(true)
  });
})
