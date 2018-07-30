import {expect} from 'chai'

import math from 'mathjs'
import { MainEngine } from '../cengines/main'
import {DummyEngine} from '../cengines/testengine'
import { H } from '../ops/gates'
import {Command} from '../ops/command'
import {ComputeTag, UncomputeTag, DirtyQubitTag} from './tag'
import {Control, ControlEngine} from './control'

describe('control test', () => {
  it('should control engine has compute tag', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qubit = eng.allocateQubit()
    const test_cmd0 = new Command(eng, H, [qubit])
    const test_cmd1 = new Command(eng, H, [qubit])
    const test_cmd2 = new Command(eng, H, [qubit])
    test_cmd0.tags = [DirtyQubitTag, ComputeTag, DirtyQubitTag]
    test_cmd1.tags = [DirtyQubitTag, UncomputeTag, DirtyQubitTag]
    test_cmd2.tags = [DirtyQubitTag]
    const control_eng = new ControlEngine('MockEng')
    expect(control_eng.hasComputeUnComputeTag(test_cmd0)).to.equal(true)
    expect(control_eng.hasComputeUnComputeTag(test_cmd1)).to.equal(true)
    expect(control_eng.hasComputeUnComputeTag(test_cmd2)).to.equal(false)
  });

  it('should test control', function () {
    const backend = new DummyEngine(true)
    const eng = MainEngine(backend, [new DummyEngine()])
    const qureg = eng.allocateQureg(2)
    let qubit
    Control(eng, qureg, () => qubit = eng.allocateQubit())
    with Compute(eng):
    Rx(0.5) | qubit
    H | qubit
    Uncompute(eng)
    with _control.Control(eng, qureg[0]):
    H | qubit
    eng.flush()
    assert len(backend.received_commands) == 8
    assert len(backend.received_commands[0].control_qubits) == 0
    assert len(backend.received_commands[1].control_qubits) == 0
    assert len(backend.received_commands[2].control_qubits) == 0
    assert len(backend.received_commands[3].control_qubits) == 0
    assert len(backend.received_commands[4].control_qubits) == 2
    assert len(backend.received_commands[5].control_qubits) == 0
    assert len(backend.received_commands[6].control_qubits) == 1
    assert len(backend.received_commands[7].control_qubits) == 0
    assert backend.received_commands[4].control_qubits[0].id == qureg[0].id
    assert backend.received_commands[4].control_qubits[1].id == qureg[1].id
    assert backend.received_commands[6].control_qubits[0].id == qureg[0].id
  });
})
