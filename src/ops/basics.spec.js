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

import {assert, expect} from 'chai'
import math from 'mathjs'
import MainEngine from '../cengines/main'
import {DummyEngine} from '../cengines/testengine'
import {
  BasicGate, FastForwardingGate, BasicRotationGate, SelfInverseGate, BasicPhaseGate, BasicMathGate
} from './basics';
import {Qubit, Qureg} from '../types/qubit'
import Command from './command'
import {arrayEqual} from '../libs/polyfill'

function mainEngine() {
  return new MainEngine(new DummyEngine(), [new DummyEngine()])
}

describe('basics test', () => {
  it('should basic gate init', () => {
    const basicGate = new BasicGate()
    expect(basicGate.interchangeableQubitIndices).to.deep.equal([])
    expect(basicGate.getInverse).to.throw()
    try {
      basicGate.getMerged('other gate')
    } catch (e) {
      assert(true)
    }
  });

  it('should basic gate make array of qureg', () => {
    const engine = mainEngine()
    const qubit0 = new Qubit(engine, 0)
    const qubit1 = new Qubit(engine, 1)
    const qubit2 = new Qubit(engine, 2)
    const qubit3 = new Qubit(engine, 3)
    const qureg = new Qureg([qubit2, qubit3])
    const case1 = BasicGate.makeTupleOfQureg(qubit0)
    expect(case1).to.deep.equal([[qubit0]])
    const case2 = BasicGate.makeTupleOfQureg([qubit0, qubit1])
    expect(case2).to.deep.equal([[qubit0, qubit1]])
    const case3 = BasicGate.makeTupleOfQureg(qureg)
    expect(case3).to.deep.equal([qureg])
    const case4 = BasicGate.makeTupleOfQureg([qubit0])
    expect(case4).to.deep.equal([[qubit0]])
    const case5 = BasicGate.makeTupleOfQureg([qureg, qubit0])
    expect(case5).to.deep.equal([qureg, [qubit0]])
  });

  it('should basic gate generate command', () => {
    const engine = mainEngine()
    const qubit0 = new Qubit(engine, 0)
    const qubit1 = new Qubit(engine, 1)
    const qubit2 = new Qubit(engine, 2)
    const qubit3 = new Qubit(engine, 3)
    const qureg = new Qureg([qubit2, qubit3])
    const basic_gate = new BasicGate()
    const command1 = basic_gate.generateCommand(qubit0)
    expect(command1.equal(new Command(engine, basic_gate, [[qubit0]]))).to.equal(true)
    const command2 = basic_gate.generateCommand([qubit0, qubit1])
    expect(command2.equal(new Command(engine, basic_gate, [[qubit0, qubit1]]))).to.equal(true)
    const command3 = basic_gate.generateCommand(qureg)
    expect(command3.equal(new Command(engine, basic_gate, [qureg]))).to.equal(true)
    const command4 = basic_gate.generateCommand([qubit0])
    expect(command4.equal(new Command(engine, basic_gate, [[qubit0]]))).to.equal(true)
    const command5 = basic_gate.generateCommand([qureg, qubit0])
    expect(command5.equal(new Command(engine, basic_gate, [qureg, [qubit0]]))).to.equal(true)
  });


  it('should basic gate or', () => {
    const saving_backend = new DummyEngine(true)
    const engine = new MainEngine(saving_backend, [new DummyEngine()])
    const qubit0 = new Qubit(engine, 0)
    const qubit1 = new Qubit(engine, 1)
    const qubit2 = new Qubit(engine, 2)
    const qubit3 = new Qubit(engine, 3)
    const qureg = new Qureg([qubit2, qubit3])
    const basic_gate = new BasicGate()
    const command1 = basic_gate.generateCommand(qubit0)
    basic_gate.or(qubit0)
    const command2 = basic_gate.generateCommand([qubit0, qubit1])
    basic_gate.or([qubit0, qubit1])
    const command3 = basic_gate.generateCommand(qureg)
    basic_gate.or(qureg)
    const command4 = basic_gate.generateCommand([qubit0])
    basic_gate.or([qubit0])
    const command5 = basic_gate.generateCommand([qureg, qubit0])
    basic_gate.or([qureg, qubit0])
    const received_commands = []
    // Remove Deallocate gates
    saving_backend.receivedCommands.forEach((cmd) => {
      if (!(cmd.gate instanceof FastForwardingGate)) {
        received_commands.push(cmd)
      }
    })

    expect(arrayEqual(received_commands, [command1, command2, command3, command4, command5])).to.equal(true)
  });

  it('should basic gate compare', () => {
    const gate1 = new BasicGate()
    const gate2 = new BasicGate()
    expect(gate1.equal(gate2)).to.equal(true)
  });

  it('should comaring different gates', () => {
    const basic_gate = new BasicGate()
    const basic_rotation_gate = new BasicRotationGate(1.0)
    const self_inverse_gate = new SelfInverseGate()
    expect(basic_gate.equal(basic_rotation_gate)).to.equal(false)
    expect(basic_gate.equal(self_inverse_gate)).to.equal(false)
    expect(self_inverse_gate.equal(basic_rotation_gate)).to.equal(false)
  });

  it('should basic gate str', () => {
    const basic_gate = new BasicGate()
    expect(basic_gate.toString).to.throw()
  });

  it('should self inverse gate', () => {
    const self_inverse_gate = new SelfInverseGate()
    expect(self_inverse_gate.getInverse().equal(self_inverse_gate)).to.equal(true)
    expect(self_inverse_gate.getInverse() != self_inverse_gate).to.equal(true)
  });

  it('should basic rotation gate init', () => {
    // Test internal representation
    const data = [[2.0, 2.0], [17, 4.4336293856408275], [-0.5 * Math.PI, 3.5 * Math.PI], [4 * Math.PI, 0]]
    data.forEach(([input_angle, modulo_angle]) => {
      const gate = new BasicRotationGate(input_angle)
      expect(gate.angle).to.be.closeTo(modulo_angle, 1e-12)
    })
  });

  it('should basic rotation gate str', () => {
    const basic_rotation_gate = new BasicRotationGate(0.5)
    expect(basic_rotation_gate.toString()).to.equal('BasicRotationGate(0.5)')
  });

  it('should basic roration gate get inverse', () => {
    const data = [[2.0, -2.0 + 4 * Math.PI], [-0.5, 0.5], [0.0, 0]]
    data.forEach(([input_angle, inverse_angle]) => {
      const basic_rotation_gate = new BasicRotationGate(input_angle)
      const inverse = basic_rotation_gate.getInverse()
      expect(inverse instanceof BasicRotationGate).to.equal(true)
      expect(inverse.angle).to.be.closeTo(inverse_angle, 1e-12)
    })
  });

  it('should basic rotation gate get merged', () => {
    const basic_gate = new BasicGate()
    const basic_rotation_gate1 = new BasicRotationGate(0.5)
    const basic_rotation_gate2 = new BasicRotationGate(1.0)
    const basic_rotation_gate3 = new BasicRotationGate(1.5)
    expect(() => basic_rotation_gate1.getMerged(basic_gate)).to.throw()
    const merged_gate = basic_rotation_gate1.getMerged(basic_rotation_gate2)
    expect(merged_gate.equal(basic_rotation_gate3)).to.equal(true)
  });

  it('should basic rotation gate comparison', () => {
    const basic_rotation_gate1 = new BasicRotationGate(0.5)
    const basic_rotation_gate2 = new BasicRotationGate(0.5)
    const basic_rotation_gate3 = new BasicRotationGate(0.5 + 4 * Math.PI)
    expect(basic_rotation_gate1.equal(basic_rotation_gate2)).to.equal(true)
    expect(basic_rotation_gate1.equal(basic_rotation_gate3)).to.equal(true)

    const basic_rotation_gate4 = new BasicRotationGate(0.50000001)
    // Test __ne__:
    expect(basic_rotation_gate4.equal(basic_rotation_gate1)).to.equal(false)

    // Test one gate close to 4*pi the other one close to 0
    const basic_rotation_gate5 = new BasicRotationGate(1.e-13)
    const basic_rotation_gate6 = new BasicRotationGate(4 * Math.PI - 1.e-13)
    expect(basic_rotation_gate5.equal(basic_rotation_gate6)).to.equal(true)
    expect(basic_rotation_gate6.equal(basic_rotation_gate5)).to.equal(true)
    // Test different types of gates
    const basic_gate = new BasicGate()
    expect(basic_gate.equal(basic_rotation_gate6)).to.equal(false)
    expect(basic_rotation_gate2.equal(new BasicRotationGate(0.5 + 2 * Math.PI))).to.equal(false)
  });

  it('should phase gate init', () => {
    const data = [[2.0, 2.0], [17.0, 4.4336293856408275],
      [-0.5 * math.pi, 1.5 * math.pi], [2 * math.pi, 0]]
    data.forEach(([input_angle, modulo_angle]) => {
      // Test internal representation
      const gate = new BasicPhaseGate(input_angle)
      expect(gate.angle).to.be.closeTo(modulo_angle, 1e-12)
    })
  });

  it('should basic phase gate str', () => {
    const basic_phase_gate = new BasicPhaseGate(0.5)
    expect(basic_phase_gate.toString()).to.be.equal('BasicPhaseGate(0.5)')
  });

  it('should basic phase gate get inverse', () => {
    const data = [[2.0, -2.0 + 2 * math.pi], [-0.5, 0.5], [0.0, 0]]
    data.forEach(([input_angle, inverse_angle]) => {
      const basic_phase_gate = new BasicPhaseGate(input_angle)
      const inverse = basic_phase_gate.getInverse()
      expect(inverse instanceof BasicPhaseGate).to.equal(true)
      expect(inverse.angle).to.be.closeTo(inverse_angle, 1e-12)
    })
  });

  it('should basic phase gate get merged', () => {
    const basic_gate = new BasicGate()
    const basic_phase_gate1 = new BasicPhaseGate(0.5)
    const basic_phase_gate2 = new BasicPhaseGate(1.0)
    const basic_phase_gate3 = new BasicPhaseGate(1.5)
    expect(() => basic_phase_gate1.getMerged(basic_gate)).to.throw()
    const merged_gate = basic_phase_gate1.getMerged(basic_phase_gate2)
    expect(merged_gate.equal(basic_phase_gate3)).to.equal(true)
  });

  it('should basic phase gate comparison', () => {
    const basic_phase_gate1 = new BasicPhaseGate(0.5)
    const basic_phase_gate2 = new BasicPhaseGate(0.5)
    const basic_phase_gate3 = new BasicPhaseGate(0.5 + 2 * math.pi)
    expect(basic_phase_gate1.equal(basic_phase_gate2)).to.equal(true)
    expect(basic_phase_gate1.equal(basic_phase_gate3)).to.equal(true)
    const basic_phase_gate4 = new BasicPhaseGate(0.50000001)
    // Test __ne__:
    expect(basic_phase_gate4.equal(basic_phase_gate1)).to.equal(false)
    // Test one gate close to 2*pi the other one close to 0
    const basic_phase_gate5 = new BasicPhaseGate(1.e-13)
    const basic_phase_gate6 = new BasicPhaseGate(2 * math.pi - 1.e-13)
    expect(basic_phase_gate5.equal(basic_phase_gate6)).to.equal(true)
    expect(basic_phase_gate6.equal(basic_phase_gate5)).to.equal(true)
    // Test different types of gates
    const basic_gate = new BasicGate()
    expect(basic_gate.equal(basic_phase_gate6)).to.equal(false)
    expect(basic_phase_gate2.equal(new BasicPhaseGate(0.5 + math.pi))).to.equal(false)
  });

  it('should basic math gate', () => {
    const mymathFunc = (a, b, c) => [a, b, c + a * b]

    class MyMultiplyGate extends BasicMathGate {
      constructor() {
        super(mymathFunc)
      }
    }

    const gate = new MyMultiplyGate()
    expect(gate.toString()).to.equal('MATH')
    // Test a=2, b=3, and c=5 should give a=2, b=3, c=11
    const math_fun = gate.getMathFunction(['qreg1', 'qreg2', 'qreg3'])
    expect(math_fun([2, 3, 5])).to.deep.equal([2, 3, 11])
  });
})
