import {expect} from 'chai'
import math from 'mathjs'
import { MainEngine } from '../cengines/main'
import {DummyEngine} from '../cengines/testengine'
import {Command} from './command'

import {
  Rx, T, Y, Entangle
} from './gates'
import {
  C, All, DaggeredGate, ControlledGate
} from './metagates'
import {Qubit} from '../types/qubit'
import {getInverse} from './_cycle';

const np = math
const mm = math.matrix
const mc = math.complex

describe('metagates test', () => {
  it('should ', () => {
    const saving_backend = new DummyEngine(true)
    const main_engine = new MainEngine(saving_backend, [new DummyEngine()])
    const gate = new Rx(0.6)
    const qubit0 = new Qubit(main_engine, 0)
    const qubit1 = new Qubit(main_engine, 1)
    const qubit2 = new Qubit(main_engine, 2)
    const target_qubits = [qubit1, qubit2]
    C(new All(gate)).or([qubit0, target_qubits])

    const array = saving_backend.receivedCommands
    const last = array[array.length - 1]
    console.log(array)
    expect(last.gate.equal(gate)).to.equal(true)
    expect(last.controlQubits.length).to.equal(1)
  })

  it('should test daggered gate init', () => {
    // Choose gate which does not have an inverse gate:
    const not_invertible_gate = T
    expect(() => not_invertible_gate.getInverse()).to.throw()

    // Choose gate which does have an inverse defined:
    const invertible_gate = Y
    expect(invertible_gate.getInverse().equal(Y)).to.equal(true)
    // Test init and matrix
    const dagger_inv = new DaggeredGate(not_invertible_gate)
    expect(dagger_inv.gate.equal(not_invertible_gate)).to.equal(true)
    const m = mm([[1, 0],
      [0, np.exp(mc(0, -math.pi / 4))]
    ])
    expect(math.deepEqual(dagger_inv.matrix, m)).to.equal(true)
    const inv = new DaggeredGate(invertible_gate)
    expect(inv.gate.equal(invertible_gate)).to.equal(true)
    const m2 = mm([[0, mc(0, -1)], [mc(0, 1), 0]])
    expect(math.deepEqual(inv.matrix, m2)).to.equal(true)
    // Test matrix
    const no_matrix_gate = Entangle
    expect(() => no_matrix_gate.matrix).to.throw()
    const inv_no_matrix_gate = new DaggeredGate(no_matrix_gate)
    expect(() => inv_no_matrix_gate.matrix).to.throw()
  });

  it('should test daggered gate string', () => {
    const daggered_gate = new DaggeredGate(Y)
    expect(daggered_gate.toString()).to.equal(`${Y.toString()}^\dagger`)
  });

  it('should test daggered gate get inverse', () => {
    const daggered_gate = new DaggeredGate(Y)
    expect(daggered_gate.getInverse().equal(Y)).to.equal(true)
  });

  it('should test daggered gate comparison', () => {
    const daggered_gate = new DaggeredGate(Y)
    const daggered_gate2 = new DaggeredGate(Y)
    expect(daggered_gate.equal(daggered_gate2)).to.equal(true)
  });

  it('should test get inverse', () => {
    // Choose gate which does not have an inverse gate:
    const not_invertible_gate = T
    expect(() => not_invertible_gate.getInverse()).to.throw()
    // Choose gate which does have an inverse defined:
    const invertible_gate = Y
    expect(invertible_gate.getInverse().equal(Y)).to.equal(true)
    // Check get_inverse(gate)
    const inv = getInverse(not_invertible_gate)
    expect(inv instanceof DaggeredGate && inv.gate.equal(not_invertible_gate)).to.equal(true)
    const inv2 = getInverse(invertible_gate)
    expect(inv2.equal(Y)).to.equal(true)
  });

  it('should test controlled gate init', () => {
    const one_control = new ControlledGate(Y, 1)
    const two_control = new ControlledGate(Y, 2)
    const three_control = new ControlledGate(one_control, 2)
    expect(one_control.gate.equal(Y)).to.equal(true)
    expect(one_control.n).to.equal(1)
    expect(two_control.gate.equal(Y)).to.equal(true)
    expect(two_control.n).to.equal(2)
    expect(three_control.gate.equal(Y)).to.equal(true)
    expect(three_control.n).to.equal(3)
  });

  it('should test controlled gate string', () => {
    const c = new ControlledGate(Y, 2)
    expect(c.toString()).to.equal(`CC${Y.toString()}`)
  });

  it('should test controlled gate get inverse', () => {
    const one_control = new ControlledGate(new Rx(0.5), 1)
    const expected = new ControlledGate(new Rx(-0.5 + 4 * math.pi), 1)
    expect(one_control.getInverse().equal(expected)).to.equal(true)
  });

  it('should test controlled gate empty controls', () => {
    const rec = new DummyEngine(true)
    const eng = new MainEngine(rec, [])

    const a = eng.allocateQureg(1)
    new ControlledGate(Y, 0).or([[], a])
    const cmds = rec.receivedCommands
    const last = cmds[cmds.length - 1]
    expect(last.equal(new Command(eng, Y, [a]))).to.equal(true)
  });
})

