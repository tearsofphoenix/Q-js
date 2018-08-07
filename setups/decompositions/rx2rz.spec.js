import {expect} from 'chai'
import math from 'mathjs'
import {DummyEngine} from '../../cengines/testengine';
import MainEngine from '../../cengines/main';
import {Measure, Rx} from '../../ops/gates';
import {Control} from '../../meta/control';
import {_recognize_RxNoCtrl} from './rx2rz';
import DecompositionRuleSet from '../../cengines/replacer/decompositionruleset';
import Simulator from '../../backends/simulators/simulator';
import {AutoReplacer, InstructionFilter} from '../../cengines/replacer/replacer';
import rx2rz from './rx2rz';

describe('rx2rz test', () => {
  it('should test_recognize_correct_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    const ctrl_qubit = eng.allocateQubit()
    eng.flush()
    new Rx(0.3).or(qubit)
    Control(eng, ctrl_qubit, () => new Rx(0.4).or(qubit))
    eng.flush(true)

    expect(_recognize_RxNoCtrl(saving_backend.receivedCommands[3])).to.equal(true)
    expect(_recognize_RxNoCtrl(saving_backend.receivedCommands[4])).to.equal(false)
  });

  it('should test_decomposition', () => {
    const rx_decomp_gates = (eng, cmd) => !(cmd.gate instanceof Rx)
    const angles = [0, math.pi, 2 * math.pi, 4 * math.pi, 0.5]
    angles.forEach((angle) => {
      const a = [[1, 0], [0, 1]]
      a.forEach((basis_state) => {
        const correct_dummy_eng = new DummyEngine(true)
        const correct_eng = new MainEngine(new Simulator(), [correct_dummy_eng])

        const rule_set = new DecompositionRuleSet(rx2rz)
        const test_dummy_eng = new DummyEngine(true)
        const test_eng = new MainEngine(new Simulator(), [new AutoReplacer(rule_set), new InstructionFilter(rx_decomp_gates), test_dummy_eng])

        const correct_qb = correct_eng.allocateQubit()
        new Rx(angle).or(correct_qb)
        correct_eng.flush()

        const test_qb = test_eng.allocateQubit()
        new Rx(angle).or(test_qb)
        test_eng.flush()

        expect(correct_dummy_eng.receivedCommands[1].gate.equal(new Rx(angle))).to.equal(true)
        expect(test_dummy_eng.receivedCommands[1].gate.equal(new Rx(angle))).to.equal(false)

        const states = ['0', '1']
        states.forEach((fstate) => {
          const test = test_eng.backend.getAmplitude(fstate, test_qb)
          const correct = correct_eng.backend.getAmplitude(fstate, correct_qb)

          expect(math.equal(test, correct)).to.equal(true)
        })

        Measure.or(test_qb)
        Measure.or(correct_qb)
      })
    })
  });
})
