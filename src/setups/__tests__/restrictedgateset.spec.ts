import { expect } from 'chai'
import { getEngineList } from '@/setups/restrictedgateset'
import { DummyEngine } from '@/cengines';
import {
  BasicGate, Rx, Rz, H, CNOT, Measure, Swap, X, Toffoli, QFT
} from '@/ops';
import MainEngine from '@/cengines/main';
import { tuple } from '@/libs/util';
import { AddConstant, AddConstantModN, MultiplyByConstantModN } from '@/libs/math/gates';
import TimeEvolution from '@/ops/timeevolution';
import QubitOperator from '@/ops/qubitoperator';
import { SpecialGate } from '../constants';

describe('restricted gate set test', () => {
  it('should test_parameter_any', () => {
    const engine_list = getEngineList(SpecialGate.Any, SpecialGate.Any);
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
  });

  it('should test_restriction', () => {
    const engine_list = getEngineList(
      [Rz, H],
      [CNOT, AddConstant, Swap],
      [Toffoli, AddConstantModN, new MultiplyByConstantModN(2, 8)]
    )
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
    new AddConstant(1).or(qubit1.concat(qubit2))
    new AddConstantModN(1, 9).or(qubit1.concat(qubit2).concat(qubit3))
    Toffoli.or(tuple(qubit1.concat(qubit2), qubit3))
    Swap.or(tuple(qubit1, qubit2))
    new MultiplyByConstantModN(2, 8).or(qubit1.concat(qubit2).concat(qubit3))
    new TimeEvolution(0.5, new QubitOperator('X0 Y1 Z2')).or(qubit1.concat(qubit2).concat(qubit3))
    QFT.or(qubit1.concat(qubit2).concat(qubit3))
    new Rx(0.1).or(qubit1)
    new MultiplyByConstantModN(2, 9).or(qubit1.concat(qubit2).concat(qubit3))
    eng.flush()
    expect(backend.receivedCommands[4].gate.equal(X)).to.equal(true)
    expect(backend.receivedCommands[4].controlQubits.length).to.equal(1)
    expect(backend.receivedCommands[5].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[6].gate.equal(new Rz(0.2))).to.equal(true)
    expect(backend.receivedCommands[7].gate.equal(Measure)).to.equal(true)
    expect(backend.receivedCommands[8].gate.equal(new AddConstant(1))).to.equal(true)
    expect(backend.receivedCommands[9].gate.equal(new AddConstantModN(1, 9))).to.equal(true)
    expect(backend.receivedCommands[10].gate.equal(X)).to.equal(true)
    expect(backend.receivedCommands[10].controlQubits.length).to.equal(2)
    expect(backend.receivedCommands[11].gate.equal(Swap)).to.equal(true)
    expect(backend.receivedCommands[12].gate.equal(new MultiplyByConstantModN(2, 8))).to.equal(true)

    backend.receivedCommands.slice(13).forEach((cmd) => {
      expect(cmd.gate.equal(QFT)).to.equal(false)
      expect(cmd.gate instanceof Rx).to.equal(false)
      expect(cmd.gate instanceof MultiplyByConstantModN).to.equal(false)
      expect(cmd.gate instanceof TimeEvolution).to.equal(false)
    })
  })

  it('should test_wrong_init', () => {
    expect(() => getEngineList('any', CNOT)).to.throw()
    expect(() => getEngineList('Any')).to.throw()
    expect(() => getEngineList('any', 'any', 'any')).to.throw()
  });
})
