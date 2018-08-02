import {expect} from 'chai'
import {_recognize_barrier } from './barrier'
import {DummyEngine} from '../../cengines/testengine'
import {MainEngine} from '../../cengines/main'
import {R, Barrier} from '../../ops/gates'

describe('barrier test', () => {
  it('should test_recognize_barrier', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qubit = eng.allocateQubit()
    new R(0.2).or(qubit)
    Barrier.or(qubit)
    eng.flush(true)
    // Don't test initial allocate and trailing deallocate and flush gate.
    let count = 0
    const cmds = saving_backend.receivedCommands
    cmds.slice(1, cmds.length - 2).forEach((cmd) => {
      count += _recognize_barrier(cmd)
    })
    expect(count).to.equal(2) // recognizes all gates
  });

  it('should test_remove_barrier', () => {
    const saving_backend = new DummyEngine(true)

    const my_is_available = cmd => cmd.gate !== Barrier

    saving_backend.isAvailable = my_is_available
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    new R(0.2).or(qubit)
    Barrier.or(qubit)
    eng.flush(true)
    // Don't test initial allocate and trailing deallocate and flush gate.
    const cmds = saving_backend.receivedCommands
    cmds.slice(1, cmds.length - 2).forEach((cmd) => {
      expect(cmd.gate !== Barrier)
    })
    expect(cmds.length).to.equal(1)
  });
})
