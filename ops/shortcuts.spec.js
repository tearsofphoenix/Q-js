import {expect} from 'chai'
import {CRz} from './shortcuts'
import {Rz} from './gates'
import {ControlledGate} from './metagates'

describe('shortcuts test', () => {
  it('should test crz', () => {
    const gate = new CRz(0.5)
    expect(gate instanceof ControlledGate).to.equal(true)
    expect(gate.gate.equal(new Rz(0.5))).to.equal(true)
    expect(gate.n).to.equal(1)
  });
})
