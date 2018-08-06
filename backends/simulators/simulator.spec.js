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
import {BasicGate, BasicMathGate} from "../../ops/basics"
import {DummyEngine} from "../../cengines/testengine";
import MainEngine from "../../cengines/main";
import {Measure} from "../../ops/gates";
import Simulator from './simulator'

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

  const sim = new Simulator()

  it('should test_simulator_is_available', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [])
    const qubit = eng.allocateQubit()
    Measure.or(qubit)
    new BasicMathGate(x => x).or(qubit)
    qubit[0].deallocate()

    expect(backend.receivedCommands.length).to.equal(4)

    // Test that allocate, measure, basic math, and deallocate are available.
    backend.receivedCommands.forEach(cmd => sim.isAvailable(cmd))

    const new_cmd = backend.receivedCommands[-1]

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
})
