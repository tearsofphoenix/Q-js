import {OPCode} from 'qasm'
import BaseOperation from './base'

const {OP_INDEX, OP_ARRAY_INDEX} = OPCode

export default class IndexOperation extends BaseOperation {
  /**
   *
   * @param {State} state
   */
  execute(state) {
    const [name, size] = this.args
    switch (this.code) {
      case OP_INDEX: {
        return state.resolve(name)
      }
      case OP_ARRAY_INDEX: {
        const value = state.resolve(name)
        return value[size]
      }
      default: {
        throw new Error('Invalid opcode for declaration operation!')
      }
    }
  }
}
