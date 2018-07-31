import {expect} from 'chai'
import {ComputeTag, UncomputeTag} from './tag'
import {
  Allocate, Deallocate, H, Rx, Ry
} from '../ops/gates'
// import {} from '../ops/metagates'
import {MainEngine} from '../cengines/main'
import {DummyEngine, CompareEngine} from '../cengines/testengine'
import {
  ComputeEngine, UncomputeEngine, Compute, Uncompute, CustomUncompute
} from './compute'

describe('compute test', () => {
  it('should test compute tag', () => {
    const tag0 = ComputeTag
    const tag1 = ComputeTag
    expect(tag0 === tag1).to.equal(true)
    expect(tag0).to.equal(tag1)
    expect(tag0 === new Object()).to.equal(false)
  });

  it('should test uncompute tag', () => {
    const tag0 = UncomputeTag
    const tag1 = UncomputeTag
    expect(tag0 === tag1).to.equal(true)
    expect(tag0).to.equal(tag1)
    expect(tag0 === new Object()).to.equal(false)
  });

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
    expect(backend.receivedCommands[0].tags).to.deep.equal([ComputeTag])
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[1].tags).to.deep.equal([ComputeTag, 'TagAddedLater'])

    expect(backend.receivedCommands[2].gate.equal(new Rx(0.6))).to.equal(true)
    expect(backend.receivedCommands[2].tags).to.deep.equal([ComputeTag])
    expect(backend.receivedCommands[3].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[3].tags).to.deep.equal([ComputeTag])

    expect(backend.receivedCommands[4].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[4].tags).to.deep.equal([])
    expect(backend.receivedCommands[5].gate.equal(new Ry(0.5))).to.equal(true)
    expect(backend.receivedCommands[5].tags).to.deep.equal([])

    expect(backend.receivedCommands[6].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[6].tags).to.deep.equal([UncomputeTag])
    expect(backend.receivedCommands[7].gate.equal(new Ry(-0.6))).to.equal(true)
    expect(backend.receivedCommands[7].tags).to.deep.equal([UncomputeTag])

    expect(backend.receivedCommands[8].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[8].tags).to.deep.equal([UncomputeTag])
    expect(backend.receivedCommands[9].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[9].tags).to.deep.equal([UncomputeTag])
  });

  it('should test uncompute engine', () => {
    const backend = new DummyEngine(true)
    const uncompute_engine = new UncomputeEngine()
    const eng = new MainEngine(backend, [uncompute_engine])
    const qubit = eng.allocateQubit()
    H.or(qubit)
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[0].tags).to.deep.equal([UncomputeTag])
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[1].tags).to.deep.equal([UncomputeTag])
  });

  it('should test outside qubit deallocated in compute', () => {
    // Test that there is an error if a qubit is deallocated which has
    // not been allocated within the with Compute(eng) context
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qubit = eng.allocateQubit()
    expect(() => Compute(eng, () => qubit[0].deallocate())).to.throw()
  });

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
  });

  it('should test deallocation using custom uncompute2', () => {
    // Test not allowed version:
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    Compute(eng, () => {
      const a = eng.allocateQubit()
      expect(() => {
        CustomUncompute(eng, () => {

        })
      }).to.throw()
      H.or(a)
    })
  });

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
    }).to.throw()
    H.or(a)
  });

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
  });

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
    expect(backend0.receivedCommands[1].tags).to.deep.equal([ComputeTag])
    expect(backend0.receivedCommands[2].tags).to.deep.equal([])
    expect(backend0.receivedCommands[3].tags).to.deep.equal([UncomputeTag])
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
  });

  it('should test compute uncompute with statement', () => {
    // # Allocating and deallocating qubit within Compute
    // backend = DummyEngine(save_commands=True)
    // compare_engine0 = CompareEngine()
    // # Allow dirty qubits
    // dummy_cengine = DummyEngine()
    //
    // def allow_dirty_qubits(self, meta_tag):
    // return meta_tag == DirtyQubitTag
    // dummy_cengine.is_meta_tag_handler = types.MethodType(allow_dirty_qubits,
    //     dummy_cengine)
    // eng = MainEngine(backend=backend,
    //     engine_list=[compare_engine0, dummy_cengine])
    // qubit = eng.allocate_qubit()
    // with _compute.Compute(eng):
    // Rx(0.9) | qubit
    // ancilla = eng.allocate_qubit(dirty=True)
    // # ancilla2 will be deallocated in Uncompute section:
    //     ancilla2 = eng.allocate_qubit()
    // # Test that ancilla is registered in MainEngine.active_qubits:
    // assert ancilla[0] in eng.active_qubits
    // H | qubit
    // Rx(0.5) | ancilla
    // CNOT | (ancilla, qubit)
    // Rx(0.7) | qubit
    // Rx(-0.5) | ancilla
    // ancilla[0].__del__()
    // H | qubit
    // _compute.Uncompute(eng)
    // eng.flush(deallocate_qubits=True)
    // assert len(backend.received_commands) == 22
    // # Test each Command has correct gate
    // assert backend.received_commands[0].gate == Allocate
    // assert backend.received_commands[1].gate == Rx(0.9)
    // assert backend.received_commands[2].gate == Allocate
    // assert backend.received_commands[3].gate == Allocate
    // assert backend.received_commands[4].gate == H
    // assert backend.received_commands[5].gate == Rx(0.5)
    // assert backend.received_commands[6].gate == NOT
    // assert backend.received_commands[7].gate == Rx(0.7)
    // assert backend.received_commands[8].gate == Rx(-0.5)
    // assert backend.received_commands[9].gate == Deallocate
    // assert backend.received_commands[10].gate == H
    // assert backend.received_commands[11].gate == Allocate
    // assert backend.received_commands[12].gate == Rx(0.5)
    // assert backend.received_commands[13].gate == Rx(-0.7)
    // assert backend.received_commands[14].gate == NOT
    // assert backend.received_commands[15].gate == Rx(-0.5)
    // assert backend.received_commands[16].gate == H
    // assert backend.received_commands[17].gate == Deallocate
    // assert backend.received_commands[18].gate == Deallocate
    // assert backend.received_commands[19].gate == Rx(-0.9)
    // assert backend.received_commands[20].gate == Deallocate
    // assert backend.received_commands[21].gate == FlushGate()
    // # Test that each command has correct tags
    // assert backend.received_commands[0].tags == []
    // assert backend.received_commands[1].tags == [ComputeTag]
    // assert backend.received_commands[2].tags == [DirtyQubitTag(),
    //   ComputeTag]
    // for cmd in backend.received_commands[3:9]:
    // assert cmd.tags == [ComputeTag]
    // assert backend.received_commands[9].tags == [DirtyQubitTag(),
    //   ComputeTag]
    // assert backend.received_commands[10].tags == []
    // assert backend.received_commands[11].tags == [DirtyQubitTag(),
    //   UncomputeTag]
    // for cmd in backend.received_commands[12:18]:
    // assert cmd.tags == [UncomputeTag]
    // assert backend.received_commands[18].tags == [DirtyQubitTag(),
    //   UncomputeTag]
    // assert backend.received_commands[19].tags == [UncomputeTag]
    // assert backend.received_commands[20].tags == []
    // assert backend.received_commands[21].tags == []
    // # Test that each command has correct qubits
    // # Note that ancilla qubit in compute should be
    // # different from ancilla qubit in uncompute section
    // qubit_id = backend.received_commands[0].qubits[0][0].id
    // ancilla_compt_id = backend.received_commands[2].qubits[0][0].id
    // ancilla_uncompt_id = backend.received_commands[11].qubits[0][0].id
    // ancilla2_id = backend.received_commands[3].qubits[0][0].id
    // assert backend.received_commands[1].qubits[0][0].id == qubit_id
    // assert backend.received_commands[4].qubits[0][0].id == qubit_id
    // assert backend.received_commands[5].qubits[0][0].id == ancilla_compt_id
    // assert backend.received_commands[6].qubits[0][0].id == qubit_id
    // assert (backend.received_commands[6].control_qubits[0].id ==
    //     ancilla_compt_id)
    // assert backend.received_commands[7].qubits[0][0].id == qubit_id
    // assert backend.received_commands[8].qubits[0][0].id == ancilla_compt_id
    // assert backend.received_commands[9].qubits[0][0].id == ancilla_compt_id
    // assert backend.received_commands[10].qubits[0][0].id == qubit_id
    // assert backend.received_commands[12].qubits[0][0].id == ancilla_uncompt_id
    // assert backend.received_commands[13].qubits[0][0].id == qubit_id
    // assert backend.received_commands[14].qubits[0][0].id == qubit_id
    // assert (backend.received_commands[14].control_qubits[0].id ==
    //     ancilla_uncompt_id)
    // assert backend.received_commands[15].qubits[0][0].id == ancilla_uncompt_id
    // assert backend.received_commands[16].qubits[0][0].id == qubit_id
    // assert backend.received_commands[17].qubits[0][0].id == ancilla2_id
    // assert backend.received_commands[18].qubits[0][0].id == ancilla_uncompt_id
    // assert backend.received_commands[19].qubits[0][0].id == qubit_id
    // assert backend.received_commands[20].qubits[0][0].id == qubit_id
    // # Test that ancilla qubits should have seperate ids
    // assert ancilla_uncompt_id != ancilla_compt_id
    //
    // # Do the same thing with CustomUncompute and compare using the
    // # CompareEngine:
    // backend1 = DummyEngine(save_commands=True)
    // compare_engine1 = CompareEngine()
    // # Allow dirty qubits
    // dummy_cengine1 = DummyEngine()
  });

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
  });

  it('should qubit management error', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    Compute(eng, () => {
      const ancilla = eng.allocateQubit()
      eng.activeQubits = new Set()
      expect(() => Uncompute(eng)).to.throw()
    })
  });
  it('should qubit management error2', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    Compute(eng, () => {
      const ancilla = eng.allocateQubit()
      const local_ancilla = eng.allocateQubit()
      local_ancilla[0].deallocate()
      eng.activeQubits = new Set()
      expect(() => {
        Uncompute(eng)
      }).to.throw()
    })
  });

  it('should test exception if no compute but uncompute', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    expect(() => CustomUncompute(eng, () => {})).to.throw()
  });
  it('should test exception if no compute but uncompute 2', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    expect(() => Uncompute(eng)).to.throw()
  });

  it('should allow dirty qubits', function () {

  });
})

