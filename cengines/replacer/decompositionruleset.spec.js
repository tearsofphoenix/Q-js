import {expect} from 'chai'
import {BasicRotationGate} from '../../ops/basics'
import DecompositionRule from './decompositionrule'

describe('decomposition rule set test', () => {
  it('should test_decomposition_rule_wrong_input', () => {
    class WrongInput extends BasicRotationGate {

    }

    const noop = () => { }
    expect(() => {
      new DecompositionRule(WrongInput, noop, noop)
    }).to.throw()

    expect(() => {
      new DecompositionRule(new WrongInput(0), noop, noop)
    }).to.throw()
  });
})
