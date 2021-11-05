
import { BasicPhaseGate } from '../basics';
import { complex, matrix } from 'mathjs';
/**
 * @class Ph
 * @desc Phase gate (global phase)
 */
export class Ph extends BasicPhaseGate {
    get matrix() {
        return matrix([
            [complex(Math.cos(this.angle), Math.sin(this.angle)), 0] as any,
            [0, complex(Math.cos(this.angle), Math.sin(this.angle))]
        ], 'dense');
    }
}