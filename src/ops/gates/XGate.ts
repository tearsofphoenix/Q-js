import { SelfInverseGate } from "../basics";
import { matrix } from 'mathjs';
// Pauli-X gate class
export class XGate extends SelfInverseGate {
    toString() {
        return 'X'
    }

    get matrix() {
        return matrix([
            [0, 1],
            [1, 0]
        ])
    }
}


// Shortcut (instance of) `XGate`
export const X = new XGate()
export const NOT = X
