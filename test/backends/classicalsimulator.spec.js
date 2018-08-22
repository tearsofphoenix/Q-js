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
import BasicMapperEngine from '../../src/cengines/basicmapper'
import MainEngine from '../../src/cengines/main'
import ClassicalSimulator from '../../src/backends/simulators/classicalsimulator'
import { tuple } from '../../src/libs/util'
import {
  Measure, NOT, X, Y
} from '../../src/ops/gates'
import { All, C } from '../../src/ops/metagates'
import { BasicMathGate } from '../../src/ops/basics'
import { AutoReplacer } from '../../src/cengines/replacer/replacer'
import DecompositionRuleSet from '../../src/cengines/replacer/decompositionruleset'
import { BasicQubit } from '../../src/types/qubit'
import { DummyEngine } from '../../src/cengines/testengine'
import {TrivialMapper} from './shared.spec'

describe('classical simulator test', () => {
  const mapper = new TrivialMapper()
  it('should test_simulator_read_write', () => {
    const engine_list = []

    if (mapper) {
      engine_list.push(mapper)
    }
    const sim = new ClassicalSimulator()
    const eng = new MainEngine(sim, engine_list)
    const a = eng.allocateQureg(32)
    const b = eng.allocateQureg(32)

    expect(sim.readRegister(a)).to.equal(0)
    expect(sim.readRegister(b)).to.equal(0)
    expect(sim.readBit(a[0]).toString()).to.equal('0')
    expect(sim.readBit(b[0]).toString()).to.equal('0')

    sim.writeRegister(a, 123)
    sim.writeRegister(b, 456)
    expect(sim.readRegister(a)).to.equal(123)
    expect(sim.readRegister(b)).to.equal(456)
    expect(sim.readBit(a[0])).to.equal(1)
    expect(sim.readBit(b[0])).to.equal(0)

    sim.writeBit(b[0], 1)
    expect(sim.readRegister(a)).to.equal(123)
    expect(sim.readRegister(b)).to.equal(457)
    expect(sim.readBit(a[0])).to.equal(1)
    expect(sim.readBit(b[0])).to.equal(1)
  });

  it('should test_simulator_triangle_increment_cycle', () => {
    const engine_list = []
    if (mapper) {
      engine_list.push(mapper)
    }
    const sim = new ClassicalSimulator()
    const eng = new MainEngine(sim, engine_list)

    const a = eng.allocateQureg(6)
    for (let t = 0; t < 1 << 6; ++t) {
      expect(sim.readRegister(a)).to.equal(t)
      for (let i = 5; i >= 0; --i) {
        C(X, i).or(tuple(a.slice(0, i), a[i]))
      }
    }
    expect(sim.readRegister(a)).to.equal(0)
  });

  it('should test_simulator_bit_repositioning', () => {
    const engine_list = []
    if (mapper) {
      engine_list.push(mapper)
    }
    const sim = new ClassicalSimulator()
    const eng = new MainEngine(sim, engine_list)
    const a = eng.allocateQureg(4)
    const b = eng.allocateQureg(5)
    const c = eng.allocateQureg(6)
    sim.writeRegister(a, 9)
    sim.writeRegister(b, 17)
    sim.writeRegister(c, 33)
    b.forEach(q => eng.deallocateQubit(q))
    expect(sim.readRegister(a)).to.equal(9)
    expect(sim.readRegister(c)).to.equal(33)
  });

  it('should test_simulator_arithmetic', () => {
    class Offset extends BasicMathGate {
      constructor(amount) {
        super(x => [x + amount])
      }
    }

    class Sub extends BasicMathGate {
      constructor() {
        super((x, y) => [x, y - x])
      }
    }

    const engine_list = []
    if (mapper) {
      engine_list.push(mapper)
    }
    const sim = new ClassicalSimulator()
    const eng = new MainEngine(sim, engine_list)
    const a = eng.allocateQureg(4)
    const b = eng.allocateQureg(5)
    sim.writeRegister(a, 9)
    sim.writeRegister(b, 17)

    new Offset(2).or(a)
    expect(sim.readRegister(a)).to.equal(11)
    expect(sim.readRegister(b)).to.equal(17)

    new Offset(3).or(b)
    expect(sim.readRegister(a)).to.equal(11)
    expect(sim.readRegister(b)).to.equal(20)

    new Offset(32 + 5).or(b)
    expect(sim.readRegister(a)).to.equal(11)
    expect(sim.readRegister(b)).to.equal(25)

    new Sub().or(tuple(a, b))
    expect(sim.readRegister(a)).to.equal(11)
    expect(sim.readRegister(b)).to.equal(14)

    new Sub().or(tuple(a, b))
    new Sub().or(tuple(a, b))
    expect(sim.readRegister(a)).to.equal(11)
    expect(sim.readRegister(b)).to.equal(24)

    // also test via measurement:
    new All(Measure).or(a.concat(b))
    eng.flush()

    for (let i = 0; i < a.length; ++i) {
      expect(a[i].toNumber()).to.equal((11 >> i) & 1)
    }
    for (let i = 0; i < b.length; ++i) {
      expect(b[i].toNumber()).to.equal((24 >> i) & 1)
    }
  });

  it('should test_writeRegister_value_error_exception', () => {
    const engine_list = []
    if (mapper) {
      engine_list.push(mapper)
    }

    const sim = new ClassicalSimulator()
    const eng = new MainEngine(sim, engine_list)
    const a = eng.allocateQureg(3)
    expect(() => {
      sim.writeRegister(a, -2)
    }).to.throw()

    sim.writeRegister(a, 7)
    expect(() => sim.writeRegister(a, 8)).to.throw()
  });

  it('should test_available_gates', () => {
    const sim = new ClassicalSimulator()
    const eng = new MainEngine(sim, [new AutoReplacer(new DecompositionRuleSet())])
    const a = eng.allocateQubit()
    X.or(a)
    NOT.or(a)
    Measure.or(a)
    eng.flush()
  })

  it('should test_gates_are_forwarded_to_next_engine', () => {
    const sim = new ClassicalSimulator()
    const saving_eng = new DummyEngine(true)
    const eng = new MainEngine(saving_eng, [sim])
    const a = eng.allocateQubit()
    X.or(a)
    a[0].deallocate()
    expect(saving_eng.receivedCommands.length).to.equal(3)
  })

  it('should test_wrong_gate', () => {
    const sim = new ClassicalSimulator()
    const eng = new MainEngine(sim, [])
    const a = eng.allocateQubit()
    expect(() => Y.or(a)).to.throw()
  });

  it('should test_runtime_error', () => {
    const sim = new ClassicalSimulator()
    const mapperEngine = new BasicMapperEngine()
    mapperEngine.currentMapping = {}
    const eng = new MainEngine(sim, [mapperEngine])
    expect(() => eng.backend.readBit(new BasicQubit(null, 1))).to.throw()
  });
})
