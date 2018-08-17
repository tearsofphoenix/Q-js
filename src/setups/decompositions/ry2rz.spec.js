import {expect} from 'chai'
import math from 'mathjs'
import {DummyEngine} from '../../cengines/testengine';
import MainEngine from '../../cengines/main';
import {Measure, Ry} from '../../ops/gates';
import ry2rz, {_recognize_RyNoCtrl} from './ry2rz';
import {Control} from '../../meta/control';
import DecompositionRuleSet from '../../cengines/replacer/decompositionruleset';
import {AutoReplacer, InstructionFilter} from '../../cengines/replacer/replacer';
import Simulator from "../../backends/simulators/simulator";

describe('ry2rz test', () => {
  it('should test_recognize_correct_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    const ctrl_qubit = eng.allocateQubit()
    eng.flush()
    new Ry(0.3).or(qubit)
    Control(eng, ctrl_qubit, () => new Ry(0.4).or(qubit))
    eng.flush(true)
    expect(_recognize_RyNoCtrl(saving_backend.receivedCommands[3])).to.equal(true)
    expect(_recognize_RyNoCtrl(saving_backend.receivedCommands[4])).to.equal(false)
  });

  const ry_decomp_gates = (eng, cmd) => {
    return !(cmd.gate instanceof Ry)
  }

  it('should test_decomposition', () => {
    const angles = [0, math.pi, 2 * math.pi, 4 * math.pi, 0.5]
    angles.forEach((angle) => {
      const states = [[1, 0], [0, 1]]
      states.forEach((basis_state) => {
        const correct_dummy_eng = new DummyEngine(true)
        const correct_eng = new MainEngine(new Simulator(), [correct_dummy_eng])

        const rule_set = new DecompositionRuleSet(ry2rz)
        const test_dummy_eng = new DummyEngine(true)
        const test_eng = new MainEngine(new Simulator(), [
          new AutoReplacer(rule_set),
          new InstructionFilter(ry_decomp_gates),
          test_dummy_eng])

        const correct_qb = correct_eng.allocateQubit()
        new Ry(angle).or(correct_qb)
        correct_eng.flush()

        const test_qb = test_eng.allocateQubit()
        new Ry(angle).or(test_qb)
        test_eng.flush()

        expect(correct_dummy_eng.receivedCommands[1].gate.equal(new Ry(angle))).to.equal(true)
        expect(test_dummy_eng.receivedCommands[1].gate.equal(new Ry(angle))).to.equal(false)

        const arr = ['0', '1']
        arr.forEach((fstate) => {
          const test = test_eng.backend.getAmplitude(fstate, test_qb)
          const correct = correct_eng.backend.getAmplitude(fstate, correct_qb)

          expect(test.re).to.be.closeTo(correct.re, 1e-12)
          expect(test.im).to.be.closeTo(correct.im, 1e-12)
        })
        Measure.or(test_qb)
        Measure.or(correct_qb)
      })
    })
  });
})
