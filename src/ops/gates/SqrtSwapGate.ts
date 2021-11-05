import { BasicGate } from '../basics';
import { complex, matrix } from 'mathjs';
/**
 * @desc Square-root Swap gate class
 */
export class SqrtSwapGate extends BasicGate {
    constructor() {
        super()
        this.interchangeableQubitIndices = [[0, 1]]
    }

    toString() {
        return 'SqrtSwap'
    }

    get matrix() {
        return matrix([
            [1, 0, 0, 0],
            [0, complex(0.5, 0.5), complex(0.5, -0.5), 0] as any,
            [0, complex(0.5, -0.5), complex(0.5, 0.5), 0],
            [0, 0, 0, 1]
        ])
    }
}

// Shortcut (instance of) `SqrtSwapGate`
export const SqrtSwap = new SqrtSwapGate()
