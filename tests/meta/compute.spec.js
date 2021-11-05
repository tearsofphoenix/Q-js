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
import {ComputeTag, UncomputeTag, DirtyQubitTag} from '../../src/meta/tag'
import {
  Allocate, Deallocate, H, NOT, Rx, Ry, FlushGate
} from '../../src/ops/gates'
import {CNOT} from '../../src/ops/shortcuts'
import MainEngine from '../../src/cengines/main'
import {DummyEngine, CompareEngine} from '../../src/cengines/testengine'
import {
  ComputeEngine, UncomputeEngine, Compute, Uncompute, CustomUncompute
} from '../../src/meta/compute'
import {tuple} from '../../src/libs/util'
import {QubitManagementError} from '../../src/meta/error'

describe('compute test', () => {
  it('should test compute tag', () => {
    const tag0 = new ComputeTag()
    const tag1 = new ComputeTag()
    expect(tag0.equal(tag1)).to.equal(true)
    expect(tag0 === {}).to.equal(false)
  })

  it('should test uncompute tag', () => {
    const tag0 = new UncomputeTag()
    const tag1 = new UncomputeTag()
    expect(tag0.equal(tag1)).to.equal(true)
    expect(tag0 === new Object()).to.equal(false)
  })

  it('should test compute engine', () => {
    const backend = new DummyEngine(true)
    const compute_engine = new ComputeEngine()
    const eng = new MainEngine(backend, [compute_engine])
    const ancilla = eng.allocateQubit() // Ancilla
    H.or(ancilla)
    new Rx(0.6).or(ancilla)
    ancilla[0].deallocate()
    // Test that adding later a new tag to one of the previous commands
    // does not add this tags to cmds saved in compute_engine because
    // this one does need to make a deepcopy and not store a reference.
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    backend.receivedCommands[1].tags.push('TagAddedLater')
    const {tags} = backend.receivedCommands[1]
    expect(tags[tags.length - 1]).equal('TagAddedLater')
    compute_engine.endCompute()
    const new_qubit = eng.allocateQubit()
    new Ry(0.5).or(new_qubit)
    compute_engine.runUnCompute()
    eng.flush()

    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[0].tags).to.deep.equal([new ComputeTag()])
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[1].tags).to.deep.equal([new ComputeTag(), 'TagAddedLater'])

    expect(backend.receivedCommands[2].gate.equal(new Rx(0.6))).to.equal(true)
    expect(backend.receivedCommands[2].tags).to.deep.equal([new ComputeTag()])
    expect(backend.receivedCommands[3].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[3].tags).to.deep.equal([new ComputeTag()])

    expect(backend.receivedCommands[4].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[4].tags).to.deep.equal([])
    expect(backend.receivedCommands[5].gate.equal(new Ry(0.5))).to.equal(true)
    expect(backend.receivedCommands[5].tags).to.deep.equal([])

    expect(backend.receivedCommands[6].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[6].tags).to.deep.equal([new UncomputeTag()])
    expect(backend.receivedCommands[7].gate.equal(new Ry(-0.6))).to.equal(true)
    expect(backend.receivedCommands[7].tags).to.deep.equal([new UncomputeTag()])

    expect(backend.receivedCommands[8].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[8].tags).to.deep.equal([new UncomputeTag()])
    expect(backend.receivedCommands[9].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[9].tags).to.deep.equal([new UncomputeTag()])
  })

  it('should test uncompute engine', () => {
    const backend = new DummyEngine(true)
    const uncompute_engine = new UncomputeEngine()
    const eng = new MainEngine(backend, [uncompute_engine])
    const qubit = eng.allocateQubit()
    H.or(qubit)
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[0].tags).to.deep.equal([new UncomputeTag()])
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[1].tags).to.deep.equal([new UncomputeTag()])
  })

  it('should test outside qubit deallocated in compute', () => {
    // Test that there is an error if a qubit is deallocated which has
    // not been allocated within the with Compute(eng) context
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qubit = eng.allocateQubit()
    expect(() => Compute(eng, () => qubit[0].deallocate())).to.throw(QubitManagementError)
  })

  it('should test deallocation using custom uncompute', () => {
    // Test that qubits allocated within Compute and Uncompute
    // section have all been deallocated
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    // # Allowed versions:
    Compute(eng, () => {
      const ancilla = eng.allocateQubit()
      ancilla[0].deallocate()
    })
    CustomUncompute(eng, () => {
      const a2 = eng.allocateQubit()
      a2[0].deallocate()
    })
    Compute(eng, () => {
      const a3 = eng.allocateQubit()
      CustomUncompute(eng, () => {
        a3[0].deallocate()
      })
    })
  })

  it('should test deallocation using custom uncompute2', () => {
    // Test not allowed version:
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    let a
    Compute(eng, () => {
      a = eng.allocateQubit()
    })
    expect(() => {
      CustomUncompute(eng, () => {

      })
    }).to.throw(QubitManagementError)
    H.or(a)
  })

  it('should test deallocation using custom uncompute3', () => {
    // Test not allowed version:
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    Compute(eng, () => {

    })
    let a = null
    expect(() => {
      CustomUncompute(eng, () => {
        a = eng.allocateQubit()
      })
    }).to.throw(QubitManagementError)
    H.or(a)
  })

  it('should test automatic deallocation of qubit in uncompute', () => {
    // Test that automatic uncomputation deallocates qubit
    // which was created during compute context.
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])
    let ancilla
    Compute(eng, () => {
      ancilla = eng.allocateQubit()
      expect(ancilla[0].id).not.to.equal(-1)
      new Rx(0.6).or(ancilla)
    })
    // Test that ancilla qubit has been registered in MainEngine.active_qubits
    expect(eng.activeQubits.has(ancilla[0])).to.equal(true)
    Uncompute(eng)
    // Test that ancilla id has been set to -1
    expect(ancilla[0].id).to.equal(-1)
    // Test that ancilla is not anymore in active qubits
    // TODO: fixme
    // expect(eng.activeQubits.has(ancilla[0])).to.equal(false)
    expect(backend.receivedCommands[1].gate.equal(new Rx(0.6))).to.equal(true)
    expect(backend.receivedCommands[2].gate.equal(new Rx(-0.6))).to.equal(true)
    // Test that there are no additional deallocate gates
    expect(backend.receivedCommands.length).to.equal(4)
  })

  it('should test compute uncompute no additional qubits', () => {
    // No ancilla qubit created in compute section
    const backend0 = new DummyEngine(true)
    const compare_engine0 = new CompareEngine()
    const eng0 = new MainEngine(backend0, [compare_engine0])
    let qubit = eng0.allocateQubit()
    Compute(eng0, () => {
      new Rx(0.5).or(qubit)
    })
    H.or(qubit)
    Uncompute(eng0)
    eng0.flush(true)

    expect(backend0.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend0.receivedCommands[1].gate.equal(new Rx(0.5))).to.equal(true)
    expect(backend0.receivedCommands[2].gate.equal(H)).to.equal(true)
    expect(backend0.receivedCommands[3].gate.equal(new Rx(-0.5))).to.equal(true)
    expect(backend0.receivedCommands[4].gate.equal(Deallocate)).to.equal(true)

    expect(backend0.receivedCommands[0].tags).to.deep.equal([])
    expect(backend0.receivedCommands[1].tags).to.deep.equal([new ComputeTag()])
    expect(backend0.receivedCommands[2].tags).to.deep.equal([])
    expect(backend0.receivedCommands[3].tags).to.deep.equal([new UncomputeTag()])
    expect(backend0.receivedCommands[4].tags).to.deep.equal([])

    // Same using CustomUncompute and test using CompareEngine
    const backend1 = new DummyEngine(true)
    const compare_engine1 = new CompareEngine()
    const eng1 = new MainEngine(backend1, [compare_engine1])
    qubit = eng1.allocateQubit()
    Compute(eng1, () => {
      new Rx(0.5).or(qubit)
    })
    H.or(qubit)
    CustomUncompute(eng1, () => {
      new Rx(-0.5).or(qubit)
    })
    eng1.flush(true)
    console.log(compare_engine0, compare_engine1)
    expect(compare_engine0.equal(compare_engine1)).to.equal(true)
  })

  it('should test compute uncompute with statement', () => {
    // Allocating and deallocating qubit within Compute
    const backend = new DummyEngine(true)
    const compare_engine0 = new CompareEngine()
    // Allow dirty qubits
    const dummy_cengine = new DummyEngine()
    const allow_dirty_qubits = meta_tag => (meta_tag === DirtyQubitTag)

    dummy_cengine.isMetaTagHandler = allow_dirty_qubits
    const eng = new MainEngine(backend, [compare_engine0, dummy_cengine])
    let qubit = eng.allocateQubit()

    Compute(eng, () => {
      new Rx(0.9).or(qubit)
      const ancilla = eng.allocateQubit(true)
      // ancilla2 will be deallocated in Uncompute section:
      const ancilla2 = eng.allocateQubit()
      // Test that ancilla is registered in MainEngine.active_qubits:
      expect(eng.activeQubits.has(ancilla[0])).to.equal(true)

      H.or(qubit)
      new Rx(0.5).or(ancilla)
      CNOT.or(tuple(ancilla, qubit))
      new Rx(0.7).or(qubit)
      new Rx(-0.5).or(ancilla)
      ancilla[0].deallocate()
    })

    H.or(qubit)
    Uncompute(eng)
    eng.flush(true)

    expect(backend.receivedCommands.length).to.equal(22)

    // Test each Command has correct gate
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[1].gate.equal(new Rx(0.9))).to.equal(true)
    expect(backend.receivedCommands[2].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[3].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[4].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[5].gate.equal(new Rx(0.5))).to.equal(true)
    expect(backend.receivedCommands[6].gate.equal(NOT)).to.equal(true)

    expect(backend.receivedCommands[7].gate.equal(new Rx(0.7))).to.equal(true)
    expect(backend.receivedCommands[8].gate.equal(new Rx(-0.5))).to.equal(true)
    expect(backend.receivedCommands[9].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[10].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[11].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[12].gate.equal(new Rx(0.5))).to.equal(true)
    expect(backend.receivedCommands[13].gate.equal(new Rx(-0.7))).to.equal(true)

    expect(backend.receivedCommands[14].gate.equal(NOT)).to.equal(true)
    expect(backend.receivedCommands[15].gate.equal(new Rx(-0.5))).to.equal(true)
    expect(backend.receivedCommands[16].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[17].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[18].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[19].gate.equal(new Rx(-0.9))).to.equal(true)
    expect(backend.receivedCommands[20].gate.equal(Deallocate)).to.equal(true)

    expect(backend.receivedCommands[21].gate.equal(new FlushGate())).to.equal(true)
    expect(backend.receivedCommands[20].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[20].gate.equal(Deallocate)).to.equal(true)

    // Test that each command has correct tags
    expect(backend.receivedCommands[0].tags).to.deep.equal([])
    expect(backend.receivedCommands[1].tags).to.deep.equal([new ComputeTag()])
    expect(backend.receivedCommands[2].tags).to.deep.equal([new DirtyQubitTag(), new ComputeTag()])

    backend.receivedCommands.slice(3, 9).forEach((cmd) => {
      expect(cmd.tags).to.deep.equal([new ComputeTag()])
    })

    // expect(backend.receivedCommands[9].tags == [DirtyQubitTag(),
    //       ComputeTag]
    expect(backend.receivedCommands[10].tags).to.deep.equal([])
    expect(backend.receivedCommands[11].tags).to.deep.equal([new DirtyQubitTag(), new UncomputeTag()])

    backend.receivedCommands.slice(12, 18).forEach((cmd) => {
      expect(cmd.tags).to.deep.equal([new UncomputeTag()])
    })
    expect(backend.receivedCommands[18].tags).to.deep.equal([new DirtyQubitTag(), new UncomputeTag()])
    expect(backend.receivedCommands[19].tags).to.deep.equal([new UncomputeTag()])
    expect(backend.receivedCommands[20].tags).to.deep.equal([])
    expect(backend.receivedCommands[21].tags).to.deep.equal([])

    // Test that each command has correct qubits
    // Note that ancilla qubit in compute should be
    // different from ancilla qubit in uncompute section
    const qubit_id = backend.receivedCommands[0].qubits[0][0].id
    const ancilla_compt_id = backend.receivedCommands[2].qubits[0][0].id
    const ancilla_uncompt_id = backend.receivedCommands[11].qubits[0][0].id
    const ancilla2_id = backend.receivedCommands[3].qubits[0][0].id
    expect(backend.receivedCommands[1].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[4].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[5].qubits[0][0].id).to.equal(ancilla_compt_id)
    expect(backend.receivedCommands[6].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[6].controlQubits[0].id).to.equal(ancilla_compt_id)
    expect(backend.receivedCommands[7].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[8].qubits[0][0].id).to.equal(ancilla_compt_id)
    expect(backend.receivedCommands[9].qubits[0][0].id).to.equal(ancilla_compt_id)
    expect(backend.receivedCommands[10].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[12].qubits[0][0].id).to.equal(ancilla_uncompt_id)
    expect(backend.receivedCommands[13].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[14].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[14].controlQubits[0].id).to.equal(ancilla_uncompt_id)
    expect(backend.receivedCommands[15].qubits[0][0].id).to.equal(ancilla_uncompt_id)
    expect(backend.receivedCommands[16].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[17].qubits[0][0].id).to.equal(ancilla2_id)
    expect(backend.receivedCommands[18].qubits[0][0].id).to.equal(ancilla_uncompt_id)
    expect(backend.receivedCommands[19].qubits[0][0].id).to.equal(qubit_id)
    expect(backend.receivedCommands[20].qubits[0][0].id).to.equal(qubit_id)
    // Test that ancilla qubits should have seperate ids
    expect(ancilla_uncompt_id !== ancilla_compt_id).to.equal(true)
    //
    //     # Do the same thing with CustomUncompute and compare using the
    //     # CompareEngine:
    const backend1 = new DummyEngine(true)
    const compare_engine1 = new CompareEngine()
    //     # Allow dirty qubits
    const dummy_cengine1 = new DummyEngine()
    dummy_cengine1.isMetaTagHandler = allow_dirty_qubits

    const eng1 = new MainEngine(backend1, [compare_engine1, dummy_cengine1])
    qubit = eng1.allocateQubit()
    let ancilla2
    Compute(eng1, () => {
      new Rx(0.9).or(qubit)
      const ancilla = eng1.allocateQubit(true)
      // ancilla2 will be deallocated in Uncompute section:
      ancilla2 = eng1.allocateQubit()
      // Test that ancilla is registered in MainEngine.active_qubits:

      expect(eng1.activeQubits.has(ancilla[0])).to.equal(true)
      H.or(qubit)
      new Rx(0.5).or(ancilla)
      CNOT.or(tuple(ancilla, qubit))
      new Rx(0.7).or(qubit)
      new Rx(-0.5).or(ancilla)
      ancilla[0].deallocate()
    })

    H.or(qubit)

    CustomUncompute(eng1, () => {
      const ancilla = eng1.allocateQubit(true)
      new Rx(0.5).or(ancilla)
      new Rx(-0.7).or(qubit)
      CNOT.or(tuple(ancilla, qubit))
      new Rx(-0.5).or(ancilla)
      H.or(qubit)

      expect(eng1.activeQubits.has(ancilla[0])).to.equal(true)

      ancilla2[0].deallocate()
      ancilla[0].deallocate()
      new Rx(-0.9).or(qubit)
    })

    eng1.flush(true)

    expect(compare_engine0.equal(compare_engine1)).to.equal(true)
  })

  it('should only single error in custom uncompute', () => {
    const eng = new MainEngine(new DummyEngine(), [])
    Compute(eng, () => {
      const qb = eng.allocateQubit()
      // Tests that QubitManagementError is not sent in addition
      expect(() => {
        CustomUncompute(eng, () => {})
        throw new Error('RuntimeError')
      }).to.throw()
    })
  })

  it('should qubit management error', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    Compute(eng, () => {
      const ancilla = eng.allocateQubit()
      eng.activeQubits = new Set()
      expect(() => Uncompute(eng)).to.throw(QubitManagementError)
    })
  })
  it('should qubit management error2', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    Compute(eng, () => {
      const ancilla = eng.allocateQubit()
      const local_ancilla = eng.allocateQubit()
      local_ancilla[0].deallocate()
      eng.activeQubits = new Set()
      expect(() => {
        Uncompute(eng)
      }).to.throw(QubitManagementError)
    })
  })

  it('should test exception if no compute but uncompute', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    expect(() => CustomUncompute(eng, () => {})).to.throw()
  })
  it('should test exception if no compute but uncompute 2', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    expect(() => Uncompute(eng)).to.throw()
  })
})
