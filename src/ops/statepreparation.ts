import { BasicGate } from './basics'
// @ts-ignore
import deepEqual from 'deep-eql'
import { IGate } from '@/interfaces';
/**
 * Gate for transforming qubits in state |0> to any desired quantum state.
 */
export default class StatePreparation extends BasicGate {
  private _finalState: any;
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
   * @param finalState
   */
  constructor(finalState: any) {
    super()
    this._finalState = finalState
  }

  toString() {
    return 'StatePreparation'
  }

  equal(other: IGate): boolean {
    if (other instanceof StatePreparation) {
      return deepEqual(this._finalState, other._finalState)
    }
    return false
  }
}
