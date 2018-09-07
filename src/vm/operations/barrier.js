import BaseOperation from './base'
import {Barrier} from '../../ops'

export default class BarrierOperation extends BaseOperation {
  /**
   *
   * @param {State} state
   */
  execute(state) {
    const [idlist] = this.args
    const ops = idlist.map(looper => state.createOperation(looper))
    const list = ops.forEach(looper => looper.execute())
    Barrier.or(list)
  }
}
