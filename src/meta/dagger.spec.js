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
import {
  Allocate, Deallocate, H, Rx, X
} from '../ops/gates'
import {DirtyQubitTag} from './tag'
import MainEngine from '../cengines/main'
import {DummyEngine} from '../cengines/testengine'
import {Dagger} from './dagger'
import {CNOT} from '../ops/shortcuts'
import {tuple} from '../libs/util'
import {QubitManagementError} from './error'

describe('dagger test', () => {
  it('should test dagger with dirty qubits', () => {
    const backend = new DummyEngine(true)

    const allow_dirty_qubits = meta_tag => meta_tag === DirtyQubitTag

    backend.isMetaTagHandler = allow_dirty_qubits.bind(backend)
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qubit = eng.allocateQubit()

    Dagger(eng, () => {
      const ancilla = eng.allocateQubit(true)
      new Rx(0.6).or(ancilla)
      CNOT.or(tuple(ancilla, qubit))
      H.or(qubit)
      new Rx(-0.6).or(ancilla)
      ancilla[0].deallocate()
    })

    eng.flush(true)
    expect(backend.receivedCommands.length).to.equal(9)
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[1].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[2].gate.equal(new Rx(0.6))).to.equal(true)
    expect(backend.receivedCommands[3].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[4].gate.equal(X)).to.equal(true)
    expect(backend.receivedCommands[5].gate.equal(new Rx(-0.6))).to.equal(true)
    expect(backend.receivedCommands[6].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[7].gate.equal(Deallocate)).to.equal(true)

    expect(backend.receivedCommands[1].tags).to.deep.equal([new DirtyQubitTag()])
    expect(backend.receivedCommands[6].tags).to.deep.equal([new DirtyQubitTag()])
  })

  it('should test dagger qubit management error', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    expect(() => {
      Dagger(eng, () => {
        const ancilla = eng.allocateQubit()
      })
    }).to.throw(QubitManagementError)
  })

  it('should test dagger raise only single error', () => {
    const eng = new MainEngine(new DummyEngine(), [])
    // Tests that QubitManagementError is not sent in addition
    expect(() => {
      Dagger(eng, () => {
        const ancilla = eng.allocateQubit()
        throw new Error('RuntimeError')
      })
    }).to.throw()
  })
})
