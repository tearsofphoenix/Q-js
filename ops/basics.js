/*
Defines the BasicGate class, the base class of all gates, the
BasicRotationGate class, the SelfInverseGate, the FastForwardingGate, the
ClassicalInstruction gate, and the BasicMathGate class.

Gates overload the | operator to allow the following syntax:

    .. code-block:: python

Gate | (qureg1, qureg2, qureg2)
Gate | (qureg, qubit)
Gate | qureg
Gate | qubit
Gate | (qubit,)

This means that for more than one quantum argument (right side of | ), a tuple
needs to be made explicitely, while for one argument it is optional.
*/

import { BasicQubit, Qureg } from '../types/qubit'
import {Command, applyCommand} from './command'

const ANGLE_PRECISION = 12
const ANGLE_TOLERANCE = 10 ** -ANGLE_PRECISION

// Base class of all gates.
export class BasicGate {
  /*
    """
Initialize a basic gate.

    Note:
Set interchangeable qubit indices!
    (gate.interchangeable_qubit_indices)

As an example, consider

    .. code-block:: python

ExampleGate | (a,b,c,d,e)

where a and b are interchangeable. Then, call this function as
follows:

    .. code-block:: python

self.set_interchangeable_qubit_indices([[0,1]])

As another example, consider

    .. code-block:: python

ExampleGate2 | (a,b,c,d,e)

where a and b are interchangeable and, in addition, c, d, and e
are interchangeable among themselves. Then, call this function as

.. code-block:: python

self.set_interchangeable_qubit_indices([[0,1],[2,3,4]])

     */
  constructor() {
    this.interchangeableQubitIndices = []
  }

  getInverse() {
    throw new Error('BasicGate: No get_inverse() implemented.')
  }

  getMerged() {
    throw new Error('BasicGate: No get_merged() implemented.')
  }

  /*
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

Args:
    qubits: a Qubit object, a list of Qubit objects, a Qureg object,
    or a tuple of Qubit or Qureg objects (can be mixed).
Returns:
    Canonical representation (tuple<qureg>): A tuple containing Qureg
(or list of Qubits) objects.
     */
  static makeTupleOfQureg(qubits) {
    let isTuple = false
    if (Array.isArray(qubits)) {
      isTuple = qubits.some(item => item instanceof Qureg)
    }
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

  /*
    Helper function to generate a command consisting of the gate and
the qubits being acted upon.

    Args:
qubits: see BasicGate.make_tuple_of_qureg(qubits)

Returns:
    A Command object containing the gate and the qubits.
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

  /*
    Operator| overload which enables the syntax Gate | qubits.

    Example:
1) Gate | qubit
2) Gate | [qubit0, qubit1]
3) Gate | qureg
4) Gate | (qubit, )
5) Gate | (qureg, qubit)

Args:
    qubits: a Qubit object, a list of Qubit objects, a Qureg object,
    or a tuple of Qubit or Qureg objects (can be mixed).
     */
  or(qubits) {
    const cmd = this.generateCommand(qubits)
    applyCommand(cmd)
  }

  equal(other) {
    return this.__proto__ === other.__proto__
  }
}

/*
Self-inverse basic gate class.

Automatic implementation of the get_inverse-member function for self-
                                                                inverse gates.

    Example:
.. code-block:: python

# get_inverse(H) == H, it is a self-inverse gate:
    get_inverse(H) | qubit

 */
export class SelfInverseGate extends BasicGate {
  getInverse() {
    return this
  }
}

/*

Defines a base class of a rotation gate.

    A rotation gate has a continuous parameter (the angle), labeled 'angle' /
self.angle. Its inverse is the same gate with the negated argument.
    Rotation gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 4 * pi, self.angle is in the interval
    [0, 4 * pi).
 */
export class BasicRotationGate extends BasicGate {
  /*

Initialize a basic rotation gate.

    Args:
angle (float): Angle of rotation (saved modulo 4 * pi)

     */
  constructor(angle, ...args) {
    super(...args)

    let rounded_angle = Math.floor(angle % (4.0 * Math.PI), ANGLE_PRECISION)
    if (rounded_angle > 4 * Math.PI - ANGLE_TOLERANCE) {
      rounded_angle = 0.0
    }
    this.angle = rounded_angle
  }

  /*
Return the inverse of this rotation gate (negate the angle, return new
object).
     */
  getInverse() {
    if (this.angle == 0) {
      return new BasicRotationGate(0)
    } else {
      return new BasicRotationGate(-this.angle + 4 * Math.PI)
    }
  }

