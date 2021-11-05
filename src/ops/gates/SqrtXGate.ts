import { BasicGate } from '../basics';
import { complex, matrix } from 'mathjs';
// Square-root X gate class
export class SqrtXGate extends BasicGate {
    get matrix() {
        return matrix([
            [complex(0.5, 0.5), complex(0.5, -0.5)] as any,
            [complex(0.5, -0.5), complex(0.5, 0.5)]
        ])
    }

    toString() {
        return 'SqrtX'
    }

    texString() {
        return '$\\sqrt{X}$'
    }
}

// Shortcut (instance of) `SqrtXGate`
export const SqrtX = new SqrtXGate()
