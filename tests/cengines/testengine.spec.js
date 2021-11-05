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
import { tuple } from '../../src/libs/util'
import MainEngine from '../../src/cengines/main'
import {DummyEngine, CompareEngine} from '../../src/cengines/testengine'
import {
  H, Rx, FlushGate, Allocate
} from '../../src/ops/gates'
import {CNOT} from '../../src/ops/shortcuts'

describe('testengine test', () => {
  it('should test_compare_engine_str', () => {
    const compare_engine = new CompareEngine()
    const eng = new MainEngine(compare_engine, [new DummyEngine()])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    H.or(qb0)
    CNOT.or(tuple(qb0, qb1))
    eng.flush()
    const expected = ('Qubit 0 : Allocate | Qureg[0], H | Qureg[0], '
      + 'CX | ( Qureg[0], Qureg[1] )\nQubit 1 : Allocate | Qureg[1],'
      + ' CX | ( Qureg[0], Qureg[1] )\n')

    expect(compare_engine.toString()).to.equal(expected)
  });

  it('should test_compare_engine_is_available', () => {
    const compare_engine = new CompareEngine()
    expect(compare_engine.isAvailable('Anything')).to.equal(true)
  });

  it('should test_compare_engine_receive', () => {
    // Test that CompareEngine would forward commands
    const backend = new DummyEngine(true)
    const compare_engine = new CompareEngine()
    const eng = new MainEngine(backend, [compare_engine])
    const qubit = eng.allocateQubit()
    H.or(qubit)
    eng.flush()
    expect(backend.receivedCommands.length).to.equal(3)
  });

  it('should test_compare_engine', () => {
    const compare_engine0 = new CompareEngine()
    const compare_engine1 = new CompareEngine()
    const compare_engine2 = new CompareEngine()
    const compare_engine3 = new CompareEngine()
    const eng0 = new MainEngine(compare_engine0, [new DummyEngine()])
    const eng1 = new MainEngine(compare_engine1, [new DummyEngine()])
    const eng2 = new MainEngine(compare_engine2, [new DummyEngine()])
    const eng3 = new MainEngine(compare_engine3, [new DummyEngine()])
    // reference circuit
    const qb00 = eng0.allocateQubit()
    const qb01 = eng0.allocateQubit()
    const qb02 = eng0.allocateQubit()
    H.or(qb00)
    CNOT.or(tuple(qb00, qb01))
    CNOT.or(tuple(qb01, qb00))
    H.or(qb00)
    new Rx(0.5).or(qb01)
    CNOT.or(tuple(qb00, qb01))
    new Rx(0.6).or(qb02)
    eng0.flush()
    // identical circuit:
    const qb10 = eng1.allocateQubit()
    const qb11 = eng1.allocateQubit()
    const qb12 = eng1.allocateQubit()
    H.or(qb10)
    new Rx(0.6).or(qb12)
    CNOT.or(tuple(qb10, qb11))
    CNOT.or(tuple(qb11, qb10))
    new Rx(0.5).or(qb11)
    H.or(qb10)
    CNOT.or(tuple(qb10, qb11))
    eng1.flush()
    // mistake in CNOT circuit:
    const qb20 = eng2.allocateQubit()
    const qb21 = eng2.allocateQubit()
    const qb22 = eng2.allocateQubit()
    H.or(qb20)
    new Rx(0.6).or(qb22)
    CNOT.or(tuple(qb21, qb20))
    CNOT.or(tuple(qb20, qb21))
    new Rx(0.5).or(qb21)
    H.or(qb20)
    CNOT.or(tuple(qb20, qb21))
    eng2.flush()
    // test other branch to fail
    const qb30 = eng3.allocateQubit()
    const qb31 = eng3.allocateQubit()
    const qb32 = eng3.allocateQubit()
    eng3.flush()

    expect(compare_engine0.equal(compare_engine1)).to.equal(true)
    expect(compare_engine1.equal(compare_engine2)).to.equal(false)
    expect(compare_engine1.equal(compare_engine3)).to.equal(false)
    expect(compare_engine0.equal(new DummyEngine())).to.equal(false)
  });

  it('should test dummy engine', () => {
    const dummy_eng = new DummyEngine(true)
    const eng = new MainEngine(dummy_eng, [])

    expect(dummy_eng.isAvailable('Anything')).to.equal(true)
    const qubit = eng.allocateQubit()
    H.or(qubit)
    eng.flush()
    expect(dummy_eng.receivedCommands.length).to.equal(3)
    expect(dummy_eng.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(dummy_eng.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(dummy_eng.receivedCommands[2].gate.equal(new FlushGate())).to.equal(true)
  });
})
