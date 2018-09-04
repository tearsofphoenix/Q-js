import {BasicGate} from './basics'
import deepEqual from 'deep-eql'
/**
 * Gate for transforming qubits in state |0> to any desired quantum state.
 * @class StatePreparation
 */
export default class StatePreparation extends BasicGate {
  /**
   * Initialize StatePreparation gate.

   Example:
   ```js
      qureg = eng.allocateQureg(2)
      new StatePreparation([0.5, -0.5j, -0.5, 0.5]).or(qureg)
    ```
   Note:
   The amplitude of state k is final_state[k]. When the state k is
   written in binary notation, then qureg[0] denotes the qubit
   whose state corresponds to the least significant bit of k.

   Args:
   final_state(list[complex]): wavefunction of the desired
   quantum state. len(final_state) must
   be 2**len(qureg). Must be normalized!
   * @constructor
   * @param finalState
   */
  constructor(finalState) {
    super()
    this._finalState = finalState
  }

  toString() {
    return 'StatePreparation'
  }

  equal(other) {
    if (other instanceof StatePreparation) {
      return deepEqual(this._finalState, other._finalState)
    }
    return false
  }
}
