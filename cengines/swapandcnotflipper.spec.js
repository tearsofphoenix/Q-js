import {expect} from 'chai'
import SwapAndCNOTFlipper from './swapandcnotflipper'
import {Swap, H, X} from "../ops/gates"
import {CNOT} from '../ops/shortcuts'
import {tuple, instanceOf} from "../libs/util"
import {DummyEngine} from './testengine'
import {MainEngine} from './main'
import {Control} from "../meta/control"
import {Compute, Uncompute} from "../meta/compute";
import {ComputeTag, UncomputeTag} from "../meta/tag";
import {All} from '../ops/metagates'

describe('swap and cnot flipper test', () => {

  it('should test_swapandcnotflipper_missing_connection', function () {
    const flipper = new SwapAndCNOTFlipper(new Set())
    const eng = new MainEngine(new DummyEngine(true), [flipper])
    const [qubit1, qubit2] = eng.allocateQureg(2)

    expect(() => Swap.or(tuple(qubit1, qubit2))).to.throw()
  });

  it('should test_swapandcnotflipper_is_available', function () {
    const flipper = new SwapAndCNOTFlipper(new Set())
    const dummy = new DummyEngine()
    dummy.isAvailable = () => false
    flipper.next = dummy
    let eng = new MainEngine(new DummyEngine(true), [])
    const [qubit1, qubit2] = eng.allocateQureg(2)
    Swap.or(tuple(qubit1, qubit2))
    let swap_count = 0

    eng.backend.receivedCommands.forEach(cmd => {
      if (cmd.gate.equal(Swap)) {
        swap_count += 1
        expect(flipper.isAvailable(cmd)).to.equal(true)
      }
    })

    expect(swap_count).to.equal(1)

    eng = new MainEngine(new DummyEngine(true), [])
    const [qubit11, qubit21, qubit31] = eng.allocateQureg(3)

    Control(eng, qubit31, () => {
      Swap.or(tuple(qubit11, qubit21))
    })

    swap_count = 0
    eng.backend.receivedCommands.forEach(cmd => {
      if (cmd.gate.equal(Swap)) {
        swap_count += 1
        expect(flipper.isAvailable(cmd)).to.equal(false)
      }
    })

    expect(swap_count).to.equal(1)

  });

  it('should test_swapandcnotflipper_flips_cnot', function () {
    const backend = new DummyEngine(true)
    const connectivity = new Set()
    connectivity.add([0, 1])
    const flipper = new SwapAndCNOTFlipper(connectivity)
    const eng = new MainEngine(backend, [flipper])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    CNOT.or(tuple(qb0, qb1))
    CNOT.or(tuple(qb1, qb0))
    let hgates = 0
    backend.receivedCommands.forEach(cmd => {
      if (cmd.gate.equal(H)) {
        hgates += 1
      }
      if (cmd.gate.equal(X)) {
        expect(cmd.qubits[0][0].id).to.equal(1)
        expect(cmd.controlQubits[0].id).to.equal(0)
      }
    })
    expect(hgates).to.equal(4)
  });

  it('should test_swapandcnotflipper_invalid_circuit', function () {
    const backend = new DummyEngine(true)
    const connectivity = new Set()
    connectivity.add([0, 2])
    const flipper = new SwapAndCNOTFlipper(connectivity)
    const eng = new MainEngine(backend, [flipper])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    const qb2 = eng.allocateQubit()
    CNOT.or(tuple(qb0, qb2))
    CNOT.or(tuple(qb2, qb0))

    expect(() => CNOT.or(tuple(qb0, qb1))).to.throw()
    expect(() => Swap.or(tuple(qb0, qb1))).to.throw()
  });

  it('should test_swapandcnotflipper_optimize_swaps', function () {
    let backend = new DummyEngine(true)
    let connectivity = new Set()
    connectivity.add([1, 0])
    let flipper = new SwapAndCNOTFlipper(connectivity)
    let eng = new MainEngine(backend, [flipper])
    let qb0 = eng.allocateQubit()
    let qb1 = eng.allocateQubit()
    Swap.or(tuple(qb0, qb1))
    let hgates = 0

    backend.receivedCommands.forEach(cmd => {
      if (cmd.gate.equal(H)) {
        hgates += 1
      }
      if (cmd.gate.equal(X)) {
        expect(cmd.qubits[0][0].id).to.equal(0)
        expect(cmd.controlQubits[0].id).to.equal(1)
      }
    })

    expect(hgates).to.equal(4)
    backend = new DummyEngine(true)
    connectivity = new Set()
    connectivity.add([0, 1])
    flipper = new SwapAndCNOTFlipper(connectivity)
    eng = new MainEngine(backend, [flipper])
    qb0 = eng.allocateQubit()
    qb1 = eng.allocateQubit()
    Swap.or(tuple(qb0, qb1))
    hgates = 0
    backend.receivedCommands.forEach(cmd => {
      if (cmd.gate.equal(H)) {
        hgates += 1
      }
      if (cmd.gate.equal(X)) {
        expect(cmd.qubits[0][0].id).to.equal(1)
        expect(cmd.controlQubits[0].id).to.equal(0)
      }
    })
  });

  it('should test_swapandcnotflipper_keeps_tags', function () {
    const backend = new DummyEngine(true)
    const connectivity = new Set([[1, 0]])
    const flipper = new SwapAndCNOTFlipper(connectivity)
    const eng = new MainEngine(backend, [flipper])
    const qb0 = eng.allocateQubit()
    const qb1 = eng.allocateQubit()
    Compute(eng, () => {
      new All(H).or(tuple(qb0.concat(qb1)))
      CNOT.or(tuple(qb0, qb1))
      CNOT.or(tuple(qb1, qb0))
      Swap.or(tuple(qb0, qb1))
    })
    Uncompute(eng)
    let hgates = 0

    backend.receivedCommands.forEach(cmd => {
      if (cmd.gate.equal(H)) {
        console.log(cmd.tags)
        cmd.tags.forEach(t => {
          if (instanceOf(t, [ComputeTag, UncomputeTag])) {
            hgates += 1
          }
        })
      }
    })
    expect(hgates).to.equal(20)
  });
})
