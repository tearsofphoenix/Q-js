import { BasicGate } from './BasicGate';
/**
 * @class ClassicalInstructionGate
 * @desc
  Classical instruction gates never have control qubits.
    Base class for all gates which are not quantum gates in the typical sense,
    e.g., measurement, allocation/deallocation, ...
 */
export class ClassicalInstructionGate extends BasicGate {

}
