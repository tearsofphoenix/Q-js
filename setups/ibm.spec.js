import {expect} from 'chai'
import {getEngineList} from './ibm'
import IBM5QubitMapper from "../cengines/ibm5qubitmapper";
import SwapAndCNOTFlipper from "../cengines/swapandcnotflipper";

describe('ibm test', () => {
  it('should test_ibm_cnot_mapper_in_cengines', function () {
    let found = 0
    const engines = getEngineList()
    engines.forEach(engine => {
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
