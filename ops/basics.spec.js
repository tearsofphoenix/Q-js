import {assert, expect} from 'chai'
import { MainEngine } from '../cengines/main'
import {DummyEngine} from "../cengines/testengine"
import {BasicGate} from "./basics";
import {Qubit, Qureg} from '../types/qubit'
import { Command } from './command'

function mainEngine() {
  return new MainEngine(new DummyEngine(), [new DummyEngine()])
}
describe('basics test', () => {
  it('should basic gate init', function () {
    const basicGate = new BasicGate()
    expect(basicGate.interchangeableQubitIndices).to.deep.equal([])
    expect(basicGate.getInverse).to.throw()
    try {
      basicGate.getMerged('other gate')
    } catch (e) {
      assert(true)
    }
  });

  it('should basic gate make array of qureg', function () {
    const engine = mainEngine()
    const qubit0 = new Qubit(engine, 0)
    const qubit1 = new Qubit(engine, 1)
    const qubit2 = new Qubit(engine, 2)
    const qubit3 = new Qubit(engine, 3)
    const qureg = new Qureg([qubit2, qubit3])
    const case1 = BasicGate.makeTupleOfQureg(qubit0)
    expect(case1).to.deep.equal([[qubit0]])
    const case2 = BasicGate.makeTupleOfQureg([qubit0, qubit1])
    expect(case2).to.deep.equal([[qubit0, qubit1]])
    const case3 = BasicGate.makeTupleOfQureg(qureg)
    expect(case3).to.deep.equal([qureg])
    const case4 = BasicGate.makeTupleOfQureg([qubit0])
    expect(case4).to.deep.equal([[qubit0]])
    const case5 = BasicGate.makeTupleOfQureg([qureg, qubit0])
    expect(case5).to.deep.equal([qureg, [qubit0]])
  });

  it('should basic gate generate command', function () {
    const engine = mainEngine()
    const qubit0 = new Qubit(engine, 0)
    const qubit1 = new Qubit(engine, 1)
    const qubit2 = new Qubit(engine, 2)
    const qubit3 = new Qubit(engine, 3)
    const qureg = new Qureg([qubit2, qubit3])
    const basic_gate = new BasicGate()
    // const command1 = basic_gate.generateCommand(qubit0)
    // expect(command1.equal(new Command(engine, basic_gate, [[qubit0]]))).to.equal(true)
    // const command2 = basic_gate.generateCommand([qubit0, qubit1])
    // expect(command2.equal(new Command(engine, basic_gate, [[qubit0, qubit1]]))).to.equal(true)
    // const command3 = basic_gate.generateCommand(qureg)
    // expect(command3.equal(new Command(engine, basic_gate, [qureg]))).to.equal(true)
    // const command4 = basic_gate.generateCommand([qubit0])
    // expect(command4.equal(new Command(engine, basic_gate, [[qubit0]]))).to.equal(true)
    const command5 = basic_gate.generateCommand([qureg, qubit0])
    expect(command5.equal(new Command(engine, basic_gate, [qureg, [qubit0]]))).to.equal(true)
  });
  //   def test_basic_gate_generate_command(main_engine):
//       (qureg, [qubit0]))
//
//
//   def test_basic_gate_or():
//   saving_backend = DummyEngine(save_commands=True)
//   main_engine = MainEngine(backend=saving_backend,
//       engine_list=[DummyEngine()])
//   qubit0 = new Qubit(engine, 0)
//   qubit1 = new Qubit(engine, 1)
//   qubit2 = new Qubit(engine, 2)
//   qubit3 = new Qubit(engine, 3)
//   qureg = Qureg([qubit2, qubit3])
//   basic_gate = _basics.BasicGate()
//   command1 = basic_gate.generate_command(qubit0)
//   basic_gate | qubit0
//   command2 = basic_gate.generate_command([qubit0, qubit1])
//   basic_gate | [qubit0, qubit1]
//   command3 = basic_gate.generate_command(qureg)
//   basic_gate | qureg
//   command4 = basic_gate.generate_command((qubit0,))
//   basic_gate | (qubit0,)
//   command5 = basic_gate.generate_command((qureg, qubit0))
//   basic_gate | (qureg, qubit0)
//   received_commands = []
//   # Remove Deallocate gates
//   for cmd in saving_backend.received_commands:
//   if not isinstance(cmd.gate, _basics.FastForwardingGate):
//   received_commands.append(cmd)
//   assert received_commands == ([command1, command2, command3, command4,
//     command5])
//
//
//   def test_basic_gate_compare():
//   gate1 = _basics.BasicGate()
//   gate2 = _basics.BasicGate()
//   assert gate1 == gate2
//   assert not (gate1 != gate2)
//
//
//   def test_comparing_different_gates():
//   basic_gate = _basics.BasicGate()
//   basic_rotation_gate = _basics.BasicRotationGate(1.0)
//   self_inverse_gate = _basics.SelfInverseGate()
//   assert not basic_gate == basic_rotation_gate
//   assert not basic_gate == self_inverse_gate
//   assert not self_inverse_gate == basic_rotation_gate
//
//
//   def test_basic_gate_str():
//   basic_gate = _basics.BasicGate()
//   with pytest.raises(NotImplementedError):
//   _ = str(basic_gate)
//
//
//   def test_basic_gate_hash():
//   basic_gate = _basics.BasicGate()
//   with pytest.raises(NotImplementedError):
//   _ = hash(basic_gate)
//
//
//   def test_self_inverse_gate():
//   self_inverse_gate = _basics.SelfInverseGate()
//   assert self_inverse_gate.get_inverse() == self_inverse_gate
//   assert id(self_inverse_gate.get_inverse()) != id(self_inverse_gate)
//
//
// @pytest.mark.parametrize("input_angle, modulo_angle",
//     [(2.0, 2.0), (17., 4.4336293856408275),
//       (-0.5 * math.pi, 3.5 * math.pi), (4 * math.pi, 0)])
//   def test_basic_rotation_gate_init(input_angle, modulo_angle):
//   # Test internal representation
//   gate = _basics.BasicRotationGate(input_angle)
//   assert gate.angle == pytest.approx(modulo_angle)
//
//
//   def test_basic_rotation_gate_str():
//   basic_rotation_gate = _basics.BasicRotationGate(0.5)
//   assert str(basic_rotation_gate) == "BasicRotationGate(0.5)"
//
//
//   def test_basic_rotation_tex_str():
//   basic_rotation_gate = _basics.BasicRotationGate(0.5)
//   assert basic_rotation_gate.tex_str() == "BasicRotationGate$_{0.5}$"
//   basic_rotation_gate = _basics.BasicRotationGate(4 * math.pi - 1e-13)
//   assert basic_rotation_gate.tex_str() == "BasicRotationGate$_{0.0}$"
//
//
// @pytest.mark.parametrize("input_angle, inverse_angle",
//     [(2.0, -2.0 + 4 * math.pi), (-0.5, 0.5), (0.0, 0)])
//   def test_basic_rotation_gate_get_inverse(input_angle, inverse_angle):
//   basic_rotation_gate = _basics.BasicRotationGate(input_angle)
//   inverse = basic_rotation_gate.get_inverse()
//   assert isinstance(inverse, _basics.BasicRotationGate)
//   assert inverse.angle == pytest.approx(inverse_angle)
//
//
//   def test_basic_rotation_gate_get_merged():
//   basic_gate = _basics.BasicGate()
//   basic_rotation_gate1 = _basics.BasicRotationGate(0.5)
//   basic_rotation_gate2 = _basics.BasicRotationGate(1.0)
//   basic_rotation_gate3 = _basics.BasicRotationGate(1.5)
//   with pytest.raises(_basics.NotMergeable):
//   basic_rotation_gate1.get_merged(basic_gate)
//   merged_gate = basic_rotation_gate1.get_merged(basic_rotation_gate2)
//   assert merged_gate == basic_rotation_gate3
//
//
//   def test_basic_rotation_gate_comparison_and_hash():
//   basic_rotation_gate1 = _basics.BasicRotationGate(0.5)
//   basic_rotation_gate2 = _basics.BasicRotationGate(0.5)
//   basic_rotation_gate3 = _basics.BasicRotationGate(0.5 + 4 * math.pi)
//   assert basic_rotation_gate1 == basic_rotation_gate2
//   assert hash(basic_rotation_gate1) == hash(basic_rotation_gate2)
//   assert basic_rotation_gate1 == basic_rotation_gate3
//   assert hash(basic_rotation_gate1) == hash(basic_rotation_gate3)
//   basic_rotation_gate4 = _basics.BasicRotationGate(0.50000001)
//   # Test __ne__:
//       assert basic_rotation_gate4 != basic_rotation_gate1
//   # Test one gate close to 4*pi the other one close to 0
//   basic_rotation_gate5 = _basics.BasicRotationGate(1.e-13)
//   basic_rotation_gate6 = _basics.BasicRotationGate(4 * math.pi - 1.e-13)
//   assert basic_rotation_gate5 == basic_rotation_gate6
//   assert basic_rotation_gate6 == basic_rotation_gate5
//   assert hash(basic_rotation_gate5) == hash(basic_rotation_gate6)
//   # Test different types of gates
//   basic_gate = _basics.BasicGate()
//   assert not basic_gate == basic_rotation_gate6
//   assert basic_rotation_gate2 != _basics.BasicRotationGate(0.5 + 2 * math.pi)
//
//
// @pytest.mark.parametrize("input_angle, modulo_angle",
//     [(2.0, 2.0), (17., 4.4336293856408275),
//       (-0.5 * math.pi, 1.5 * math.pi), (2 * math.pi, 0)])
//   def test_basic_phase_gate_init(input_angle, modulo_angle):
//   # Test internal representation
//   gate = _basics.BasicPhaseGate(input_angle)
//   assert gate.angle == pytest.approx(modulo_angle)
//
//
//   def test_basic_phase_gate_str():
//   basic_phase_gate = _basics.BasicPhaseGate(0.5)
//   assert str(basic_phase_gate) == "BasicPhaseGate(0.5)"
//
//
//   def test_basic_phase_tex_str():
//   basic_phase_gate = _basics.BasicPhaseGate(0.5)
//   assert basic_phase_gate.tex_str() == "BasicPhaseGate$_{0.5}$"
//   basic_rotation_gate = _basics.BasicPhaseGate(2 * math.pi - 1e-13)
//   assert basic_rotation_gate.tex_str() == "BasicPhaseGate$_{0.0}$"
//
//
// @pytest.mark.parametrize("input_angle, inverse_angle",
//     [(2.0, -2.0 + 2 * math.pi), (-0.5, 0.5), (0.0, 0)])
//   def test_basic_phase_gate_get_inverse(input_angle, inverse_angle):
//   basic_phase_gate = _basics.BasicPhaseGate(input_angle)
//   inverse = basic_phase_gate.get_inverse()
//   assert isinstance(inverse, _basics.BasicPhaseGate)
//   assert inverse.angle == pytest.approx(inverse_angle)
//
//
//   def test_basic_phase_gate_get_merged():
//   basic_gate = _basics.BasicGate()
//   basic_phase_gate1 = _basics.BasicPhaseGate(0.5)
//   basic_phase_gate2 = _basics.BasicPhaseGate(1.0)
//   basic_phase_gate3 = _basics.BasicPhaseGate(1.5)
//   with pytest.raises(_basics.NotMergeable):
//   basic_phase_gate1.get_merged(basic_gate)
//   merged_gate = basic_phase_gate1.get_merged(basic_phase_gate2)
//   assert merged_gate == basic_phase_gate3
//
//
//   def test_basic_phase_gate_comparison_and_hash():
//   basic_phase_gate1 = _basics.BasicPhaseGate(0.5)
//   basic_phase_gate2 = _basics.BasicPhaseGate(0.5)
//   basic_phase_gate3 = _basics.BasicPhaseGate(0.5 + 2 * math.pi)
//   assert basic_phase_gate1 == basic_phase_gate2
//   assert hash(basic_phase_gate1) == hash(basic_phase_gate2)
//   assert basic_phase_gate1 == basic_phase_gate3
//   assert hash(basic_phase_gate1) == hash(basic_phase_gate3)
//   basic_phase_gate4 = _basics.BasicPhaseGate(0.50000001)
//   # Test __ne__:
//       assert basic_phase_gate4 != basic_phase_gate1
//   # Test one gate close to 2*pi the other one close to 0
//   basic_phase_gate5 = _basics.BasicPhaseGate(1.e-13)
//   basic_phase_gate6 = _basics.BasicPhaseGate(2 * math.pi - 1.e-13)
//   assert basic_phase_gate5 == basic_phase_gate6
//   assert basic_phase_gate6 == basic_phase_gate5
//   assert hash(basic_phase_gate5) == hash(basic_phase_gate6)
//   # Test different types of gates
//   basic_gate = _basics.BasicGate()
//   assert not basic_gate == basic_phase_gate6
//   assert basic_phase_gate2 != _basics.BasicPhaseGate(0.5 + math.pi)
//
//
//   def test_basic_math_gate():
//   def my_math_function(a, b, c):
//   return (a, b, c + a * b)
//
//   class MyMultiplyGate(_basics.BasicMathGate):
//   def __init__(self):
//   _basics.BasicMathGate.__init__(self, my_math_function)
//
//   gate = MyMultiplyGate()
//   assert str(gate) == 'MATH'
//   # Test a=2, b=3, and c=5 should give a=2, b=3, c=11
//   math_fun = gate.get_math_function(("qreg1", "qreg2", "qreg3"))
//   assert math_fun([2, 3, 5]) == [2, 3, 11]

})
