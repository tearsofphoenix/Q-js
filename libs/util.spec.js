import {expect} from 'chai'
import {classHierachy, isSubclassOf, isKindclassOf} from './util'
import {HGate} from '../ops/gates'
import {BasicGate, SelfInverseGate} from '../ops/basics'
import {Qureg} from '../types/qubit'

describe('util test', () => {
  it('should test class hierachy 1', () => {
    const hierachy = classHierachy(HGate)
    expect(hierachy).to.deep.equal([
      {name: 'HGate', class: HGate},
      {name: 'SelfInverseGate', class: SelfInverseGate},
      {name: 'BasicGate', class: BasicGate}])

    const h1 = classHierachy(Qureg)
    expect(h1).to.deep.equal([
      {name: 'Qureg', class: Qureg},
      {name: 'Array', class: Array}])
  });

  it('should test isSubclassOf', () => {
    expect(isSubclassOf(HGate, BasicGate)).to.equal(true)
    expect(isSubclassOf(BasicGate, BasicGate)).to.equal(false)
    expect(isSubclassOf(BasicGate, Array)).to.equal(false)
    expect(isSubclassOf(Qureg, Array)).to.equal(true)
  });

  it('should test isKindclassOf', () => {
    expect(isKindclassOf(HGate, BasicGate)).to.equal(true)
    expect(isKindclassOf(BasicGate, BasicGate)).to.equal(true)
    expect(isKindclassOf(HGate, Array)).to.equal(false)
    expect(isKindclassOf(Qureg, Array)).to.equal(true)
  });
})
