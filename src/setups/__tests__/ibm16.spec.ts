import { expect } from 'chai'
import { getEngineList } from '@/setups/ibm16';
import GridMapper from '@/cengines/twodmapper';
import SwapAndCNOTFlipper from '@/cengines/swapandcnotflipper';
import { DummyEngine } from '@/cengines';
import MainEngine from '@/cengines/main';
import { AddConstant } from '@/libs/math/gates';
import { QFT } from '@/ops';
import { getInverse } from '@/ops/_cycle';

describe('ibm16 test', () => {
  it('should test_mappers_in_cengines', () => {
    let found = 0
    getEngineList().forEach((engine) => {
      if (engine instanceof GridMapper) {
        found |= 1
      }
      if (engine instanceof SwapAndCNOTFlipper) {
        found |= 2
      }
    })
    expect(found).to.equal(3)
  })

  it('should test_high_level_gate_set', () => {
    let mod_list = getEngineList()
    const saving_engine = new DummyEngine(true)
    mod_list = mod_list.slice(0, 6).concat([saving_engine]).concat(mod_list.slice(6))
    const eng = new MainEngine(new DummyEngine(), mod_list)
    const qureg = eng.allocateQureg(3)
    new AddConstant(3).or(qureg)
    QFT.or(qureg)
    eng.flush()
    const received_gates = saving_engine.receivedCommands.map(cmd => cmd.gate)
    const sum = received_gates.filter(g => g.equal(QFT)).length
    expect(sum).to.equal(1)

    let foundQFT = false
    let foundAddConstant = false
    received_gates.forEach((g) => {
      if (g.equal(getInverse(QFT))) {
        foundQFT = true
      }
      if (g.equal(new AddConstant(3))) {
        foundAddConstant = true
      }
    })

    expect(foundQFT).to.equal(false)
    expect(foundAddConstant).to.equal(false)
  });
})
