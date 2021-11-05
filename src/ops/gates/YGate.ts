import { SelfInverseGate } from "../basics";
import { complex, matrix } from 'mathjs';
// Pauli-Y gate class
export class YGate extends SelfInverseGate {
    toString() {
        return 'Y'
    }

    get matrix() {
        return matrix([
            [0, complex(0, -1)] as any,
            [complex(0, 1), 0],
        ])
    }
}

// Shortcut (instance of) `YGate`
export const Y = new YGate()
