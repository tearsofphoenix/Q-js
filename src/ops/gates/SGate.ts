
import { SelfInverseGate } from '../basics';
import { complex, matrix } from 'mathjs';

// S gate class
export class SGate extends SelfInverseGate {
    toString() {
        return 'S'
    }

    get matrix() {
        return matrix([
            [1, 0],
            [0, complex(0, 1)] as any
        ])
    }
}

// Shortcut (instance of) `SGate`
export const S = new SGate()
