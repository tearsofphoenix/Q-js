import {expect} from 'chai'
import math from 'mathjs'
import {UniformlyControlledRz, Rx, UniformlyControlledRy} from '../../src/ops'
import {NotMergeable} from '../../src/meta/error'

const classList = [UniformlyControlledRz, UniformlyControlledRy]

classList.forEach((Cls) => {
  describe(`${Cls.name} test`, () => {
    it('should test init rounding', () => {
      const gate = new Cls([0.1 + 4 * math.pi, -1e-14])
      expect(gate.angles).to.deep.equal([0.1, 0])
    })

    it('should test get inverse', () => {
      const gate = new Cls([0.1, 0.2, 0.3, 0.4])
      const inverse = gate.getInverse()
      const correct = new Cls([-0.1, -0.2, -0.3, -0.4])
      expect(inverse.equal(correct)).to.equal(true)
    })

    it('should test merged', () => {
      const gate1 = new Cls([0.1, 0.2, 0.3, 0.4])
      const gate2 = new Cls([0.1, 0.2, 0.3, 0.4])
      const merged_gate = gate1.getMerged(gate2)
      expect(merged_gate.equal(new Cls([0.2, 0.4, 0.6, 0.8]))).to.equal(true)
      expect(() => gate1.getMerged(new Rx(0.1))).to.throw(NotMergeable)
    })

    it('should test toString', () => {
      const gate1 = new UniformlyControlledRy([0.1, 0.2, 0.3, 0.4])
      const gate2 = new UniformlyControlledRz([0.1, 0.2, 0.3, 0.4])
      expect(gate1.toString()).to.equal('UniformlyControlledRy([0.1, 0.2, 0.3, 0.4])')
      expect(gate2.toString()).to.equal('UniformlyControlledRz([0.1, 0.2, 0.3, 0.4])')
    })

    it('should test equality', () => {
      const gate1 = new Cls([0.1, 0.2])
      const gate2 = new Cls([0.1, 0.2 + 1e-14])
      expect(gate1.equal(gate2)).to.equal(true)
      const gate3 = new Cls([0.1, 0.2, 0.1, 0.2])
      expect(gate2.equal(gate3)).to.equal(false)
      const gate4 = new UniformlyControlledRz([0.1, 0.2])
      const gate5 = new UniformlyControlledRy([0.1, 0.2])
      expect(gate4.equal(gate5)).to.equal(false)
    });
  })
})