  /*
    Return self merged with another gate.

    Default implementation handles rotation gate of the same type, where
angles are simply added.

    Args:
other: Rotation gate of same type.

    Raises:
NotMergeable: For non-rotation gates or rotation gates of
different type.

    Returns:
New object representing the merged gates.
     */
  getMerged(other) {
    if (other instanceof BasicRotationGate) {
      return new BasicRotationGate(this.angle + other.angle)
    }
    throw new Error('Can\'t merge different types of rotation gates.')
  }
}

/*

Defines a base class of a phase gate.

    A phase gate has a continuous parameter (the angle), labeled 'angle' /
self.angle. Its inverse is the same gate with the negated argument.
    Phase gates of the same class can be merged by adding the angles.
    The continuous parameter is modulo 2 * pi, self.angle is in the interval
    [0, 2 * pi).
 */
export class BasicPhaseGate extends BasicGate {
  /*
    Initialize a basic rotation gate.

    Args:
angle (float): Angle of rotation (saved modulo 2 * pi)
     */
  constructor(angle, ...args) {
    super(...args)
    let rounded_angle = Math.floor(angle % (2.0 * Math.PI), ANGLE_PRECISION)
    if (rounded_angle > 2 * Math.PI - ANGLE_TOLERANCE) {
      rounded_angle = 0.0
    }
    this.angle = rounded_angle
  }

  /*
    Return the inverse of this rotation gate (negate the angle, return new
object).
     */
  getInverse() {
    if (this.angle == 0) {
      return new BasicPhaseGate(0)
    } else {
      return new BasicPhaseGate(-this.angle + 2 * Math.PI)
    }
  }

  /*
    Return self merged with another gate.

    Default implementation handles rotation gate of the same type, where
angles are simply added.

    Args:
other: Rotation gate of same type.

    Raises:
NotMergeable: For non-rotation gates or rotation gates of
different type.

    Returns:
New object representing the merged gates.
     */
  getMerged(other) {
    if (other instanceof BasicPhaseGate) {
      return new BasicPhaseGate(this.angle + other.angle)
    }
    throw new Error('Can\'t merge different types of rotation gates.')
  }
}


// Classical instruction gates never have control qubits.
/*

Classical instruction gate.

    Base class for all gates which are not quantum gates in the typical sense,
    e.g., measurement, allocation/deallocation, ...
 */
export class ClassicalInstructionGate extends BasicGate {

}

/*
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

    .. code-block: python

eng.flush()

is required before the circuit gets sent through the API.
 */
export class FastForwardingGate extends ClassicalInstructionGate {

}

/*
Base class for all math gates.

    It allows efficient emulation by providing a mathematical representation
which is given by the concrete gate which derives from this base class.
The AddConstant gate, for example, registers a function of the form

    .. code-block:: python

def add(x):
return (x+a,)

upon initialization. More generally, the function takes integers as
parameters and returns a tuple / list of outputs, each entry corresponding
to the function input. As an example, consider out-of-place
multiplication, which takes two input registers and adds the result into a
third, i.e., (a,b,c) -> (a,b,c+a*b). The corresponding function then is

    .. code-block:: python

def multiply(a,b,c)
return (a,b,c+a*b)
 */
export class BasicMathGate extends BasicGate {
  /*
    Initialize a BasicMathGate by providing the mathematical function that
it implements.

    Args:
math_fun (function): Function which takes as many int values as
input, as the gate takes registers. For each of these values,
    it then returns the output (i.e., it returns a list/tuple of
output values).

Example:
    .. code-block:: python

def add(a,b):
return (a,a+b)
BasicMathGate.__init__(self, add)

If the gate acts on, e.g., fixed point numbers, the number of bits per
register is also required in order to describe the action of such a
mathematical gate. For this reason, there is

    .. code-block:: python

BasicMathGate.get_math_function(qubits)

which can be overwritten by the gate deriving from BasicMathGate.

    Example:
.. code-block:: python

def get_math_function(self, qubits):
n = len(qubits[0])
scal = 2.**n
def math_fun(a):
return (int(scal * (math.sin(math.pi * a / scal))),)
return math_fun
     */
  constructor(mathFunc, ...args) {
    super(...args)
    this.mathFunc = x => [mathFunc(x)]
  }

  /*
    Return the math function which corresponds to the action of this math
gate, given the input to the gate (a tuple of quantum registers).

Args:
    qubits (tuple<Qureg>): Qubits to which the math gate is being
applied.

    Returns:
math_fun (function): Python function describing the action of this
gate. (See BasicMathGate.__init__ for an example).
     */
  getMathFunction(qubits) {
    return this.mathFunc
  }
}
