import math from 'mathjs'
// @ts-ignore
import deepEqual from 'deep-eql'
import { BasicGate, ANGLE_PRECISION, ANGLE_TOLERANCE } from './basics'
import { NotMergeable } from '../meta/error'
import { IGate } from '@/interfaces';


function roundAngles(angles: number[]) {
  const rounded_angles: number[] = []
  angles.forEach((angle) => {
    let newAngle = math.round(angle % (4 * math.pi), ANGLE_PRECISION)
    if (newAngle > 4 * math.pi - ANGLE_TOLERANCE) {
      newAngle = 0
    }
    if (Object.is(newAngle, -0)) {
      newAngle = 0
    }
    rounded_angles.push(newAngle)
  })
  return rounded_angles
}

/**
 * Uniformly controlled Ry gate as introduced in arXiv:quant-ph/0312218.

 This is an n-qubit gate. There are n-1 control qubits and one target qubit.
 This gate applies Ry(angles(k)) to the target qubit if the n-1 control
 qubits are in the classical state k. As there are 2^(n-1) classical
 states for the control qubits, this gate requires 2^(n-1) (potentially
 different) angle parameters.

 Example:
 .. code-block:: python

 controls = eng.allocate_qureg(2)
 target = eng.allocate_qubit()
 UniformlyControlledRy(angles=[0.1, 0.2, 0.3, 0.4]) | (controls, target)

 Note:
 The first quantum register contains the control qubits. When converting
 the classical state k of the control qubits to an integer, we define
 controls[0] to be the least significant (qu)bit. controls can also
 be an empty list in which case the gate corresponds to an Ry.

 Args:
 angles(list[float]): Rotation angles. Ry(angles[k]) is applied
 conditioned on the control qubits being in state
 k.
 */
export class UniformlyControlledRy extends BasicGate {
  angles: number[];
  constructor(angles: number[]) {
    super()
    this.angles = roundAngles(angles)
  }

  getInverse() {
    return new UniformlyControlledRy(this.angles.map(angle => -angle))
  }

  getMerged(other: IGate) {
    if (other instanceof UniformlyControlledRy) {
      const angles = other.angles.map((a1, idx) => a1 + this.angles[idx])
      return new UniformlyControlledRy(angles)
    } else {
      throw new NotMergeable()
    }
  }

  toString() {
    const str = this.angles.map(a => a.toString()).join(', ')
    return `UniformlyControlledRy([${str}])`
  }

  equal(other: IGate) {
    if (other instanceof UniformlyControlledRy) {
      return deepEqual(this.angles, other.angles)
    }
    return false
  }
}

/**
 * Uniformly controlled Rz gate as introduced in arXiv:quant-ph/0312218.

 This is an n-qubit gate. There are n-1 control qubits and one target qubit.
 This gate applies Rz(angles(k)) to the target qubit if the n-1 control
 qubits are in the classical state k. As there are 2^(n-1) classical
 states for the control qubits, this gate requires 2^(n-1) (potentially
 different) angle parameters.

 Example:
 .. code-block:: python

 controls = eng.allocate_qureg(2)
 target = eng.allocate_qubit()
 UniformlyControlledRz(angles=[0.1, 0.2, 0.3, 0.4]) | (controls, target)

 Note:
 The first quantum register are the contains qubits. When converting
 the classical state k of the control qubits to an integer, we define
 controls[0] to be the least significant (qu)bit. controls can also
 be an empty list in which case the gate corresponds to an Rz.

 Args:
 angles(list[float]): Rotation angles. Rz(angles[k]) is applied
 conditioned on the control qubits being in state
 k.
 @class UniformlyControlledRz
 */
export class UniformlyControlledRz extends BasicGate {
  angles: number[];
  constructor(angles: number[]) {
    super()
    this.angles = roundAngles(angles)
  }

  getInverse() {
    return new UniformlyControlledRz(this.angles.map(angle => -angle))
  }

  getMerged(other: IGate) {
    if (other instanceof UniformlyControlledRz) {
      const angles = other.angles.map((a1, idx) => a1 + this.angles[idx])
      return new UniformlyControlledRz(angles)
    } else {
      throw new NotMergeable()
    }
  }

  toString() {
    const str = this.angles.map(a => a.toString()).join(', ')
    return `UniformlyControlledRz([${str}])`
  }

  equal(other: IGate) {
    if (other instanceof UniformlyControlledRz) {
      return deepEqual(this.angles, other.angles)
    }
    return false
  }
}
