import {expect} from 'chai'
import {getEngineList} from './grid';
import GridMapper from '../cengines/twodmapper';
import {DummyEngine} from '../cengines';
import MainEngine from '../cengines/main';
import {
  BasicGate, CNOT, Swap, H, Rx, Rz, X, Measure
} from '../ops';
import {tuple} from '../libs/util';
import {len} from '../libs/polyfill';
import {AddConstant} from '../libs/math/gates';

describe('grid test', () => {
  it('should test_mapper_present_and_correct_params', () => {
    let found = false
    let mapper
    const engines = getEngineList(3, 2)
    engines.forEach((engine) => {
      if (engine instanceof GridMapper) {
        mapper = engine
        found = true
      }
    })

    expect(found).to.equal(true)
    expect(mapper.num_rows).to.equal(3)
    expect(mapper.num_columns).to.equal(2)
  })

  it('should test_parameter_any', () => {
    const engine_list = getEngineList(3, 2, 'any', 'any')
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, engine_list)
    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const gate = new BasicGate()
    gate.or(tuple(qubit1, qubit2))
    gate.or(qubit1)
    eng.flush()
    console.log(len(backend.receivedCommands))
    expect(backend.receivedCommands[2].gate.equal(gate)).to.equal(true)
    expect(backend.receivedCommands[3].gate.equal(gate)).to.equal(true)
  })

  it('should test_restriction', () => {
    const engine_list = getEngineList(3, 2, [Rz, H], [CNOT, AddConstant])
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
    new Rx(0.1).or(qubit1)
    new AddConstant(1).or(qubit1.concat(qubit2).concat(qubit3))
    eng.flush()
    expect(backend.receivedCommands[4].gate.equal(X)).to.equal(true)
    expect(len(backend.receivedCommands[4].controlQubits)).to.equal(1)
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
    expect(() => getEngineList(3, 2, 'any', CNOT)).to.throw()
    expect(() => getEngineList(3, 2, 'Any', [CNOT])).to.throw()
  });
})
