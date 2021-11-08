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
import { BasicQubit, Qubit, Qureg } from '@/meta/qubit'
import { BasicEngine } from '@/cengines/basics'
import MainEngine from '@/cengines/main'
import { DummyEngine } from '@/cengines/testengine'
import { Deallocate } from '@/ops/gates'
import { ICommand, IEngine, IQubit } from '@/interfaces';

describe('Qubit test', () => {

  it('should test basic qubit', () => {
    const qubitID = 0;
    const fakeEngine = 'Fake' as any;
    const qubit = new BasicQubit(fakeEngine, qubitID)
    expect(qubit.toString()).to.equal(qubitID.toString())
    expect(qubit.toString()).to.equal(qubit.inspect())
  });

  it('should test basic qubit measurement', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qubit0 = eng.allocateQubit()[0]
    const qubit1 = eng.allocateQubit()[0]
    eng.setMeasurementResult(qubit0, false)
    eng.setMeasurementResult(qubit1, true)

    expect(qubit0.toBoolean()).to.equal(false)
    expect(qubit1.toBoolean()).to.equal(true)
    expect(qubit0.toNumber()).to.equal(0)
    expect(qubit1.toNumber()).to.equal(1)
  });

  it('should test basic qubit comparison', () => {
    const data = [
      [0, 0, true],
      [0, 1, false]
    ]

    const fakeEngine = 'Fake' as any;
    const fakeEngine2 = 'Fake 2' as any;

    data.forEach((item) => {
      const [id0, id1, expected] = item

      const qubit0 = new BasicQubit(fakeEngine, id0 as number);
      const qubit1 = new BasicQubit(fakeEngine, id1 as number);
      const qubit2 = new BasicQubit(fakeEngine2, id0 as number);

      expect(qubit2.equal(qubit0)).to.equal(false)
      expect(qubit2.equal(qubit1)).to.equal(false)
      expect(qubit0.equal(qubit1)).to.equal(expected)
    })
  });

  it('should test basic qubit equal', () => {
    const fakeEngine = 'Engine' as any;
    const q1 = new BasicQubit(fakeEngine, 1)
    const q2 = new BasicQubit(fakeEngine, 2)
    const q3 = new BasicQubit(null as any, 3)
    const q4 = new BasicQubit(fakeEngine, 1)

    expect(q1.equal(q2)).to.equal(false)
    expect(q1.equal(q3)).to.equal(false)
    expect(q2.equal(q3)).to.equal(false)
    expect(q4.equal(q1)).to.equal(true)
  });

  class MockMainEngine {
    numCalls: number;
    activeQubits: Set<any>;
    main: any;
    qubitID: number;

    constructor() {
      this.numCalls = 0
      this.activeQubits = new Set()
      this.main = this
    }

    deallocateQubit(qubit: IQubit) {
      this.numCalls += 1
      this.qubitID = qubit.id
    }
  }

  it('should test qubit del', () => {
    const engine = new MockMainEngine()
    const qubit = new Qubit(engine as any, 10)
    assert(qubit.id === 10)
    qubit.deallocate()
    assert(qubit.id === -1)
    assert(engine.numCalls === 1)
    assert(engine.qubitID === 10)
  });

  it('should qubit not copyable', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qubit = new Qubit(eng, 10)
    const qubit_copy = qubit.copy()
    assert(qubit === qubit_copy)
  })

  it('should test qureg str', () => {
    const eng = new MainEngine(new DummyEngine(), [])
    const reg = new Qureg()
    expect(reg.toString()).to.equal('Qureg[]')

    const a = eng.allocateQureg(10)
    const b = eng.allocateQureg(50)
    const c = eng.allocateQubit()
    const d = eng.allocateQubit()
    const e = eng.allocateQubit()

    expect(a.toString()).to.equal('Qureg[0-9]')
    assert(b.toString() === 'Qureg[10-59]')
    assert(c.toString() === 'Qureg[60]')
    assert(d.toString() === 'Qureg[61]')
    assert(e.toString() === 'Qureg[62]')

    expect(c.add(e).toString()).to.equal('Qureg[60, 62]')
    expect(a.add(b).toString()).to.equal('Qureg[0-59]')
    expect(a.add(b).add(c).toString()).to.equal('Qureg[0-60]')
    expect(a.add(b).add(d).toString()).to.equal('Qureg[0-59, 61]')
    expect(a.add(b).add(e).toString()).to.equal('Qureg[0-59, 62]')
    expect(b.add(a).toString()).to.equal('Qureg[10-59, 0-9]')
    expect(e.add(b).add(a).toString()).to.equal('Qureg[62, 10-59, 0-9]')
  });

  it('should test qureg measure if qubit', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qureg0 = new Qureg(eng.allocateQubit())
    const qureg1 = new Qureg(eng.allocateQubit())
    eng.setMeasurementResult(qureg0[0], false)
    eng.setMeasurementResult(qureg1[0], true)

    expect(qureg0.toBoolean()).to.equal(false)
    expect(qureg1.toBoolean()).to.equal(true)
    expect(qureg0.toNumber()).to.equal(0)
    expect(qureg1.toNumber()).to.equal(1)
  });

  it('should qureg measure exception', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qureg = new Qureg()
    const ids = [0, 1]
    ids.forEach((id) => {
      const qubit = new Qubit(eng, id)
      qureg.push(qubit)
    })
    expect(qureg.toBoolean).to.throw()
  });

  it('should qureg engine', () => {
    const eng1 = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const eng2 = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qureg = new Qureg([new Qubit(eng1, 0), new Qubit(eng1, 1)])
    expect(eng1).to.equal(qureg.engine)
    qureg.engine = eng2
    expect(qureg[0].engine === eng2 && qureg[1].engine === eng2).to.equal(true)
  });

  it('should idempotent del', () => {
    const rec = new DummyEngine(true)
    const eng = new MainEngine(rec, [])
    const q = eng.allocateQubit()[0]
    rec.receivedCommands = []
    assert(rec.receivedCommands.length === 0)
    q.deallocate()
    assert(rec.receivedCommands.length === 1)
    q.deallocate()
    assert(rec.receivedCommands.length === 1)
  });

  it('should test qureg deallocate', () => {
    const rec = new DummyEngine(true)
    const eng = new MainEngine(rec, [])
    const q = eng.allocateQureg(1)
    rec.receivedCommands = []
    assert(rec.receivedCommands.length === 0)
    q.deallocate()
    assert(rec.receivedCommands.length === 1)
    q.deallocate()
    assert(rec.receivedCommands.length === 1)
  });

  it('should test qureg to Number', () => {
    const rec = new DummyEngine(true)
    const eng = new MainEngine(rec, [])
    const q = eng.allocateQureg(2)
    expect(() => q.toNumber()).to.throw()
    expect(() => q.toBoolean()).to.throw()

    const q2 = eng.allocateQureg(1)
    expect(() => q2.toNumber()).to.throw()
  });

  it('should test qureg equal', () => {
    const rec = new DummyEngine(true)
    const eng = new MainEngine(rec, [])
    const q = eng.allocateQureg(2)
    const q2 = eng.allocateQureg(2)
    const q3 = new Qureg(...q)
    expect(q.equal(q2)).to.equal(false)
    expect(q.equal(q3)).to.equal(true)
    expect(q.equal(new Array(...q) as any)).to.equal(false)
  });

  it('should test basic qubit array copy', () => {
    const q = new BasicQubit(null as any, 0)
    const array = [q]
    const copy = BasicQubit.copyArray(array)
    expect(array).to.deep.equal(copy)
  });

  it('should idempotent del on failure', () => {
    class InjectedBugEngine extends BasicEngine {
      receive(cmds: ICommand[]) {
        cmds.forEach((cmd) => {
          if (cmd.gate === Deallocate) {
            throw new Error('Value error')
          }
        })
      }
    }

    const eng = new MainEngine(new InjectedBugEngine(), [])
    const q = eng.allocateQubit()[0]

    // First call to __del__ triggers the bug.
    try {
      q.deallocate()
      assert(false)
    } catch (e) {

    } finally {
      // Later calls to __del__ do nothing.
      expect(q.id).to.equal(-1)
      q.deallocate()
    }
  });
})
