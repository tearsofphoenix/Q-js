
import { ClassicalInstructionGate } from './ClassicalInstructionGate';
/**
 * @class FastForwardingGate
 * @desc
Base class for classical instruction gates which require a fast-forward
through compiler engines that cache / buffer gates. Examples include
Measure and Deallocate, which both should be executed asap, such
that Measurement results are available and resources are freed,
    respectively.

        Note:
The only requirement is that FlushGate commands run the entire
circuit. FastForwardingGate objects can be used but the user cannot
expect a measurement result to be available for all back-ends when
calling only Measure. E.g., for the IBM Quantum Experience back-end,
    sending the circuit for each Measure-gate would be too inefficient,
    which is why a final

 @example

eng.flush()

is required before the circuit gets sent through the API.
 */
export class FastForwardingGate extends ClassicalInstructionGate {

}