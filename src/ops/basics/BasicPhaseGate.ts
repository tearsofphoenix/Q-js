import mathjs from 'mathjs';
import { BasicGate } from './BasicGate';
import { ANGLE_PRECISION, ANGLE_TOLERANCE } from './constants';
import { IGate } from '@/interfaces';
import { NotMergeable } from '@/meta/error';
/**
 * @desc
Defines a base class of a phase gate.

    A phase gate has a continuous parameter (the angle), labeled 'angle' /
this.angle. Its inverse is the same gate with the negated argument.
    Phase gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 2 * pi, this.angle is in the interval
    [0, 2 * pi).
 */
export class BasicPhaseGate extends BasicGate {
    angle: number;
    /**
      Initialize a basic rotation gate.
  
      @param angle Angle of rotation (saved modulo 2 * pi)
       */
    constructor(angle: number) {
        super();
        let rounded_angle = mathjs.round(mathjs.mod(angle, 2.0 * Math.PI), ANGLE_PRECISION)
        if (rounded_angle > 2 * Math.PI - ANGLE_TOLERANCE) {
            rounded_angle = 0.0
        }
        this.angle = rounded_angle
    }

    /**
      Return the inverse of this rotation gate (negate the angle, return new object).
     */
    getInverse(): BasicPhaseGate {
        if (this.angle == 0) {
            return new BasicPhaseGate(0)
        } else {
            return new BasicPhaseGate(-this.angle + 2 * Math.PI)
        }
    }

    /**
      Return self merged with another gate.
  
      Default implementation handles rotation gate of the same type, where angles are simply added.
  
      @param  other Phase gate of same type.
      @throws NotMergeable For non-rotation gates or rotation gates of different type.
      @return New object representing the merged gates.
    */
    getMerged(other: IGate): IGate {
        if (other instanceof BasicPhaseGate) {
            type Ctor = new (a: number) => BasicPhaseGate;
            return new (this.constructor as Ctor)(this.angle + other.angle);
        }
        throw new NotMergeable('Can\'t merge different types of rotation gates.')
    }

    toString() {
        return `${this.constructor.name}(${this.angle})`
    }

    texString() {
        return `${this.constructor.name}$_{${this.angle}}$`
    }

    equal(other: IGate) {
        if (other instanceof BasicPhaseGate) {
            return this.angle === other.angle
        }
        return false
    }
}
