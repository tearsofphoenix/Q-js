import BaseOperation from './base'
import {CNOT} from '../../ops';
import {tuple} from '../../libs/util'

export default class CXOperation extends BaseOperation {
  /**
   *
   * @param {State} state
   */
  execute(state) {
    const [controlIDs, qubits] = this.args
    const cids = state.resolveList(controlIDs)
    const qids = state.resolveList(qubits)
    CNOT(tuple(qids, cids))
  }
}
