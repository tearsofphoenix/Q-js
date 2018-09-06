import {expect} from 'chai'
import math from 'mathjs'
import {U} from '../../src/vm/builtin'
import {X, Y, Z} from '../../src/ops'

describe('builtin test', () => {
  it('should test U', () => {
    const g = U(Math.PI, 0, Math.PI)
    expect(g.toString()).to.equal('U')
    console.log(g.matrix._data)
    console.log(U(0, Math.PI, Math.PI).matrix._data)
    console.log(U(Math.PI, Math.PI, 0).matrix._data)
    // expect(math.deepEqual(g.matrix, X.matrix)).to.equal(true)

    const z = U(0, 0, Math.PI)
    console.log(z.matrix._data, Z.matrix._data)

    const y = U(Math.PI, Math.PI / 2, Math.PI / 2)
    console.log(y.matrix._data, Y.matrix._data)
  });
})
