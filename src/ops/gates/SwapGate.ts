import { BasicMathGate } from '../basics';
import { complex, matrix } from 'mathjs';
/**
 * @class SwapGate
 * @desc Swap gate class (swaps 2 qubits) also self inverse gate
 */
export class SwapGate extends BasicMathGate {
    constructor() {
        super((x: any, y: any) => [y, x]);
        this.interchangeableQubitIndices = [[0, 1]];
    }

    toString() {
        return 'Swap'
    }

    get matrix() {
        return matrix([
            [1, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1]
        ])
    }

    getInverse() {
        const inv = new SwapGate()
        inv.interchangeableQubitIndices = this.interchangeableQubitIndices.slice(0)
        return inv
    }
}

// Shortcut (instance of) `SwapGate`
export const Swap = new SwapGate()
