import Library from './library'

import {
  OP_DECL_CREG,
  OP_DECL_GATE,
  OP_OPAQUE,
  OP_DECL_QREG,
  OP_INCLUDE,
  OP_VERSION,
  OP_U,
  OP_CX,
  OP_BARRIER,
  OP_RESET,
  OP_MEASURE, OP_GATE_OP, OP_TEST
} from 'qasm/src/opcode'

import parse from 'qasm/src/parser'
import Simulator from '../backends/simulators/simulator'

import qelib from './qelib'
import MainEngine from '../cengines/main'
import {
  All, Barrier, Measure, X
} from '../ops'

class Gate {
  constructor(name, params, qargs, body) {
    this.name = name
    this.params = params
    this.qargs = qargs
    this.body = body
  }

  execute(args) {
    // TODO
  }
}

/**
 * @class Machine
 */
export default class Machine {
  constructor() {
    this.ops = []
    this.libraries = []
    this.currentContext = {}
    this.simulator = new Simulator()
    this.engine = new MainEngine(this.simulator)
    this.stack = []
    this.result = null
    this._init()
  }

  _init() {
    Library.addSearchPath(__dirname)
  }

  resolve(name) {
    // TODO
    return this.currentContext[name]
  }

  isInCurrentContext(name) {
    const ret = this.currentContext[name]
    return typeof ret !== 'undefined'
  }

  tryInjectVariable(name, value) {
    if (this.isInCurrentContext(name)) {
      throw new Error(`already have same variable in current context: ${name} ${value}`)
    }
    this.currentContext[name] = value
  }

  loadLibrary(op) {
    const {args} = op
    const library = new Library(args[0])
    const idx = this.libraries.findIndex(looper => looper.path === library.path)
    if (idx !== -1) {
      throw new Error('fail to duplicate load library!')
    }

    library.load(this)
    this.libraries.push(library)
  }

  defineGate(op) {
    const [name, params, qargs, body] = op.args
    this.tryInjectVariable(name, new Gate(name, params, qargs, body))
  }

  defineQureg(op) {
    const [name, size] = op.args
    if (this.isInCurrentContext(name)) {
      throw new Error(`fail to duplicate declear same qureg ${name} ${size}`)
    } else {
      const qreg = this.engine.allocateQureg(size)
      this.tryInjectVariable(name, qreg)
    }
  }

  defineCReg(op) {
    const [name, size] = op.args
    const creg = new Array(size)
    this.tryInjectVariable(name, creg)
  }

  _runExpression(args) {
    const [name, ...rest] = args
    if (rest.length > 0) {
      const [lparen, idx, rparen] = rest
      if (lparen === '[' && typeof idx === 'number' && rparen === ']') {
        const qureg = this.resolve(name)
        return qureg[idx]
      } else {
        throw new Error('invalid operator arguments')
      }
    } else {
      return this.resolve(name)
    }
  }

  applyGate(op) {
    // TODO
    const [name, ...args] = op.args
    if (name === 'x') {
      const qreg = this._runExpression(args)
      X.or(qreg)
    }
  }

  barrier(op) {
    Barrier.or(op.args)
  }

  reset(op) {
    // TODO
  }

  measure(op) {
    const [quregName, _, cregName] = op.args
    const qureg = this.resolve(quregName)
    const creg = this.resolve(cregName)
    new All(Measure).or(qureg)
    qureg.forEach((qubit, i) => {
      const value = this.engine.getMeasurementResult(qubit)
      creg[i] = value
    })
    this.result = creg.slice(0)
  }

  compareValue(op) {
    const [creg, target, qops] = op.args
    let sum = 0
    creg.forEach(v => sum += v)
    if (sum === target) {
      qops.forEach(opLooper => this.execute(opLooper))
    }
  }

  /**
   *
   * @param {{code: number, args: []}} op
   */
  execute(op) {
    this.ops.push(op)

    switch (op.code) {
      case OP_VERSION: {
        // just ignore version
        break
      }
      case OP_INCLUDE: {
        this.loadLibrary(op)
        break
      }
      case OP_DECL_GATE: {
        this.defineGate(op)
        break
      }
      case OP_DECL_QREG: {
        this.defineQureg(op)
        break
      }
      case OP_DECL_CREG: {
        this.defineCReg(op)
        break
      }
      case OP_OPAQUE: {
        // TODO
        break
      }
      case OP_U:
      case OP_CX: {
        this.applyGate(op)
        break
      }
      case OP_BARRIER: {
        this.barrier(op)
        break
      }
      case OP_RESET: {
        this.reset(op)
        break
      }
      case OP_MEASURE: {
        this.measure(op)
        break
      }
      case OP_GATE_OP: {
        this.applyGate(op)
        break
      }
      case OP_TEST: {
        this.compareValue(op)
        break
      }
      default: {
        throw new Error(`unsupported operation ${op.code}`)
      }
    }
  }

  /**
   * @param {string} sourceCode
   */
  run(sourceCode) {
    const result = parse(sourceCode)
    const {value} = result
    if (value && value.length > 0) {
      value.forEach(op => this.execute(op))
    }
  }
}
