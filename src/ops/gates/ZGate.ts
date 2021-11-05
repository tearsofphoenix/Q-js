import { SelfInverseGate } from "../basics";
import { matrix } from 'mathjs';
/**
 * Pauli-Z gate class
 */
export class ZGate extends SelfInverseGate {
    toString() {
        return 'Z'
    }

    get matrix() {
        return matrix([
            [1, 0],
            [0, -1]
        ])
    }
}

// Shortcut (instance of) `ZGate`
export const Z = new ZGate()
