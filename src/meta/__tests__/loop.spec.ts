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
import { LoopTag, Loop } from '@/meta/loop'
import { ComputeTag } from '@/meta/tag'
import { DummyEngine } from '@/cengines/testengine'
import { MainEngine } from '@/cengines/main'
import {
  Allocate, Deallocate, H, X, FlushGate
} from '@/ops/gates'
import { tuple } from '@/libs/util'
import { CNOT } from '@/ops/shortcuts'
import { QubitManagementError } from '@/meta/error'

describe('loop test', () => {
  it('should test_loop_tag', () => {
    const tag0 = new LoopTag(10)
    const tag1 = new LoopTag(10)
    const tag2 = tag0
    const other_tag = new ComputeTag()
    expect(tag0.equal(tag2)).to.equal(true)
    expect(tag0.equal(tag1)).to.equal(false)
    expect(tag0.equal(other_tag)).to.equal(false)
  });

  it('should test_loop_wrong_input_type', () => {
    const eng = new MainEngine(new DummyEngine(), [])
    const qubit = eng.allocateQubit()
    expect(() => Loop(eng, 1.1)).to.throw()
  });

  it('should test_loop_negative_iteration_number', () => {
    const eng = new MainEngine(new DummyEngine(), [])
    const qubit = eng.allocateQubit()
    expect(() => Loop(eng, -1)).to.throw()
  });

  it('should test_loop_with_supported_loop_tag_and_local_qubits', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])

    const allow_loop_tags = meta_tag => meta_tag === LoopTag

    backend.isMetaTagHandler = allow_loop_tags
    const qubit = eng.allocateQubit()
    H.or(qubit)

    Loop(eng, 6, () => {
      const ancilla = eng.allocateQubit()
      const ancilla2 = eng.allocateQubit()

      H.or(ancilla2)
      H.or(ancilla)
      CNOT.or(tuple(ancilla, qubit))
      H.or(ancilla)
      H.or(ancilla2)

      ancilla2.deallocate()
      ancilla.deallocate()
    })

    H.or(qubit)
    eng.flush(true)

    expect(backend.receivedCommands.length).to.equal(14)
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[2].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[3].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[4].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[5].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[6].gate.equal(X)).to.equal(true)

    expect(backend.receivedCommands[7].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[8].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[9].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[10].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[11].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[12].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[13].gate.equal(new FlushGate())).to.equal(true)

    // Test qubit ids
    const qubit_id = backend.receivedCommands[0].qubits[0][0].id
    const ancilla_id = backend.receivedCommands[2].qubits[0][0].id
    const ancilla2_id = backend.receivedCommands[3].qubits[0][0].id

    expect(qubit_id !== ancilla_id).to.equal(true)
    expect(qubit_id !== ancilla2_id).to.equal(true)
    expect(ancilla_id !== ancilla2_id).to.equal(true)

    expect(backend.receivedCommands[1].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[4].qubits[0][0].id).to.equal(ancilla2_id)
    expect(backend.receivedCommands[5].qubits[0][0].id).to.equal(ancilla_id)
    expect(backend.receivedCommands[6].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[6].controlQubits[0].id).to.equal(ancilla_id)
    expect(backend.receivedCommands[7].qubits[0][0].id).to.equal(ancilla_id)
    expect(backend.receivedCommands[8].qubits[0][0].id).to.equal(ancilla2_id)

    expect(backend.receivedCommands[9].qubits[0][0].id).to.equal(ancilla2_id)
    expect(backend.receivedCommands[10].qubits[0][0].id).to.equal(ancilla_id)
    expect(backend.receivedCommands[11].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[12].qubits[0][0].id).to.equal(qubit_id)

    // Tags
    expect(backend.receivedCommands[3].tags.length).to.equal(1)

    const loop_tag = backend.receivedCommands[3].tags[0]
    expect(loop_tag instanceof LoopTag).to.equal(true)
    expect(loop_tag.num).to.equal(6)
    let ids = [0, 1, 11, 12, 13]
    ids.forEach((ii) => {
      expect(backend.receivedCommands[ii].tags).to.deep.equal([])
    })
    ids = [2, 9]
    ids.forEach(ii => expect(backend.receivedCommands[ii].tags).to.deep.equal([loop_tag]))
  });

  it('should test_empty_loop', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qubit = eng.allocateQubit()

    expect(backend.receivedCommands.length).to.equal(1)
    Loop(eng, 0, () => H.or(qubit))
    expect(backend.receivedCommands.length).to.equal(1)
  });

  it('should test_empty_loop_when_loop_tag_supported_by_backend', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])

    const allow_loop_tags = meta_tag => (meta_tag === LoopTag)

    backend.isMetaTagHandler = allow_loop_tags
    const qubit = eng.allocateQubit()

    expect(backend.receivedCommands.length).to.equal(1)
    Loop(eng, 0, () => H.or(qubit))
    expect(backend.receivedCommands.length).to.equal(1)
  });

  it('should test_loop_with_supported_loop_tag_depending_on_num', () => {
    // Test that if loop has only one iteration, there is no loop tag
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])

    const allow_loop_tags = meta_tag => (meta_tag === LoopTag)

    backend.isMetaTagHandler = allow_loop_tags
    const qubit = eng.allocateQubit()
    Loop(eng, 1, () => H.or(qubit))
    Loop(eng, 2, () => H.or(qubit))
    expect(backend.receivedCommands[1].tags.length).to.equal(0)
    expect(backend.receivedCommands[2].tags.length).to.equal(1)
  });

  it('should test_loop_unrolling', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qubit = eng.allocateQubit()
    Loop(eng, 3, () => H.or(qubit))

    eng.flush(true)
    expect(backend.receivedCommands.length).to.equal(6)
  });

  it('should test_loop_unrolling_with_ancillas', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qubit = eng.allocateQubit()
    const qubit_id = qubit[0].id
    Loop(eng, 3, () => {
      const ancilla = eng.allocateQubit()
      H.or(ancilla)
      CNOT.or(tuple(ancilla, qubit))
      ancilla.deallocate()
    })

    eng.flush(true)

    expect(backend.receivedCommands.length).to.equal(15)
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    for (let ii = 0; ii < 3; ++ii) {
      expect(backend.receivedCommands[ii * 4 + 1].gate.equal(Allocate)).to.equal(true)
      expect(backend.receivedCommands[ii * 4 + 2].gate.equal(H)).to.equal(true)
      expect(backend.receivedCommands[ii * 4 + 3].gate.equal(X)).to.equal(true)
      expect(backend.receivedCommands[ii * 4 + 4].gate.equal(Deallocate)).to.equal(true)

      // Check qubit ids
      expect(backend.receivedCommands[ii * 4 + 1].qubits[0][0].id).to.equal(backend.receivedCommands[ii * 4 + 2].qubits[0][0].id)
      expect(backend.receivedCommands[ii * 4 + 1].qubits[0][0].id).to.equal(backend.receivedCommands[ii * 4 + 3].controlQubits[0].id)
      expect(backend.receivedCommands[ii * 4 + 3].qubits[0][0].id).to.equal(qubit_id)
      expect(backend.receivedCommands[ii * 4 + 1].qubits[0][0].id).to.equal(backend.receivedCommands[ii * 4 + 4].qubits[0][0].id)
    }

    expect(backend.receivedCommands[13].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[14].gate.equal(new FlushGate())).to.equal(true)


    expect(backend.receivedCommands[1].qubits[0][0].id
      !== backend.receivedCommands[5].qubits[0][0].id).to.equal(true)
    expect(backend.receivedCommands[1].qubits[0][0].id
      !== backend.receivedCommands[9].qubits[0][0].id).to.equal(true)
    expect(backend.receivedCommands[5].qubits[0][0].id
      !== backend.receivedCommands[9].qubits[0][0].id).to.equal(true)
  });

  it('should test_nested_loop', () => {
    const backend = new DummyEngine(true)

    const allow_loop_tags = meta_tag => (meta_tag === LoopTag)

    backend.isMetaTagHandler = allow_loop_tags
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qubit = eng.allocateQubit()
    Loop(eng, 3, () => {
      Loop(eng, 4, () => {
        H.or(qubit)
      })
    })

    eng.flush(true)
    expect(backend.receivedCommands.length).to.equal(4)
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[1].tags.length).to.equal(2)
    expect(backend.receivedCommands[1].tags[0].num).to.equal(4)
    expect(backend.receivedCommands[1].tags[1].num).to.equal(3)
    expect(backend.receivedCommands[1].tags[0].id !== backend.receivedCommands[1].tags[1].id).to.equal(true)
  });

  it('should test_qubit_management_error', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])

    expect(() => Loop(eng, 3, () => eng.allocateQubit())).to.throw(QubitManagementError)
  });

  it('should test_qubit_management_error_when_loop_tag_supported', () => {
    const backend = new DummyEngine(true)

    const allow_loop_tags = meta_tag => (meta_tag === LoopTag)

    backend.isMetaTagHandler = allow_loop_tags
    const eng = new MainEngine(backend, [new DummyEngine()])
    expect(() => Loop(eng, 3, () => eng.allocateQubit())).to.throw(QubitManagementError)
  });
})
