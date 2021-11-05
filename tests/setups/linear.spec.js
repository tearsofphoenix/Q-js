import {expect} from 'chai'
import {getEngineList} from '../../src/setups/linear'
import LinearMapper from '../../src/cengines/linearmapper';
import {DummyEngine} from '../../src/cengines';
import {
  BasicGate, Rx, Rz, H, CNOT, Measure, Swap, X
} from '../../src/ops';
import MainEngine from '../../src/cengines/main';
import {tuple} from '../../src/libs/util';
import {AddConstant} from '../../src/libs/math/gates';

describe('linear test', () => {
  it('should test_mapper_present_and_correct_params', () => {
    let found = false
    let mapper = null

    const list = getEngineList(10, true)
    list.forEach((engine) => {
      if (engine instanceof LinearMapper) {
        mapper = engine
        found = true
      }
    })

    expect(found).to.equal(true)
    expect(mapper.num_qubits).to.equal(10)
    expect(mapper.cyclic).to.equal(true)
  });

  it('should test_parameter_any', () => {
    const engine_list = getEngineList(10, false, 'any', 'any')
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, engine_list)
    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const gate = new BasicGate()
    gate.or(tuple(qubit1, qubit2))
    gate.or(qubit1)
    eng.flush()
    console.log(backend.receivedCommands.length)
    expect(backend.receivedCommands[2].gate.equal(gate)).to.equal(true)
    expect(backend.receivedCommands[3].gate.equal(gate)).to.equal(true)
  })

  it('should test_restriction', () => {
    const engine_list = getEngineList(10, false, [Rz, H], [CNOT, AddConstant])
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, engine_list)
    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const qubit3 = eng.allocateQubit()
    eng.flush()
    CNOT.or(tuple(qubit1, qubit2))
    H.or(qubit1)
    new Rz(0.2).or(qubit1)
    Measure.or(qubit1)
    Swap.or(tuple(qubit1, qubit2))
    new Rx(0.1).or(tuple(qubit1))
    new AddConstant(1).or(qubit1.concat(qubit2).concat(qubit3))
    eng.flush()
    expect(backend.receivedCommands[4].gate.equal(X)).to.equal(true)
    expect(backend.receivedCommands[4].controlQubits.length).equal(1)
    expect(backend.receivedCommands[5].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[6].gate.equal(new Rz(0.2))).to.equal(true)
    expect(backend.receivedCommands[7].gate.equal(Measure)).to.equal(true)

    backend.receivedCommands.slice(7).forEach((cmd) => {
      expect(cmd.gate.equal(Swap)).to.equal(false)
      expect(cmd.gate instanceof Rx).to.equal(false)
      expect(cmd.gate instanceof AddConstant).to.equal(false)
    })
  });

  it('should test_wrong_init', () => {
    expect(() => getEngineList(10, false, 'any', CNOT)).to.throw()
    expect(() => getEngineList(10, false, 'Any', [CNOT])).to.throw()
  });
})
