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

import { assert, expect } from 'chai'
import math from 'mathjs'
import MainEngine from '@/cengines/main'
import { DummyEngine } from '@/cengines/testengine'
import {
  BasicGate, FastForwardingGate, BasicRotationGate, SelfInverseGate, BasicPhaseGate, BasicMathGate
} from '@/ops/basics';
import { Qubit, Qureg } from '@/meta/qubit'
import Command from '@/ops/command'
import { arrayEqual } from '@/libs/polyfill'
import { tuple, ObjectCopy } from '@/libs/util';
import { Rx } from '@/ops/gates'
import { ComputeTag } from '@/meta/tag'


function mainEngine() {
  return new MainEngine(new DummyEngine(), [new DummyEngine()])
}

describe('command test', () => {
  it('should command init', () => {
    const main_engine = mainEngine()
    const qureg0 = new Qureg([new Qubit(main_engine, 0)])
    const qureg1 = new Qureg([new Qubit(main_engine, 1)])
    const qureg2 = new Qureg([new Qubit(main_engine, 2)])
    const qureg3 = new Qureg([new Qubit(main_engine, 3)])
    const qureg4 = new Qureg([new Qubit(main_engine, 4)])
    const gate = new BasicGate()
    const cmd = new Command(main_engine, gate, [qureg0, qureg1, qureg2])
    expect(cmd.gate.equal(gate)).to.equal(true)
    expect(cmd.tags).to.deep.equal([])
    const expected_tuple = [qureg0, qureg1, qureg2]
    cmd.qubits.forEach((looper, idx) => {
      expect(looper[0].id).to.equal(expected_tuple[idx][0].id)
    })

    // Testing that Qubits are now WeakQubitRef objects
    expect(cmd.engine === main_engine).to.equal(true)
    // Test that quregs are ordered if gate has interchangeable qubits:
    const symmetric_gate = new BasicGate()
    symmetric_gate.interchangeableQubitIndices = [[0, 1]]
    const symmetric_cmd = new Command(main_engine, symmetric_gate, [qureg2, qureg1, qureg0])
    expect(symmetric_cmd.gate.equal(symmetric_gate)).to.equal(true)
    expect(symmetric_cmd.tags).to.deep.equal([])
    const expected_ordered_tuple = [qureg1, qureg2, qureg0]
    symmetric_cmd.qubits.forEach((looper, idx) => {
      expect(looper[0].id).to.equal(expected_ordered_tuple[idx][0].id)
    })
    expect(symmetric_cmd.engine === main_engine).to.equal(true)
  });

  it('should command deepcopy', () => {
    const main_engine = mainEngine()
    const qureg0 = new Qureg([new Qubit(main_engine, 0)])
    const qureg1 = new Qureg([new Qubit(main_engine, 1)])
    const gate = new BasicGate()
    const cmd = new Command(main_engine, gate, tuple(qureg0))
    cmd.addControlQubits(qureg1)
    cmd.tags.push('MyTestTag')
    const copied_cmd = ObjectCopy(cmd)
    // # Test that deepcopy gives same cmd
    expect(copied_cmd.gate.equal(gate)).to.equal(true)
    expect(copied_cmd.tags).to.deep.equal(['MyTestTag'])
    expect(copied_cmd.qubits.length).to.equal(1)
    expect(copied_cmd.qubits[0][0].id).to.equal(qureg0[0].id)
    expect(copied_cmd.controlQubits.length).to.equal(1)
    expect(copied_cmd.controlQubits[0].id).to.equal(qureg1[0].id)
    // # Engine should not be deepcopied but a reference:
    expect(copied_cmd.engine === main_engine).to.equal(true)
    // # Test that deepcopy is actually a deepcopy
    cmd.tags = ['ChangedTag']
    expect(copied_cmd.tags).to.deep.equal(['MyTestTag'])
    cmd.controlQubits[0].id == 10
    expect(copied_cmd.controlQubits[0].id).to.equal(qureg1[0].id)
    cmd.gate = 'ChangedGate'
    expect(copied_cmd.gate.equal(gate)).to.equal(true)
  });

  it('should test command get inverse', () => {
    const main_engine = mainEngine()
    const qubit = main_engine.allocateQubit()
    const ctrl_qubit = main_engine.allocateQubit()
    const cmd = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd.addControlQubits(ctrl_qubit)
    cmd.tags = [new ComputeTag()]
    const inverse_cmd = cmd.getInverse()
    expect(inverse_cmd.gate.equal(new Rx(-0.5 + 4 * math.pi))).to.equal(true)
    expect(cmd.qubits.length).to.equal(inverse_cmd.qubits.length)
    expect(cmd.qubits[0][0].id).to.equal(inverse_cmd.qubits[0][0].id)
    expect(cmd.controlQubits.length).to.equal(inverse_cmd.controlQubits.length)
    expect(cmd.controlQubits[0].id).to.equal(inverse_cmd.controlQubits[0].id)
    expect(cmd.tags).to.deep.equal(inverse_cmd.tags)
    expect(cmd.engine === inverse_cmd.engine).to.equal(true)
  });

  it('should test command merge', () => {
    const main_engine = mainEngine()
    const qubit = main_engine.allocateQubit()
    const ctrl_qubit = main_engine.allocateQubit()
    const cmd = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd.tags = ['TestTag']
    cmd.addControlQubits(ctrl_qubit)
    // # Merge two commands
    const cmd2 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd2.addControlQubits(ctrl_qubit)
    cmd2.tags = ['TestTag']
    const merged_cmd = cmd.getMerged(cmd2)
    const expected_cmd = new Command(main_engine, new Rx(1.0), tuple(qubit))
    expected_cmd.addControlQubits(ctrl_qubit)
    expected_cmd.tags = ['TestTag']
    expect(merged_cmd.equal(expected_cmd)).to.equal(true)

    // # Don't merge commands as different control qubits
    const cmd3 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd3.tags = ['TestTag']
    expect(() => cmd.getMerged(cmd3)).to.throw()
    // # Don't merge commands as different tags
    const cmd4 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd4.addControlQubits(ctrl_qubit)
    expect(() => cmd.getMerged(cmd4)).to.throw()
  });

  it('should test command order qubits', () => {
    const main_engine = mainEngine()
    const qubit0 = new Qureg([new Qubit(main_engine, 0)])
    const qubit1 = new Qureg([new Qubit(main_engine, 1)])
    const qubit2 = new Qureg([new Qubit(main_engine, 2)])
    const qubit3 = new Qureg([new Qubit(main_engine, 3)])
    const qubit4 = new Qureg([new Qubit(main_engine, 4)])
    const qubit5 = new Qureg([new Qubit(main_engine, 5)])
    const gate = new BasicGate()
    gate.interchangeableQubitIndices = [[0, 4, 5], [1, 2]]
    const input_tuple = tuple(qubit4, qubit5, qubit3, qubit2, qubit1, qubit0)
    const expected_tuple = tuple(qubit0, qubit3, qubit5, qubit2, qubit1, qubit4)
    const cmd = new Command(main_engine, gate, input_tuple)
    cmd.qubits.forEach((ordered_qubit, idx) => {
      const expected_qubit = expected_tuple[idx]
      expect(ordered_qubit[0].id).to.equal(expected_qubit[0].id)
    })
  });

  it('should test command interchangeable_qubit_indices', () => {
    const main_engine = mainEngine()
    const gate = new BasicGate()
    gate.interchangeableQubitIndices = [[0, 4, 5], [1, 2]]
    const qubit0 = new Qureg([new Qubit(main_engine, 0)])
    const qubit1 = new Qureg([new Qubit(main_engine, 1)])
    const qubit2 = new Qureg([new Qubit(main_engine, 2)])
    const qubit3 = new Qureg([new Qubit(main_engine, 3)])
    const qubit4 = new Qureg([new Qubit(main_engine, 4)])
    const qubit5 = new Qureg([new Qubit(main_engine, 5)])
    const input_tuple = tuple(qubit4, qubit5, qubit3, qubit2, qubit1, qubit0)
    const cmd = new Command(main_engine, gate, input_tuple)
    expect(cmd.interchangeableQubitIndices).to.deep.equal([[0, 4, 5], [1, 2]])
  });

  it('should test command add control qubits', () => {
    const main_engine = mainEngine()
    const qubit0 = new Qureg([new Qubit(main_engine, 0)])
    const qubit1 = new Qureg([new Qubit(main_engine, 1)])
    const qubit2 = new Qureg([new Qubit(main_engine, 2)])
    const cmd = new Command(main_engine, new Rx(0.5), tuple(qubit0))
    cmd.addControlQubits(qubit2.concat(qubit1))
    expect(cmd.controlQubits[0].id).to.equal(1)
    expect(cmd.controlQubits[1].id).to.equal(2)
  });

  it('should test command all qubits', () => {
    const main_engine = mainEngine()
    const qubit0 = new Qureg([new Qubit(main_engine, 0)])
    const qubit1 = new Qureg([new Qubit(main_engine, 1)])
    const cmd = new Command(main_engine, new Rx(0.5), tuple(qubit0))
    cmd.addControlQubits(qubit1)
    const all_qubits = cmd.allQubits
    expect(all_qubits[0][0].id).to.equal(1)
    expect(all_qubits[1][0].id).to.equal(0)
  });

  it('should test command engine', () => {
    const main_engine = mainEngine()
    const qubit0 = new Qureg([new Qubit('fake_engine', 0)])
    const qubit1 = new Qureg([new Qubit('fake_engine', 1)])
    const cmd = new Command('fake_engine', new Rx(0.5), tuple(qubit0))
    cmd.addControlQubits(qubit1)
    expect(cmd.engine).to.equal('fake_engine')
    cmd.engine = main_engine
    expect(cmd.engine === main_engine).to.equal(true)
    expect(cmd.controlQubits[0].engine === main_engine).to.equal(true)
    expect(cmd.qubits[0][0].engine === main_engine).to.equal(true)
  });

  it('should test command comparison', () => {
    const main_engine = mainEngine()
    const qubit = new Qureg([new Qubit(main_engine, 0)])
    const ctrl_qubit = new Qureg([new Qubit(main_engine, 1)])
    const cmd1 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd1.tags = ['TestTag']
    cmd1.addControlQubits(ctrl_qubit)
    // Test equality
    const cmd2 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd2.tags = ['TestTag']
    cmd2.addControlQubits(ctrl_qubit)

    expect(cmd2.equal(cmd1)).to.equal(true)
    // Test not equal because of tags
    const cmd3 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd3.tags = ['TestTag', 'AdditionalTag']
    cmd3.addControlQubits(ctrl_qubit)
    expect(cmd3.equal(cmd1)).to.equal(false)

    // Test not equal because of control qubit
    const cmd4 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd4.tags = ['TestTag']
    expect(cmd4.equal(cmd1)).to.equal(false)
    // Test not equal because of qubit
    const qubit2 = new Qureg([new Qubit(main_engine, 2)])
    const cmd5 = new Command(main_engine, new Rx(0.5), tuple(qubit2))
    cmd5.tags = ['TestTag']
    cmd5.addControlQubits(ctrl_qubit)
    expect(cmd5.equal(cmd1)).to.equal(false)
    // Test not equal because of engine
    const cmd6 = new Command('FakeEngine', new Rx(0.5), tuple(qubit))
    cmd6.tags = ['TestTag']
    cmd6.addControlQubits(ctrl_qubit)
    expect(cmd6.equal(cmd1)).to.equal(false)
  });
  it('should test command string', () => {
    const main_engine = mainEngine()
    const qubit = new Qureg([new Qubit(main_engine, 0)])
    const ctrl_qubit = new Qureg([new Qubit(main_engine, 1)])
    const cmd = new Command(main_engine, new Rx(0.5), tuple(qubit))
    cmd.tags = ['TestTag']
    cmd.addControlQubits(ctrl_qubit)
    expect(cmd.toString()).to.equal('CRx(0.5) | ( Qureg[1], Qureg[0] )')
    const cmd2 = new Command(main_engine, new Rx(0.5), tuple(qubit))
    expect(cmd2.toString()).to.equal('Rx(0.5) | Qureg[0]')
  });
})
