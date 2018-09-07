
import BaseOperation from './base'

class Gate {
  constructor(name, params, qargs, body) {
    this.name = name
    this.params = params
    this.qargs = qargs
    this.body = body
  }
}

export default class GateDeclOperation extends BaseOperation {
  /**
   *
   * @param {State} state
   */
  execute(state) {
    const [gatename, params, qargs, body] = this.args
    const gate = new Gate(gatename, params, qargs, body)
    state.addToCurrentScope(gatename, gate)
  }
}
