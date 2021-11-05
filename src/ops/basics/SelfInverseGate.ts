import { ObjectCopy } from '@/libs/util';
import { BasicGate } from './BasicGate';

/**
 * @class SelfInverseGate
 * @desc Self-inverse basic gate class.
 * Automatic implementation of the getInverse-member function for self-inverse gates.
 * @example
   // getInverse(H) == H, it is a self-inverse gate:
    getInverse(H) | qubit
 */
export class SelfInverseGate extends BasicGate {
  getInverse() {
    return ObjectCopy(this)
  }
}
