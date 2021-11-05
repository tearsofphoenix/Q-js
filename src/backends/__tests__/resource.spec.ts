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
import ResourceCounter from '@/backends/resource'
import { BasicQubit } from '@/meta/qubit';
import { instanceOf, tuple } from '@/libs/util';
import MainEngine from '@/cengines/main'
import {
  Allocate, H, Measure, Rz, X
} from '@/ops/gates';
import Command from '@/ops/command';
import { LogicalQubitIDTag } from '@/meta/tag';
import { DummyEngine } from '@/cengines/testengine';
import { CNOT } from '@/ops/shortcuts';
import { All } from '@/ops/metagates';
import { NotYetMeasuredError } from '@/meta/error';
import { QFT } from '@/ops/qftgate';

class MockEngine {
  isAvailable(cmd) {
    return false
  }
}

describe('resource test', () => {
  it('should test_resource_counter_isavailable', () => {
    const resource_counter = new ResourceCounter()
    resource_counter.next = new MockEngine()

    expect(resource_counter.isAvailable('test')).to.equal(false)
    resource_counter.next = null
    resource_counter.isLastEngine = true

    expect(resource_counter.isAvailable('test')).to.equal(true)
  });

  it('should test_resource_counter_measurement', () => {
    const eng = new MainEngine(new ResourceCounter(), [])
    const qb1 = new BasicQubit(eng, 1)
    const qb2 = new BasicQubit(eng, 2)
    const cmd0 = new Command(eng, Allocate, tuple([qb1]))
    const cmd1 = new Command(eng, Measure, tuple([qb1]), [], [new LogicalQubitIDTag(2)])

    expect(() => qb1.toNumber()).to.throw()
    expect(() => qb2.toNumber()).to.throw()

    eng.send([cmd0, cmd1])
    eng.flush()
    expect(() => qb1.toNumber()).to.throw()
    expect(qb2.toNumber()).to.equal(0)
  });

  it('should test_resource_counter', () => {
    const resource_counter = new ResourceCounter()
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [resource_counter])

    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    H.or(qubit1)
    X.or(qubit2)

    qubit2.deallocate()

    const qubit3 = eng.allocateQubit()
    CNOT.or(tuple(qubit1, qubit3))
    new Rz(0.1).or(qubit1)
    new Rz(0.3).or(qubit1)

    new All(Measure).or(qubit1.concat(qubit3))

    expect(() => qubit1.toNumber()).to.throw(NotYetMeasuredError)

    expect(resource_counter.max_width).to.equal(2)
    expect(resource_counter.depthOfDag).to.equal(5)

    const str_repr = resource_counter.toString()
    console.log(str_repr)
    const m = str_repr.match(/\sHGate\s:\s1/g)
    expect(m.length).to.equal(1)
    expect(str_repr.match(/\sXGate\s:\s1/g).length).to.equal(1)
    expect(str_repr.match(/\sCXGate\s:\s1/g).length).to.equal(1)
    expect(str_repr.match(/\sRz\s:\s2/g).length).to.equal(1)
    expect(str_repr.match(/\sAllocateQubitGate\s:\s3/g).length).to.equal(1)
    expect(str_repr.match(/\sDeallocateQubitGate\s:\s1/g).length).to.equal(1)

    expect(str_repr.match(/\sH\s:\s1/g).length).to.equal(1)
    expect(str_repr.match(/\sX\s:\s1/g).length).to.equal(1)
    expect(str_repr.match(/\sCX\s:\s1/g).length).to.equal(1)
    expect(str_repr.match(/\sRz\(0.1\)\s:\s1/g).length).to.equal(1)
    expect(str_repr.match(/\sRz\(0.3\)\s:\s1/g).length).to.equal(1)
    expect(str_repr.match(/\sAllocate\s:\s3/g).length).to.equal(1)
    expect(str_repr.match(/\sDeallocate\s:\s1/g).length).to.equal(1)

    backend.receivedCommands.forEach(cmd => console.log(cmd.toString()))
    const cmds = backend.receivedCommands
    expect(cmds.filter(cmd => cmd.gate.equal(H)).length).to.equal(1)
    expect(cmds.filter(cmd => cmd.gate.equal(X)).length).to.equal(2)
    expect(cmds.filter(cmd => cmd.gate.equal(Measure)).length).to.equal(2)
  })

  it('should test_resource_counter_str_when_empty', () => {
    expect(instanceOf(new ResourceCounter().toString(), String)).to.equal(true)
  });

  it('should test_resource_counter_depth_of_dag', () => {
    const resource_counter = new ResourceCounter()
    const eng = new MainEngine(resource_counter, [])
    expect(resource_counter.depthOfDag).to.equal(0)

    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    const qb2 = eng.allocateQubit()
    QFT.or(qb0.concat(qb1, qb2))

    expect(resource_counter.depthOfDag).to.equal(1)

    H.or(qb0)
    H.or(qb0)
    expect(resource_counter.depthOfDag).to.equal(3)

    CNOT.or(tuple(qb0, qb1))
    X.or(qb1)
    expect(resource_counter.depthOfDag).to.equal(5)
    Measure.or(qb1)
    Measure.or(qb1)
    expect(resource_counter.depthOfDag).to.equal(7)

    CNOT.or(tuple(qb1, qb2))
    Measure.or(qb2)
    expect(resource_counter.depthOfDag).to.equal(9)

    qb1[0].deallocate()
    qb2[0].deallocate()

    expect(resource_counter.depthOfDag).to.equal(9)

    qb0[0].deallocate()
    expect(resource_counter.depthOfDag).to.equal(9)
  });
})
