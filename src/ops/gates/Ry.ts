
import { BasicRotationGate } from '../basics';
import { matrix } from 'mathjs';

export class Ry extends BasicRotationGate {
    get matrix() {
        return matrix([
            [Math.cos(0.5 * this.angle), -Math.sin(0.5 * this.angle)],
            [Math.sin(0.5 * this.angle), Math.cos(0.5 * this.angle)]
        ])
    }
}
