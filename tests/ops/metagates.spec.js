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
import math from 'mathjs'
import MainEngine from '../../src/cengines/main'
import { DummyEngine } from '../../src/cengines/testengine'
import Command from '../../src/ops/command'
import { Tensor } from '../../src/ops/metagates'

import {
  Rx, T, Y, Entangle
} from '../../src/ops/gates'
import {
  C, All, DaggeredGate, ControlledGate
} from '../../src/ops/metagates'
import { Qubit } from '../../src/meta/qubit'
import { getInverse } from '../../src/ops/_cycle';
import { ClassicalInstructionGate, FastForwardingGate } from '../../src/ops/basics'
import { tuple } from '../../src/libs/util'

const np = math
const mm = math.matrix
const mc = math.complex

describe('metagates test', () => {
  it('should ', () => {
    const saving_backend = new DummyEngine(true)
    const main_engine = new MainEngine(saving_backend, [new DummyEngine()])
    const gate = new Rx(0.6)
    const qubit0 = new Qubit(main_engine, 0)
    const qubit1 = new Qubit(main_engine, 1)
    const qubit2 = new Qubit(main_engine, 2)
    const target_qubits = [qubit1, qubit2]
    C(new All(gate)).or([qubit0, target_qubits])

    const array = saving_backend.receivedCommands
    const last = array[array.length - 1]
    expect(last.gate.equal(gate)).to.equal(true)
    expect(last.controlQubits.length).to.equal(1)
  })

  it('should test daggered gate init', () => {
    // Choose gate which does not have an inverse gate:
    const not_invertible_gate = T
    expect(() => not_invertible_gate.getInverse()).to.throw()

    // Choose gate which does have an inverse defined:
    const invertible_gate = Y
    expect(invertible_gate.getInverse().equal(Y)).to.equal(true)
    // Test init and matrix
    const dagger_inv = new DaggeredGate(not_invertible_gate)
    expect(dagger_inv.gate.equal(not_invertible_gate)).to.equal(true)
    const m = mm([[1, 0],
    [0, np.exp(mc(0, -math.pi / 4))]
    ])
    expect(math.deepEqual(dagger_inv.matrix, m)).to.equal(true)
    const inv = new DaggeredGate(invertible_gate)
    expect(inv.gate.equal(invertible_gate)).to.equal(true)
    const m2 = mm([[0, mc(0, -1)], [mc(0, 1), 0]])
    expect(math.deepEqual(inv.matrix, m2)).to.equal(true)
    // Test matrix
    const no_matrix_gate = Entangle
    expect(() => no_matrix_gate.matrix).to.throw()
    const inv_no_matrix_gate = new DaggeredGate(no_matrix_gate)
    expect(() => inv_no_matrix_gate.matrix).to.throw()
  });

  it('should test daggered gate string', () => {
    const daggered_gate = new DaggeredGate(Y)
    expect(daggered_gate.toString()).to.equal(`${Y.toString()}^\\dagger`)
  });

  it('should test daggered gate get inverse', () => {
    const daggered_gate = new DaggeredGate(Y)
    expect(daggered_gate.getInverse().equal(Y)).to.equal(true)
  });

  it('should test daggered gate comparison', () => {
    const daggered_gate = new DaggeredGate(Y)
    const daggered_gate2 = new DaggeredGate(Y)
    expect(daggered_gate.equal(daggered_gate2)).to.equal(true)
  });

  it('should test get inverse', () => {
    // Choose gate which does not have an inverse gate:
    const not_invertible_gate = T
    expect(() => not_invertible_gate.getInverse()).to.throw()
    // Choose gate which does have an inverse defined:
    const invertible_gate = Y
    expect(invertible_gate.getInverse().equal(Y)).to.equal(true)
    // Check getInverse(gate)
    const inv = getInverse(not_invertible_gate)
    expect(inv instanceof DaggeredGate && inv.gate.equal(not_invertible_gate)).to.equal(true)
    const inv2 = getInverse(invertible_gate)
    expect(inv2.equal(Y)).to.equal(true)
  });

  it('should test controlled gate init', () => {
    const one_control = new ControlledGate(Y, 1)
    const two_control = new ControlledGate(Y, 2)
    const three_control = new ControlledGate(one_control, 2)
    expect(one_control.gate.equal(Y)).to.equal(true)
    expect(one_control.n).to.equal(1)
    expect(two_control.gate.equal(Y)).to.equal(true)
    expect(two_control.n).to.equal(2)
    expect(three_control.gate.equal(Y)).to.equal(true)
    expect(three_control.n).to.equal(3)
  });

  it('should test controlled gate string', () => {
    const c = new ControlledGate(Y, 2)
    expect(c.toString()).to.equal(`CC${Y.toString()}`)
  });

  it('should test controlled gate get inverse', () => {
    const one_control = new ControlledGate(new Rx(0.5), 1)
    const expected = new ControlledGate(new Rx(-0.5 + 4 * math.pi), 1)
    expect(one_control.getInverse().equal(expected)).to.equal(true)
  });

  it('should test controlled gate empty controls', () => {
    const rec = new DummyEngine(true)
    const eng = new MainEngine(rec, [])

    const a = eng.allocateQureg(1)
    new ControlledGate(Y, 0).or([[], a])
    const cmds = rec.receivedCommands
    const last = cmds[cmds.length - 1]
    expect(last.equal(new Command(eng, Y, [a]))).to.equal(true)
  });

  it('should test controlled gate or', () => {
    const saving_backend = new DummyEngine(true)
    const main_engine = new MainEngine(saving_backend, [new DummyEngine()])
    const gate = new Rx(0.6)
    const qubit0 = new Qubit(main_engine, 0)
    const qubit1 = new Qubit(main_engine, 1)
    const qubit2 = new Qubit(main_engine, 2)
    const qubit3 = new Qubit(main_engine, 3)
    const expected_cmd = new Command(main_engine, gate, [[qubit3]], [qubit0, qubit1, qubit2])
    const received_commands = []
    // Option 1:
    new ControlledGate(gate, 3).or([[qubit1], [qubit0], [qubit2], [qubit3]])
    // Option 2:
    new ControlledGate(gate, 3).or(tuple(qubit1, qubit0, qubit2, qubit3))
    // Option 3:
    new ControlledGate(gate, 3).or([[qubit1, qubit0], qubit2, qubit3])
    // Option 4:
    new ControlledGate(gate, 3).or([qubit1, [qubit0, qubit2], qubit3])
    // Wrong option 5:
    expect(() => new ControlledGate(gate, 3).or([qubit1, [qubit0, qubit2, qubit3]])).to.throw()
    // Remove Allocate and Deallocate gates
    saving_backend.receivedCommands.forEach((cmd) => {
      if (!(cmd.gate instanceof FastForwardingGate || cmd.gate instanceof ClassicalInstructionGate)) {
        received_commands.push(cmd)
      }
    })
    expect(received_commands.length).to.equal(4)
    received_commands.forEach((cmd) => {
      expect(cmd.equal(expected_cmd)).to.equal(true)
    })
  });

  it('should test controlled gate comparison', () => {
    const gate1 = new ControlledGate(Y, 1)
    const gate2 = new ControlledGate(Y, 1)
    const gate3 = new ControlledGate(T, 1)
    const gate4 = new ControlledGate(Y, 2)
    expect(gate1.equal(gate2)).to.equal(true)
    expect(gate1.equal(gate3)).to.equal(false)
    expect(gate1.equal(gate4)).to.equal(false)
  });

  it('should test c', () => {
    const expected = new ControlledGate(Y, 2)
    expect(C(Y, 2).equal(expected)).to.equal(true)
  });

  it('should test tensor init', () => {
    const gate = new Tensor(Y)
    expect(gate.gate.equal(Y)).to.equal(true)
  });

  it('should test tensor string', () => {
    const gate = new Tensor(Y)
    expect(gate.toString()).to.equal(`Tensor(${Y.toString()})`)
  });

  it('should test tensor get inverse', () => {
    const gate = new Tensor(new Rx(0.6))
    const inverse = gate.getInverse()
    expect(inverse instanceof Tensor).to.equal(true)
    expect(inverse.gate.equal(new Rx(-0.6 + 4 * math.pi))).to.equal(true)
  });

  it('should test tensor comparison', () => {
    const gate1 = new Tensor(new Rx(0.6))
    const gate2 = new Tensor(new Rx(0.6 + 4 * math.pi))
    expect(gate1.equal(gate2)).to.equal(true)
    expect(gate1.equal(new Rx(0.6))).to.equal(false)
  });

  it('should test tensor or', () => {
    const saving_backend = new DummyEngine(true)
    const main_engine = new MainEngine(saving_backend, [new DummyEngine()])
    const gate = new Rx(0.6)
    const qubit0 = new Qubit(main_engine, 0)
    const qubit1 = new Qubit(main_engine, 1)
    const qubit2 = new Qubit(main_engine, 2)
    // Option 1:
    new Tensor(gate).or([[qubit0, qubit1, qubit2]])
    // Option 2:
    new Tensor(gate).or([qubit0, qubit1, qubit2])
    const received_commands = []
    // Remove Allocate and Deallocate gates
    saving_backend.receivedCommands.forEach((cmd) => {
      if (!(cmd.gate instanceof FastForwardingGate || cmd.gate instanceof ClassicalInstructionGate)) {
        received_commands.push(cmd)
      }
    })
    // Check results
    expect(received_commands.length).to.equal(6)
    const qubit_ids = []
    received_commands.forEach((cmd) => {
      expect(cmd.qubits.length).to.equal(1)
      expect(cmd.gate.equal(gate))
      qubit_ids.push(cmd.qubits[0][0].id)
    })

    expect(qubit_ids.sort()).to.deep.equal([0, 0, 1, 1, 2, 2])
  });
})
