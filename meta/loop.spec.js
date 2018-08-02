import {expect} from 'chai'
import {LoopTag, LoopEngine, Loop} from './loop'
import {ComputeTag} from './tag'
import {DummyEngine} from '../cengines/testengine'
import {MainEngine} from '../cengines/main'
import {
  Allocate, Deallocate, H, X, FlushGate
} from '../ops/gates'
import {instanceOf, tuple} from '../libs/util'
import {CNOT} from '../ops/shortcuts'

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

    const allow_loop_tags = meta_tag => meta_tag.equal(new LoopTag())

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
})

//
// def test_empty_loop():
// backend = DummyEngine(save_commands=True)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
// qubit = eng.allocateQubit()
//
// assert len(backend.received_commands) == 1
// with new Loop(eng, 0):
// H.or(qubit
// assert len(backend.received_commands) == 1
//
//
// def test_empty_loop_when_loop_tag_supported_by_backend():
// backend = DummyEngine(save_commands=True)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
//
// def allow_loop_tags(self, meta_tag):
// return meta_tag == new LoopTag
//
// backend.is_meta_tag_handler = types.MethodType(allow_loop_tags, backend)
// qubit = eng.allocateQubit()
//
// assert len(backend.received_commands) == 1
// with new Loop(eng, 0):
// H.or(qubit
// assert len(backend.received_commands) == 1
//
//
// def test_loop_with_supported_loop_tag_depending_on_num():
// # Test that if loop has only one iteration, there is no loop tag
// backend = DummyEngine(save_commands=True)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
//
// def allow_loop_tags(self, meta_tag):
// return meta_tag == new LoopTag
//
// backend.is_meta_tag_handler = types.MethodType(allow_loop_tags, backend)
// qubit = eng.allocateQubit()
// with new Loop(eng, 1):
// H.or(qubit
// with new Loop(eng, 2):
// H.or(qubit
// assert len(backend.received_commands[1].tags) == 0
// assert len(backend.received_commands[2].tags) == 1
//
//
// def test_loop_unrolling():
// backend = DummyEngine(save_commands=True)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
// qubit = eng.allocateQubit()
// with new Loop(eng, 3):
// H.or(qubit
// eng.flush(deallocateQubits=True)
// assert len(backend.received_commands) == 6
//
//
// def test_loop_unrolling_with_ancillas():
// backend = DummyEngine(save_commands=True)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
// qubit = eng.allocateQubit()
// qubit_id = deepcopy(qubit[0].id)
// with new Loop(eng, 3):
// ancilla = eng.allocateQubit()
// H.or(ancilla
// CNOT.or((ancilla, qubit)
// del ancilla
// eng.flush(deallocateQubits=True)
// assert len(backend.received_commands) == 15
// assert backend.received_commands[0].gate == Allocate
// for ii in range(3):
// assert backend.received_commands[ii * 4 + 1].gate == Allocate
// assert backend.received_commands[ii * 4 + 2].gate == H
// assert backend.received_commands[ii * 4 + 3].gate == X
// assert backend.received_commands[ii * 4 + 4].gate == Deallocate
// # Check qubit ids
// assert (backend.received_commands[ii * 4 + 1].qubits[0][0].id ==
//     backend.received_commands[ii * 4 + 2].qubits[0][0].id)
// assert (backend.received_commands[ii * 4 + 1].qubits[0][0].id ==
//     backend.received_commands[ii * 4 + 3].control_qubits[0].id)
// assert (backend.received_commands[ii * 4 + 3].qubits[0][0].id ==
//     qubit_id)
// assert (backend.received_commands[ii * 4 + 1].qubits[0][0].id ==
//     backend.received_commands[ii * 4 + 4].qubits[0][0].id)
// assert backend.received_commands[13].gate == Deallocate
// assert backend.received_commands[14].gate == FlushGate()
// assert (backend.received_commands[1].qubits[0][0].id !=
//     backend.received_commands[5].qubits[0][0].id)
// assert (backend.received_commands[1].qubits[0][0].id !=
//     backend.received_commands[9].qubits[0][0].id)
// assert (backend.received_commands[5].qubits[0][0].id !=
//     backend.received_commands[9].qubits[0][0].id)
//
//
// def test_nested_loop():
// backend = DummyEngine(save_commands=True)
//
// def allow_loop_tags(self, meta_tag):
// return meta_tag == new LoopTag
//
// backend.is_meta_tag_handler = types.MethodType(allow_loop_tags, backend)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
// qubit = eng.allocateQubit()
// with new Loop(eng, 3):
// with new Loop(eng, 4):
// H.or(qubit
// eng.flush(deallocateQubits=True)
// assert len(backend.received_commands) == 4
// assert backend.received_commands[1].gate == H
// assert len(backend.received_commands[1].tags) == 2
// assert backend.received_commands[1].tags[0].num == 4
// assert backend.received_commands[1].tags[1].num == 3
// assert (backend.received_commands[1].tags[0].id !=
//     backend.received_commands[1].tags[1].id)
//
//
// def test_qubit_management_error():
// backend = DummyEngine(save_commands=True)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
// with pytest.raises(new QubitManagementError):
// with new Loop(eng, 3):
// qb = eng.allocateQubit()
//
//
// def test_qubit_management_error_when_loop_tag_supported():
// backend = DummyEngine(save_commands=True)
//
// def allow_loop_tags(self, meta_tag):
// return meta_tag == new LoopTag
//
// backend.is_meta_tag_handler = types.MethodType(allow_loop_tags, backend)
// eng = MainEngine(backend=backend, engine_list=[DummyEngine()])
// with pytest.raises(new QubitManagementError):
// with new Loop(eng, 3):
// qb = eng.allocateQubit()
