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
import {DummyEngine} from '../../src/cengines/testengine'
import { BasicQubit } from '../../src/types/qubit'
import Command from '../../src/ops/command'
import {
  Allocate, Deallocate, Measure, FlushGate
} from '../../src/ops/gates'
import {BasicGate} from '../../src/ops/basics'
import { tuple } from '../../src/libs/util'
import {LogicalQubitIDTag} from '../../src/meta/tag'

describe('basic mapper test', () => {
  it('should test basic_mapper_engine_send_cmd_with_mapped_ids', () => {
    const mapper = new BasicMapperEngine()
    mapper.currentMapping = {
      0: 3, 1: 2, 2: 1, 3: 0
    }
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    // generate a few commands
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const qb3 = new BasicQubit(null, 3)

    const cmd0 = new Command(null, Allocate, tuple([qb0]), [], [])
    const cmd1 = new Command(null, Deallocate, tuple([qb1]), [], [])
    const cmd2 = new Command(null, Measure, tuple([qb2]), [], ['SomeTag'])
    const cmd3 = new Command(null, new BasicGate(), tuple([qb0, qb1], [qb2]), [qb3], [])
    const cmd4 = new Command(null, new FlushGate(), tuple([new BasicQubit(null, -1)]))
    mapper.sendCMDWithMappedIDs(cmd0)
    mapper.sendCMDWithMappedIDs(cmd1)
    mapper.sendCMDWithMappedIDs(cmd2)
    mapper.sendCMDWithMappedIDs(cmd3)
    mapper.sendCMDWithMappedIDs(cmd4)

    const rcmd0 = backend.receivedCommands[0]
    const rcmd1 = backend.receivedCommands[1]
    const rcmd2 = backend.receivedCommands[2]
    const rcmd3 = backend.receivedCommands[3]
    const rcmd4 = backend.receivedCommands[4]

    expect(rcmd0.gate.equal(Allocate)).to.equal(true)
    expect(rcmd0.qubits).to.deep.equal(tuple([qb3]))
    expect(rcmd1.gate.equal(Deallocate)).to.equal(true)
    expect(rcmd1.qubits).to.deep.equal(tuple([qb2]))
    expect(rcmd2.gate.equal(Measure)).to.equal(true)
    expect(rcmd2.qubits).to.deep.equal(tuple([qb1]))
    expect(rcmd2.tags).to.deep.equal(['SomeTag', new LogicalQubitIDTag(2)])

    expect(rcmd3.gate.equal(new BasicGate())).to.equal(true)
    expect(rcmd3.qubits).to.deep.equal(tuple([qb3, qb2], [qb1]))
    expect(rcmd3.controlQubits).to.deep.equal([qb0])

    expect(rcmd4.qubits.length).to.equal(1)
    expect(rcmd4.qubits[0].length).to.equal(1)
    expect(rcmd4.qubits[0][0].id).to.equal(-1)
  });
})
