import {expect} from 'chai'
import {StatePreparation} from '../../src/ops'

describe('state preparation test', () => {
  it('should test equality', () => {
    const gate1 = new StatePreparation([0.5, -0.5, 0.5, -0.5])
    const gate2 = new StatePreparation([0.5, -0.5, 0.5, -0.5])
    const gate3 = new StatePreparation([0.5, -0.5, 0.5, 0.5])

    expect(gate1.equal(gate2)).to.equal(true)
    expect(gate1.equal(gate3)).to.equal(false)
  });

  it('should test toString', () => {
    const gate1 = new StatePreparation([0, 1])
    expect(gate1.toString()).to.equal('StatePreparation')
  })
})
