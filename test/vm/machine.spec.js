import {expect} from 'chai'
import path from 'path'
import fs from 'fs'
import {
  OP_DECL_CREG, OP_DECL_QREG, OP_GATE_OP, OP_INCLUDE, OP_MEASURE, OP_VERSION
} from 'qasm/src/opcode'
import {parse, printOperations, opToString} from 'qasm'
import Machine from '../../src/vm/machine'

describe('machine test', () => {
  it('should execute version op', () => {
    const vm = new Machine()
    const op = {code: OP_VERSION, args: ['OPENASM', 2.0]}
    vm.execute(op)
  })

  it('should load library', () => {
    const vm = new Machine()
    const op = {code: OP_INCLUDE, args: ['qelib1.inc']}
    vm.execute(op)
    console.log(vm.libraries)
    console.log(vm.currentContext)
    // throw for duplicate include
    expect(() => vm.execute(op)).to.throw()

    const badop = {code: OP_INCLUDE, args: ['abc']}
    expect(() => vm.execute(badop)).to.throw()
  })

  it('should throw unknow op', () => {
    const vm = new Machine()
    const op = {code: -1, args: []}
    expect(() => vm.execute(op)).to.throw()
  })

  it('should run multiple', () => {
    const vm = new Machine()
    const ops = [
      {code: OP_VERSION, args: ['OPENASM', 2.0]},
      {code: OP_INCLUDE, args: ['qelib1.inc']},
      {code: OP_DECL_QREG, args: ['q', 5]},
      {code: OP_DECL_CREG, args: ['c', 5]},
      {code: OP_GATE_OP, args: ['x', 'q', '[', 0, ']']},
      {code: OP_MEASURE, args: ['q', '->', 'c']}
    ]
    ops.forEach(op => vm.execute(op))
    expect(vm.result).to.deep.equal([true, false, false, false, false])
  });

  it('should parse qasm source code', function () {
    const content = fs.readFileSync(path.resolve(__dirname, './test1.qasm'), {encoding: 'utf8'})
    const {value} = parse(content)
    value.forEach(v => console.log(v.args, opToString(v)))
    printOperations(value)
  });
})
