/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
Defines the BasicGate class, the base class of all gates, the
BasicRotationGate class, the SelfInverseGate, the FastForwardingGate, the
ClassicalInstruction gate, and the BasicMathGate class.

Gates overload the | operator to allow the following syntax:

   @code
Gate | (qureg1, qureg2, qureg2)
Gate | (qureg, qubit)
Gate | qureg
Gate | qubit
Gate | (qubit,)

This means that for more than one quantum argument (right side of | ), a tuple
needs to be made explicitely, while for one argument it is optional.
*/
import math from 'mathjs'
import { BasicQubit } from '../types/qubit'
import Command from './command'
import {arrayIsTuple, ObjectCopy} from '../libs/util'
import {NotMergeable} from '../meta/error'

const ANGLE_PRECISION = 12
const ANGLE_TOLERANCE = 10 ** -ANGLE_PRECISION

/**
 * @class BasicGate
 * @classdesc Base class of all gates.
 */
export class BasicGate {
  /**
   * @constructor
    Note:
Set interchangeable qubit indices!
    (gate.interchangeable_qubit_indices)

As an example, consider

    @code
   ExampleGate | (a,b,c,d,e)

where a and b are interchangeable. Then, call this function as
follows:

    @code
   this.set_interchangeable_qubit_indices([[0,1]])

As another example, consider

    @code
   ExampleGate2 | (a,b,c,d,e)

where a and b are interchangeable and, in addition, c, d, and e
are interchangeable among themselves. Then, call this function as

    @code
    this.set_interchangeable_qubit_indices([[0,1],[2,3,4]])
  */
  constructor() {
    this.interchangeableQubitIndices = []
  }

  /**
   * @throws Error
   */
  getInverse() {
    throw new Error('BasicGate: No getInverse() implemented.')
  }

  /**
   * @throws NotMergeable
   */
  getMerged() {
    throw new NotMergeable('BasicGate: No getMerged() implemented.')
  }

  /**
   * @throws Error
   */
  toString() {
    throw new Error('BasicGate: No toString() implemented.')
  }

  /**
   * @return string
   */
  inspect() {
    return this.toString()
  }

  /**
    Convert quantum input of "gate | quantum input" to internal formatting.

    A Command object only accepts tuples of Quregs (list of Qubit objects)
as qubits input parameter. However, with this function we allow the
user to use a more flexible syntax:

    1) Gate | qubit
    2) Gate | [qubit0, qubit1]
    3) Gate | qureg
    4) Gate | (qubit, )
    5) Gate | (qureg, qubit)

where qubit is a Qubit object and qureg is a Qureg object. This
function takes the right hand side of | and transforms it to the
correct input parameter of a Command object which is:

    1) -> Gate | ([qubit], )
    2) -> Gate | ([qubit0, qubit1], )
    3) -> Gate | (qureg, )
    4) -> Gate | ([qubit], )
    5) -> Gate | (qureg, [qubit])

@param
    qubits: a Qubit object, a list of Qubit objects, a Qureg object,
    or a tuple of Qubit or Qureg objects (can be mixed).
@returns
    Canonical representation (tuple<qureg>): A tuple containing Qureg
(or list of Qubits) objects.
     */
  static makeTupleOfQureg(qubits) {
    const isTuple = arrayIsTuple(qubits)
    if (!isTuple) {
      qubits = [qubits]
    }
    qubits.forEach((looper, idx) => {
      if (looper instanceof BasicQubit) {
        qubits[idx] = [looper]
      }
    })
    return qubits.slice(0)
  }

  /**
    Helper function to generate a command consisting of the gate and the qubits being acted upon.

    @param qubits {Qubit | Array<Qubit> | Qureg} see BasicGate.makeTupleOfQureg(qubits)
    @return {Command} A Command object containing the gate and the qubits.
  */
  generateCommand(qubits) {
    const qs = BasicGate.makeTupleOfQureg(qubits)
    const engines = []
    qs.forEach((reg) => {
      reg.forEach(q => engines.push(q.engine))
    })
    const eng = engines[0]
    return new Command(eng, this, qs)
  }

