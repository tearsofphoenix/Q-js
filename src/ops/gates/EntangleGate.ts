
import { BasicGate } from '../basics';
/**
 * @desc gate (Hadamard on first qubit, followed by CNOTs applied to all other qubits).
*/
export class EntangleGate extends BasicGate {
    toString() {
        return 'Entangle'
    }

    get matrix() {
        throw new Error('No Attribute')
    }
}

// Shortcut (instance of) `EntangleGate`
export const Entangle = new EntangleGate()
