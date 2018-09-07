import {OPCode} from 'qasm'
import BaseOperation from './base'

const {OP_DECL_QREG, OP_DECL_CREG} = OPCode

export default class DeclOperation extends BaseOperation {
  /**
   *
   * @param {State} state
   */
  execute(state) {
    const [regname, size] = this.args
    switch (this.code) {
      case OP_DECL_QREG: {
        const qreg = state.engine.allocateQureg(size)
        state.addToCurrentScope(regname, qreg)
        break
      }
      case OP_DECL_CREG: {
        const creg = new Array(size)
        state.addToCurrentScope(regname, creg)
        break
      }
      default: {
        throw new Error('Invalid opcode for declaration operation!')
      }
    }
  }
}
