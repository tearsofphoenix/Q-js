
import { complex, matrix } from 'mathjs';
import { SelfInverseGate } from '../basics';
/**
 * @class HGate
 */
export class HGate extends SelfInverseGate {
  toString() {
    return 'H'
  }

  get matrix() {
    return matrix([
      [complex(Math.SQRT1_2, 0), complex(Math.SQRT1_2, 0)] as any[],
      [complex(Math.SQRT1_2, 0), complex(-Math.SQRT1_2, 0)] as any[]
    ], 'dense');
  }
}

export const H = new HGate();