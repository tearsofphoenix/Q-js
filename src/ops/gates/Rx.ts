import { BasicRotationGate } from '../basics';
import { complex, matrix } from 'mathjs';

export class Rx extends BasicRotationGate {
    get matrix() {
        return matrix([
            [Math.cos(0.5 * this.angle), complex(0, -1 * Math.sin(0.5 * this.angle))] as any,
            [complex(0, -1 * Math.sin(0.5 * this.angle)), Math.cos(0.5 * this.angle)]
        ]);
    }
}