  /**
    Operator| overload which enables the syntax Gate | qubits.

    @example
1) Gate | qubit
2) Gate | [qubit0, qubit1]
3) Gate | qureg
4) Gate | (qubit, )
5) Gate | (qureg, qubit)

   @param qubits {Qubit | Array<Qubit> | Qureg}
   a Qubit object, a list of Qubit objects, a Qureg object,
   or a tuple of Qubit or Qureg objects (can be mixed).
  */
  or(qubits) {
    const cmd = this.generateCommand(qubits)
    cmd.apply()
  }

  /**
   * @param {BasicGate | Object} other
   * @return {boolean}
   */
  equal(other) {
    return this.__proto__ === other.__proto__
  }

  /**
   * @return {BasicGate}
   */
  copy() {
    return ObjectCopy(this)
  }
}

/**
 * @class SelfInverseGate
 * @classdesc Self-inverse basic gate class.
 * Automatic implementation of the getInverse-member function for self-inverse gates.
 * @code
   // getInverse(H) == H, it is a self-inverse gate:
    getInverse(H) | qubit
 */
export class SelfInverseGate extends BasicGate {
  getInverse() {
    return ObjectCopy(this)
  }
}

/**
 * @class BasicRotationGate
 * @classdesc
Defines a base class of a rotation gate.

    A rotation gate has a continuous parameter (the angle), labeled 'angle' /
this.angle. Its inverse is the same gate with the negated argument.
    Rotation gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 4 * pi, this.angle is in the interval
    [0, 4 * pi).
 */
export class BasicRotationGate extends BasicGate {
  /**
   * @constructor
      Initialize a basic rotation gate.
    @param angle {number} Angle of rotation (saved modulo 4 * pi)
   */
  constructor(angle, ...args) {
    super(...args)

    let rounded_angle = math.round(math.mod(angle, 4.0 * Math.PI), ANGLE_PRECISION)
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
      return new this.__proto__.constructor(0)
    } else {
      return new this.__proto__.constructor(-this.angle + 4 * Math.PI)
    }
  }

  /**
    Return self merged with another gate.

    Default implementation handles rotation gate of the same type, where
angles are simply added.

    @param {BasicRotationGate|Object} other
    @throws NotMergeable:  For non-rotation gates or rotation gates of different type.
    @return {BasicRotationGate} New object representing the merged gates.
   */
  getMerged(other) {
    if (other instanceof BasicRotationGate) {
      return new this.__proto__.constructor(this.angle + other.angle)
    }
    throw new NotMergeable('Can\'t merge different types of rotation gates.')
  }

  toString() {
    return `${this.constructor.name}(${this.angle})`
  }

  /**
    Return the Latex string representation of a BasicRotationGate.

  Returns the class name and the angle as a subscript, i.e.

.. code-block:: latex

  [CLASSNAME]$_[ANGLE]$
   @return {string}
   */
  texString() {
    return `${this.constructor.name}$_{${this.angle}}$`
  }

  equal(other) {
    if (other instanceof BasicRotationGate) {
      return this.angle == other.angle
    }
    return false
  }
}

/**
 * @class BasicPhaseGate
Defines a base class of a phase gate.

    A phase gate has a continuous parameter (the angle), labeled 'angle' /
this.angle. Its inverse is the same gate with the negated argument.
    Phase gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 2 * pi, this.angle is in the interval
    [0, 2 * pi).
 */
export class BasicPhaseGate extends BasicGate {
  /**
    Initialize a basic rotation gate.

    @param {number} angle: Angle of rotation (saved modulo 2 * pi)
     */
  constructor(angle, ...args) {
    super(...args)
    let rounded_angle = math.round(math.mod(angle, 2.0 * Math.PI), ANGLE_PRECISION)
    if (rounded_angle > 2 * Math.PI - ANGLE_TOLERANCE) {
      rounded_angle = 0.0
    }
    this.angle = rounded_angle
  }

  /**
    Return the inverse of this rotation gate (negate the angle, return new object).
    @return {BasicPhaseGate}
   */
  getInverse() {
    if (this.angle == 0) {
      return new this.__proto__.constructor(0)
    } else {
      return new this.__proto__.constructor(-this.angle + 2 * Math.PI)
    }
  }

