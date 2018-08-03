import {expect} from 'chai'

import MainEngine from '../cengines/main'
import {DummyEngine} from '../cengines/testengine'
import { H, Rx } from '../ops/gates'
import {Command} from '../ops/command'
import {ComputeTag, UncomputeTag, DirtyQubitTag} from './tag'
import {Control, ControlEngine} from './control'
import {Compute, Uncompute} from './compute'

describe('control test', () => {
  it('should control engine has compute tag', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qubit = eng.allocateQubit()
    const test_cmd0 = new Command(eng, H, [qubit])
    const test_cmd1 = new Command(eng, H, [qubit])
    const test_cmd2 = new Command(eng, H, [qubit])
    test_cmd0.tags = [DirtyQubitTag, new ComputeTag(), DirtyQubitTag]
    test_cmd1.tags = [DirtyQubitTag, new UncomputeTag(), DirtyQubitTag]
    test_cmd2.tags = [DirtyQubitTag]
    const control_eng = new ControlEngine('MockEng')
    expect(control_eng.hasComputeUnComputeTag(test_cmd0)).to.equal(true)
    expect(control_eng.hasComputeUnComputeTag(test_cmd1)).to.equal(true)
    expect(control_eng.hasComputeUnComputeTag(test_cmd2)).to.equal(false)
  });

  it('should test control', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qureg = eng.allocateQureg(2)
    let qubit
    Control(eng, qureg, () => {
      qubit = eng.allocateQubit()
      Compute(eng, () => {
        new Rx(0.5).or(qubit)
      })
      H.or(qubit)
      Uncompute(eng)
    })

    Control(eng, qureg[0], () => {
      H.or(qubit)
    })

    eng.flush()
    expect(backend.receivedCommands.length).to.equal(8)
    expect(backend.receivedCommands[0].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[1].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[2].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[3].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[4].controlQubits.length).to.equal(2)
    expect(backend.receivedCommands[5].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[6].controlQubits.length).to.equal(1)
    expect(backend.receivedCommands[7].controlQubits.length).to.equal(0)

    expect(backend.receivedCommands[4].controlQubits[0].id).to.equal(qureg[0].id)
    expect(backend.receivedCommands[4].controlQubits[1].id).to.equal(qureg[1].id)
    expect(backend.receivedCommands[6].controlQubits[0].id).to.equal(qureg[0].id)
  });
})
