import {expect} from 'chai'
import {BasicEngine, ForwarderEngine} from './basics'
import {InstructionFilter} from './replacer/replacer'
import {DirtyQubitTag} from '../meta/tag'
import {H, AllocateQubitGate, DeallocateQubitGate} from '../ops/gates'
import {DummyEngine} from './testengine'
import {MainEngine} from './main'
import {Qubit} from '../types/qubit'
import {ClassicalInstructionGate, FastForwardingGate} from '../ops/basics';

describe('basics test', () => {
  it('should test_basic_engine_init', () => {
    const eng = new BasicEngine()
    expect(typeof eng.main).to.equal('undefined')
    expect(typeof eng.next).to.equal('undefined')
    expect(eng.isLastEngine).to.equal(false)
  });

  it('should test_basic_engine_is_available', () => {
    const eng = new BasicEngine()
    expect(() => {
      eng.isLastEngine = true
      eng.isAvailable('FakeCommand')
    }).to.throw()


    const filter = cmd => (cmd === 'supported')

    const filter_eng = new InstructionFilter(filter)
    eng.next = filter_eng
    eng.isLastEngine = false

    expect(eng.isAvailable('supported')).to.equal(true)
    expect(eng.isAvailable('something else')).to.equal(false)
  });

  it('should test_basic_engine_allocate_and_deallocate_qubit_and_qureg', () => {
    const eng = new BasicEngine()
    // custom receive function which checks that main_engine does not send
    // any allocate or deallocate gates
    let cmd_sent_by_main_engine = []

    const receive = cmd_list => cmd_sent_by_main_engine = cmd_sent_by_main_engine.concat(cmd_list)

    eng.receive = receive.bind(eng)
    // Create test engines:
    const saving_backend = new DummyEngine(true)
    const main = new MainEngine(saving_backend, [eng, new DummyEngine()])
    // Allocate and deallocate qubits
    const qubit = eng.allocateQubit()
    // Try to allocate dirty qubit but it should give a non dirty qubit
    const not_dirty_qubit = eng.allocateQubit(true)

    // Allocate an actual dirty qubit
    const allow_dirty_qubits = meta_tag => meta_tag === DirtyQubitTag

    saving_backend.isMetaTagHandler = allow_dirty_qubits.bind(saving_backend)
    const dirty_qubit = eng.allocateQubit(true)
    const qureg = eng.allocateQureg(2)

    // Test qubit allocation
    expect(Array.isArray(qubit)).to.equal(true)
    expect(qubit.length === 1 && qubit[0] instanceof Qubit).to.equal(true)
    expect(main.activeQubits.has(qubit[0])).to.equal(true)
    expect(qubit[0].engine === eng).to.equal(true)

    // Test non dirty qubit allocation
    expect(Array.isArray(not_dirty_qubit)).to.equal(true)
    expect(not_dirty_qubit.length === 1 && not_dirty_qubit[0] instanceof Qubit).to.equal(true)
    expect(main.activeQubits.has(not_dirty_qubit[0])).to.equal(true)
    expect(not_dirty_qubit[0].engine === eng).to.equal(true)

    // Test dirty_qubit allocation
    expect(Array.isArray(dirty_qubit)).to.equal(true)
    expect(dirty_qubit.length === 1 && dirty_qubit[0] instanceof Qubit).to.equal(true)
    expect(main.activeQubits.has(dirty_qubit[0])).to.equal(true)
    expect(main.dirtyQubits.has(dirty_qubit[0].id)).to.equal(true)
    expect(dirty_qubit[0].engine === eng).to.equal(true)

    // Test qureg allocation
    expect(Array.isArray(qureg)).to.equal(true)
    expect(qureg.length).to.equal(2)

    qureg.forEach((tmp_qubit) => {
      expect(main.activeQubits.has(tmp_qubit)).to.equal(true)
      expect(tmp_qubit.engine === eng).to.equal(true)
    })

    // Test uniqueness of ids
    expect(new Set([qubit[0].id, not_dirty_qubit[0].id, dirty_qubit[0].id,
      qureg[0].id, qureg[1].id]).size).to.equal(5)

    // Test allocate gates were sent
    expect(cmd_sent_by_main_engine.length).to.equal(0)
    expect(saving_backend.receivedCommands.length).to.equal(5)

    saving_backend.receivedCommands.forEach((cmd) => {
      expect(cmd.gate.equal(new AllocateQubitGate())).to.equal(true)
    })

    expect(saving_backend.receivedCommands[2].tags).to.deep.equal([DirtyQubitTag])

    // Test deallocate gates were sent
    eng.deallocateQubit(qubit[0])
    eng.deallocateQubit(not_dirty_qubit[0])
    eng.deallocateQubit(dirty_qubit[0])
    eng.deallocateQubit(qureg[0])
    eng.deallocateQubit(qureg[1])

    expect(cmd_sent_by_main_engine.length).to.equal(0)
    expect(saving_backend.receivedCommands.length).to.equal(10)
    const rest = saving_backend.receivedCommands.slice(5, 10)
    rest.forEach((cmd) => {
      expect(cmd.gate.equal(new DeallocateQubitGate())).to.equal(true)
    })

    expect(saving_backend.receivedCommands[7].tags).to.deep.equal([DirtyQubitTag])
  });

  it('should test_deallocate_qubit_exception', () => {
    const eng = new BasicEngine()
    const qubit = new Qubit(eng, -1)
    expect(() => eng.deallocateQubit(qubit)).to.throw()
  });

  it('should test_basic_engine_is_meta_tag_supported', () => {
    const eng = new BasicEngine()
    // BasicEngine needs receive function to function so let's add it:

    const receive = function (cmd_list) {
      this.send(cmd_list)
    }

    eng.receive = receive.bind(eng)

    const backend = new DummyEngine()
    const engine0 = new DummyEngine()
    const engine1 = new DummyEngine()
    const engine2 = new DummyEngine()

    const allow_dirty_qubits = meta_tag => (meta_tag === DirtyQubitTag)

    engine2.isMetaTagHandler = allow_dirty_qubits.bind(engine2)
    const main_engine = new MainEngine(backend, [engine0, engine1, engine2])
    expect(main_engine.isMetaTagSupported('NotSupported')).to.equal(false)
    expect(main_engine.isMetaTagSupported(DirtyQubitTag)).to.equal(true)
  });

  it('should test forward engine', () => {
    const backend = new DummyEngine(true)
    const engine0 = new DummyEngine()
    const main_engine = new MainEngine(backend, [engine0])

    const cmd_mod_fun = (cmd) => {
      cmd.tags = 'NewTag'
      return cmd
    }

    const forwarder_eng = new ForwarderEngine(backend, cmd_mod_fun)
    engine0.next = forwarder_eng
    const forwarder_eng2 = new ForwarderEngine(engine0)
    main_engine.next = forwarder_eng2
    const qubit = main_engine.allocateQubit()
    H.or(qubit)
    // Test if H gate was sent through forwarder_eng and tag was added
    const received_commands = []
    // Remove Allocate and Deallocate gates
    backend.receivedCommands.forEach((cmd) => {
      if (!(cmd.gate instanceof FastForwardingGate || cmd.gate instanceof ClassicalInstructionGate)) {
        received_commands.push(cmd)
      }
    })

    received_commands.forEach(cmd => console.log(cmd))
    expect(received_commands.length).to.equal(1)
    expect(received_commands[0].gate.equal(H)).to.equal(true)
    expect(received_commands[0].tags).to.deep.equal('NewTag')
  });
})
