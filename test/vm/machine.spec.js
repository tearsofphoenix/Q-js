import {expect} from 'chai'
import Machine from '../../src/vm/machine'
import {OP_DECL_CREG, OP_DECL_QREG, OP_Gate_OP, OP_INCLUDE, OP_Measure, OP_VERSION} from '../../src/vm/operations';

describe('machine test', () => {
  it('should execute version op', () => {
    const vm = new Machine()
    const op = {code: OP_VERSION, args: ['OPENASM', 2.0]}
    vm.execute(op)
  })

  it('should load library', function () {
    const vm = new Machine()
    const op = {code: OP_INCLUDE, args: ['qelib']}
    vm.execute(op)
    // throw for duplicate include
    expect(() => vm.execute(op)).to.throw()

    const badop = {code: OP_INCLUDE, args: ['abc']}
    expect(() => vm.execute(badop)).to.throw()
  })

  it('should throw unknow op', function () {
    const vm = new Machine()
    const op = {code: -1, args: []}
    expect(() => vm.execute(op)).to.throw()
  })

  it('should run multiple', function () {
    const vm = new Machine()
    const ops = [
      {code: OP_VERSION, args: ['OPENASM', 2.0]},
      {code: OP_INCLUDE, args: ['qelib']},
      {code: OP_DECL_QREG, args: ['q', 5]},
      {code: OP_DECL_CREG, args: ['c', 5]},
      {code: OP_Gate_OP, args: ['x', 'q', '[', 0, ']']},
      {code: OP_Measure, args: ['q', '->', 'c']}
    ]
    ops.forEach(op => vm.execute(op))
    expect(vm.result).to.deep.equal([true, false, false, false, false])
  });
})
