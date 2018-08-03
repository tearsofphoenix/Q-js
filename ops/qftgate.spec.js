import {expect} from 'chai'
import {QFT} from './qftgate'

describe('QFT gate test', () => {
  it('should test_qft_gate_str', () => {
    const gate = QFT
    expect(gate.toString()).to.equal('QFT')
  })
})