//
// def allow_dirty_qubits(self, meta_tag):
// return meta_tag == DirtyQubitTag
// dummy_cengine1.is_meta_tag_handler = types.MethodType(allow_dirty_qubits,
//     dummy_cengine1)
// eng1 = MainEngine(backend=backend1,
//     engine_list=[compare_engine1, dummy_cengine1])
// qubit = eng1.allocate_qubit()
// with _compute.Compute(eng1):
// Rx(0.9) | qubit
// ancilla = eng1.allocate_qubit(dirty=True)
// # ancilla2 will be deallocated in Uncompute section:
//     ancilla2 = eng1.allocate_qubit()
// # Test that ancilla is registered in MainEngine.active_qubits:
// assert ancilla[0] in eng1.active_qubits
// H | qubit
// Rx(0.5) | ancilla
// CNOT | (ancilla, qubit)
// Rx(0.7) | qubit
// Rx(-0.5) | ancilla
// ancilla[0].__del__()
// H | qubit
// with _compute.CustomUncompute(eng1):
// ancilla = eng1.allocate_qubit(dirty=True)
// Rx(0.5) | ancilla
// Rx(-0.7) | qubit
// CNOT | (ancilla, qubit)
// Rx(-0.5) | ancilla
// H | qubit
// assert ancilla[0] in eng1.active_qubits
// ancilla2[0].__del__()
// ancilla[0].__del__()
// Rx(-0.9) | qubit
// eng1.flush(deallocate_qubits=True)
// assert compare_engine0 == compare_engine1