// def test_controlled_gate_empty_controls():
//
// def test_controlled_gate_or():
// saving_backend = DummyEngine(save_commands=True)
// main_engine = MainEngine(backend=saving_backend,
//   engine_list=[DummyEngine()])
// gate = Rx(0.6)
// qubit0 = Qubit(main_engine, 0)
// qubit1 = Qubit(main_engine, 1)
// qubit2 = Qubit(main_engine, 2)
// qubit3 = Qubit(main_engine, 3)
// expected_cmd = Command(main_engine, gate, ([qubit3],),
//   controls=[qubit0, qubit1, qubit2])
// received_commands = []
// # Option 1:
// new ControlledGate(gate, 3) | ([qubit1], [qubit0],
//   [qubit2], [qubit3])
// # Option 2:
// new ControlledGate(gate, 3) | (qubit1, qubit0, qubit2, qubit3)
// # Option 3:
// new ControlledGate(gate, 3) | ([qubit1, qubit0], qubit2, qubit3)
// # Option 4:
// new ControlledGate(gate, 3) | (qubit1, [qubit0, qubit2], qubit3)
// # Wrong option 5:
// with pytest.raises(_metagates.ControlQubitError):
// new ControlledGate(gate, 3) | (qubit1, [qubit0, qubit2, qubit3])
// # Remove Allocate and Deallocate gates
// for cmd in saving_backend.received_commands:
// if not (isinstance(cmd.gate, FastForwardingGate) or
// isinstance(cmd.gate, ClassicalInstructionGate)):
// received_commands.append(cmd)
// assert len(received_commands) == 4
// for cmd in received_commands:
// assert cmd == expected_cmd
//
//
// def test_controlled_gate_comparison():
// gate1 = new ControlledGate(Y, 1)
// gate2 = new ControlledGate(Y, 1)
// gate3 = new ControlledGate(T, 1)
// gate4 = new ControlledGate(Y, 2)
// assert gate1 == gate2
// assert not gate1 == gate3
// assert gate1 != gate4
//
//
// def test_c():
// expected = new ControlledGate(Y, 2)
// assert _metagates.C(Y, 2) == expected
//
//
// def test_tensor_init():
// gate = _metagates.Tensor(Y)
// assert gate._gate == Y
//
//
// def test_tensor_str():
// gate = _metagates.Tensor(Y)
// assert str(gate) == "Tensor(" + str(Y) + ")"
//
//
// def test_tensor_get_inverse():
// gate = _metagates.Tensor(Rx(0.6))
// inverse = gate.get_inverse()
// assert isinstance(inverse, _metagates.Tensor)
// assert inverse._gate == Rx(-0.6 + 4 * math.pi)
//
//
// def test_tensor_comparison():
// gate1 = _metagates.Tensor(Rx(0.6))
// gate2 = _metagates.Tensor(Rx(0.6 + 4 * math.pi))
// assert gate1 == gate2
// assert gate1 != Rx(0.6)
//
//
// def test_tensor_or():
// saving_backend = DummyEngine(save_commands=True)
// main_engine = MainEngine(backend=saving_backend,
//   engine_list=[DummyEngine()])
// gate = Rx(0.6)
// qubit0 = Qubit(main_engine, 0)
// qubit1 = Qubit(main_engine, 1)
// qubit2 = Qubit(main_engine, 2)
// # Option 1:
// _metagates.Tensor(gate) | ([qubit0, qubit1, qubit2],)
// # Option 2:
// _metagates.Tensor(gate) | [qubit0, qubit1, qubit2]
// received_commands = []
// # Remove Allocate and Deallocate gates
// for cmd in saving_backend.received_commands:
// if not (isinstance(cmd.gate, FastForwardingGate) or
// isinstance(cmd.gate, ClassicalInstructionGate)):
// received_commands.append(cmd)
// # Check results
// assert len(received_commands) == 6
// qubit_ids = []
// for cmd in received_commands:
// assert len(cmd.qubits) == 1
// assert cmd.gate == gate
// qubit_ids.append(cmd.qubits[0][0].id)
// assert sorted(qubit_ids) == [0, 0, 1, 1, 2, 2]
