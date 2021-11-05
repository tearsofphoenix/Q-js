import { BasicRotationGate } from '../basics';
import { complex, matrix } from 'mathjs';
/**
 * @desc RotationZ gate class
 */
export class Rz extends BasicRotationGate {
    get matrix() {
        return matrix([
            [complex(Math.cos(-0.5 * this.angle), Math.sin(-0.5 * this.angle)), 0] as any,
            [0, complex(Math.cos(0.5 * this.angle), Math.sin(0.5 * this.angle))]
        ])
    }
}
