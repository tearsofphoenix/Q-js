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
import {tuple} from '../libs/util';
import {Measure, H} from '../ops/gates'
import {All} from '../ops/metagates'
import {LogicalQubitIDTag} from '../meta/tag'
import {DummyEngine} from './testengine'
import MainEngine from './main'
import ManualMapper from './manualmapper'

describe('manual mapper test', () => {
  it('should test manual mapper', () => {
    const backend = new DummyEngine(true)

    const mapping = qubit_id => (qubit_id + 1) & 1
    console.log(mapping(1))
    const eng = new MainEngine(backend, [new ManualMapper(mapping)])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    H.or(qb0)
    H.or(qb1)
    new All(Measure).or(tuple(qb0.concat(qb1)))
    eng.flush()

    let num_measurements = 0
    backend.receivedCommands.forEach((cmd) => {
      if (cmd.gate.equal(Measure)) {
        const tag = new LogicalQubitIDTag(mapping(cmd.qubits[0][0].id))
        expect(tag.isInArray(cmd.tags)).to.equal(true)
        const wrongTag = new LogicalQubitIDTag(cmd.qubits[0][0].id)
        expect(wrongTag.isInArray(cmd.tags)).to.equal(false)
        num_measurements += 1
      }
    })
    expect(num_measurements).to.equal(2)
  });
})