  /**
    Return self merged with another gate.

    Default implementation handles rotation gate of the same type, where angles are simply added.

    @param {BasicPhaseGate} other Phase gate of same type.
    @throws NotMergeable For non-rotation gates or rotation gates of different type.
    @return {BasicPhaseGate} New object representing the merged gates.
  */
  getMerged(other) {
    if (other instanceof BasicPhaseGate) {
      return new this.__proto__.constructor(this.angle + other.angle)
    }
    throw new NotMergeable('Can\'t merge different types of rotation gates.')
  }

  toString() {
    return `${this.constructor.name}(${this.angle})`
  }

  texString() {
    return `${this.constructor.name}$_{${this.angle}}$`
  }

  equal(other) {
    if (other instanceof BasicPhaseGate) {
      return this.angle === other.angle
    }
    return false
  }
}

/**
 * @class ClassicalInstructionGate
  Classical instruction gate.
  Classical instruction gates never have control qubits.
    Base class for all gates which are not quantum gates in the typical sense,
    e.g., measurement, allocation/deallocation, ...
 */
export class ClassicalInstructionGate extends BasicGate {

}

/**
 * @class FastForwardingGate
 * @classdesc
Base class for classical instruction gates which require a fast-forward
through compiler engines that cache / buffer gates. Examples include
Measure and Deallocate, which both should be executed asap, such
that Measurement results are available and resources are freed,
    respectively.

        Note:
The only requirement is that FlushGate commands run the entire
circuit. FastForwardingGate objects can be used but the user cannot
expect a measurement result to be available for all back-ends when
calling only Measure. E.g., for the IBM Quantum Experience back-end,
    sending the circuit for each Measure-gate would be too inefficient,
    which is why a final

    @code

eng.flush()

is required before the circuit gets sent through the API.
 */
export class FastForwardingGate extends ClassicalInstructionGate {

}

/**
 * @class BasicMathGate
 * @classdesc
Base class for all math gates.

    It allows efficient emulation by providing a mathematical representation
which is given by the concrete gate which derives from this base class.
The AddConstant gate, for example, registers a function of the form

    @code

function add(x):
return (x+a,)

upon initialization. More generally, the function takes integers as
parameters and returns a tuple / list of outputs, each entry corresponding
to the function input. As an example, consider out-of-place
multiplication, which takes two input registers and adds the result into a
third, i.e., (a,b,c) -> (a,b,c+a*b). The corresponding function then is

    @code

function multiply(a,b,c)
return (a,b,c+a*b)
 */
export class BasicMathGate extends BasicGate {
  /**
   * @constructor
    Initialize a BasicMathGate by providing the mathematical function that it implements.

    @param {function} mathFunc: Function which takes as many int values as
input, as the gate takes registers. For each of these values,
    it then returns the output (i.e., it returns a list/tuple of
output values).

@example
    @code

function add(a,b):
return (a,a+b)
BasicMathGate.__init__(self, add)

If the gate acts on, e.g., fixed point numbers, the number of bits per
register is also required in order to describe the action of such a
mathematical gate. For this reason, there is

    @code

BasicMathGate.get_math_function(qubits)

which can be overwritten by the gate deriving from BasicMathGate.

    @example
@code

function get_math_function(self, qubits):
n = len(qubits[0])
scal = 2.**n
function math_fun(a):
return (int(scal * (math.sin(math.pi * a / scal))),)
return math_fun
     */
  constructor(mathFunc, ...args) {
    super(...args)
    this.mathFunc = x => Array.from(mathFunc(...x))
  }

  /**
    Return the math function which corresponds to the action of this math
gate, given the input to the gate (a tuple of quantum registers).

  @param {Array<Qureg>} qubits: Qubits to which the math gate is being applied.

    @returns {function}: javascript function describing the action of this
    gate. (See BasicMathGate.constructor for an example).
   */
  getMathFunction(qubits) {
    return this.mathFunc
  }

  toString() {
    return 'MATH'
  }
}
