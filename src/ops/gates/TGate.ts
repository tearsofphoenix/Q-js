import { BasicGate } from "../basics";
import { complex, matrix } from 'mathjs';
// T gate class
export class TGate extends BasicGate {
    get matrix() {
        return matrix([
            [1, 0],
            [0, complex(Math.SQRT1_2, Math.SQRT1_2)] as any,
        ])
    }

    toString() {
        return 'T'
    }
}

// Shortcut (instance of) `TGate`
export const T = new TGate()