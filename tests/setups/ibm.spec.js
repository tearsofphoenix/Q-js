import {expect} from 'chai'
import {getEngineList} from '../../src/setups/ibm'
import IBM5QubitMapper from '../../src/cengines/ibm5qubitmapper';
import SwapAndCNOTFlipper from '../../src/cengines/swapandcnotflipper';

describe('ibm test', () => {
  it('should test_ibm_cnot_mapper_in_cengines', () => {
    let found = 0
    const engines = getEngineList()
    engines.forEach((engine) => {
      if (engine instanceof IBM5QubitMapper) {
        found |= 1
      }
      if (engine instanceof SwapAndCNOTFlipper) {
        found |= 2
      }
    })
    expect(found).to.equal(3)
  });
})
