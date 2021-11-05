
import { BasicPhaseGate } from '../basics';
import { complex, matrix } from 'mathjs';
/**
 * @desc Phase-shift gate (equivalent to Rz up to a global phase)
 */
export class R extends BasicPhaseGate {
    get matrix() {
        return matrix([[1, 0], [0, complex(Math.cos(this.angle), Math.sin(this.angle))] as any]);
    }
}