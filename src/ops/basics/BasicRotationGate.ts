import mathjs from 'mathjs';
import { IGate } from '@/interfaces';
import { BasicGate } from './BasicGate';
import { NotMergeable } from '@/meta/error';
import { ANGLE_TOLERANCE, ANGLE_PRECISION } from './constants';

type Ctor = new (a: number) => BasicRotationGate;
/**
 * @desc
Defines a base class of a rotation gate.

    A rotation gate has a continuous parameter (the angle), labeled 'angle' /
this.angle. Its inverse is the same gate with the negated argument.
    Rotation gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 4 * pi, this.angle is in the interval
    [0, 4 * pi).
 */
export class BasicRotationGate extends BasicGate {
    angle: number;
    /**
     * @constructor
        Initialize a basic rotation gate.
      @param angle Angle of rotation (saved modulo 4 * pi)
     */
    constructor(angle: number) {
        super();

        let rounded_angle = mathjs.round(mathjs.mod(angle, 4.0 * Math.PI), ANGLE_PRECISION);
        if (rounded_angle > 4 * Math.PI - ANGLE_TOLERANCE) {
            rounded_angle = 0.0
        }
        this.angle = rounded_angle
    }

    /**
     * @return {BasicRotationGate}
  Return the inverse of this rotation gate (negate the angle, return new
  object).
       */
    getInverse() {
        if (this.angle == 0) {
            return new (this.constructor as Ctor)(0)
        } else {
            return new (this.constructor as Ctor)(-this.angle + 4 * Math.PI)
        }
    }

    /**
      Return self merged with another gate.
  
      Default implementation handles rotation gate of the same type, where
  angles are simply added.
      @throws {NotMergeable}  For non-rotation gates or rotation gates of different type.
      @return New object representing the merged gates.
     */
    getMerged(other: IGate): IGate {
        if (other instanceof BasicRotationGate) {
            return new (this.constructor as Ctor)(this.angle + other.angle);
        }
        throw new NotMergeable('Can\'t merge different types of rotation gates.');
    }

    toString() {
        return `${this.constructor.name}(${this.angle})`
    }

    /**
      Return the Latex string representation of a BasicRotationGate.
  
    Returns the class name and the angle as a subscript, i.e.
  
     @example
    [CLASSNAME]$_[ANGLE]$
     @return {string}
     */
    texString() {
        return `${this.constructor.name}$_{${this.angle}}$`
    }

    equal(other: IGate): boolean {
        if (other instanceof BasicRotationGate) {
            return this.angle == other.angle
        }
        return false
    }
}
