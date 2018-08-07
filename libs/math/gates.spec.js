import {expect} from 'chai'
import {AddConstant, AddConstantModN, MultiplyByConstantModN} from "./gates";

describe('gates test', () => {
  it('should test_addconstant', function () {
    expect(new AddConstant(3).equal(new AddConstant(3))).to.equal(true)
    expect(new AddConstant(3).equal(new AddConstant(4))).to.equal(false)
    expect(new AddConstant(3).toString()).to.equal('AddConstant(3)')
  });

  it('should test_addconstantmodn', function () {
    expect(new AddConstantModN(3, 4).equal(new AddConstantModN(3, 4))).to.equal(true)
    expect(new AddConstantModN(3, 4).equal(new AddConstantModN(4, 4))).to.equal(false)
    expect(new AddConstantModN(3, 5).equal(new AddConstantModN(3, 4))).to.equal(false)

    expect(new AddConstantModN(3, 4).toString()).to.equal("AddConstantModN(3, 4)")
  });

  it('should test_multiplybyconstmodn', function () {
    expect(new MultiplyByConstantModN(3, 4).equal(new MultiplyByConstantModN(3, 4))).to.equal(true)
    expect(new MultiplyByConstantModN(3, 4).equal(new MultiplyByConstantModN(4, 4))).to.equal(false)

    expect(new MultiplyByConstantModN(3, 4).toString()).to.equal("MultiplyByConstantModN(3, 4)")
  });
})
