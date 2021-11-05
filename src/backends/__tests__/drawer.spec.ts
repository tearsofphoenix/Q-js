import { expect } from 'chai'
import ToLatex from '@/backends/circuits/tolatex'
import { CircuitDrawer, CircuitItem } from '@/backends/circuits/drawer'
import MainEngine from '@/cengines/main'
import { tuple } from '@/libs/util'
import { len } from '@/libs/polyfill'
import {
  CNOT, H, Measure, X
} from '@/ops'

describe('drawer test', () => {
  it('should test_drawer_getlatex', () => {
    const old_latex = ToLatex.toLatex
    ToLatex.toLatex = x => x

    const drawer = new CircuitDrawer()
    drawer.setQubitLocations({ 0: 1, 1: 0 })

    const drawer2 = new CircuitDrawer()

    const eng = new MainEngine(drawer, [drawer2])
    const qureg = eng.allocateQureg(2)
    H.or(qureg[1])
    H.or(qureg[0])
    X.or(qureg[0])
    CNOT.or(tuple(qureg[0], qureg[1]))

    let lines = drawer2.getLatex()
    expect(len(lines)).to.equal(2)
    expect(len(lines[0])).to.equal(4)
    expect(len(lines[1])).to.equal(3)

    // check if it was sent on correctly:
    lines = drawer.getLatex()
    expect(len(lines)).to.equal(2)
    expect(len(lines[0])).to.equal(3)
    expect(len(lines[1])).to.equal(4)

    ToLatex.toLatex = old_latex
  });

  it('should test_drawer_measurement', () => {
    let drawer = new CircuitDrawer(false, 0)
    let eng = new MainEngine(drawer, [])
    let qubit = eng.allocateQubit()
    Measure.or(qubit)
    expect(qubit.toNumber()).to.equal(0)

    drawer = new CircuitDrawer(false, 1)
    eng = new MainEngine(drawer, [])
    qubit = eng.allocateQubit()
    Measure.or(qubit)
    expect(qubit.toNumber()).to.equal(1)
  });

  it('should test_drawer_qubitmapping', () => {
    let drawer = new CircuitDrawer()
    // mapping should still work (no gate has been applied yet)
    const valid_mappings = [{ 0: 1, 1: 0 }, { 2: 1, 1: 2 }]
    valid_mappings.forEach((valid_mapping) => {
      drawer.setQubitLocations(valid_mapping)
      drawer = new CircuitDrawer()
    })

    // invalid mapping should raise an error:
    const invalid_mappings = [{ 3: 1, 0: 2 }, { 0: 1, 2: 1 }]
    invalid_mappings.forEach((invalid_mapping) => {
      drawer = new CircuitDrawer()
      expect(() => drawer.setQubitLocations(invalid_mapping)).to.throw()
    })

    const eng = new MainEngine(drawer, [])
    const qubit = eng.allocateQubit()
    // mapping has begun --> can't assign it anymore

    expect(() => drawer.setQubitLocations({ 0: 1, 1: 0 })).to.throw()
  });
  class MockEngine {
    isAvailable(cmd) {
      this.cmd = cmd
      this.called = true
      return false
    }
  }

  it('should test_drawer_isavailable', () => {
    const drawer = new CircuitDrawer()
    drawer.isLastEngine = true

    expect(drawer.isAvailable()).to.equal(true)
    expect(drawer.isAvailable('Everything')).to.equal(true)

    const mock_engine = new MockEngine()
    mock_engine.called = false
    drawer.isLastEngine = false
    drawer.next = mock_engine

    expect(!drawer.isAvailable()).to.equal(true)
    expect(mock_engine.called).to.equal(true)
    expect(typeof mock_engine.cmd === 'undefined').to.equal(true)
  });

  it('should test_drawer_circuititem', () => {
    const circuit_item = new CircuitItem(1, 2, 3)
    expect(circuit_item.gate).to.equal(1)
    expect(circuit_item.lines).to.equal(2)
    expect(circuit_item.ctrl_lines).to.equal(3)
    expect(circuit_item.id).to.equal(-1)

    const circuit_item2 = new CircuitItem(1, 2, 2)
    expect(circuit_item2.equal(circuit_item)).to.equal(false)

    circuit_item2.ctrl_lines = 3
    expect(circuit_item2.equal(circuit_item)).to.equal(true)

    circuit_item2.gate = 2
    expect(circuit_item2.equal(circuit_item)).to.equal(false)

    circuit_item2.gate = 1
    expect(circuit_item2.equal(circuit_item)).to.equal(true)

    circuit_item2.lines = 1
    expect(circuit_item2.equal(circuit_item)).to.equal(false)

    circuit_item2.lines = 2
    expect(circuit_item2.equal(circuit_item)).to.equal(true)
  });
})
