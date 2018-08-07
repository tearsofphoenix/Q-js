import {BasicMathGate} from '../../ops/basics';

/*
Add a constant to a quantum number represented by a quantum register,
    stored from low- to high-bit.

    Example:
.. code-block:: python

qunum = eng.allocate_qureg(5) # 5-qubit number
X | qunum[1] # qunum is now equal to 2
AddConstant(3) | qunum # qunum is now equal to 5
 */
export class AddConstant extends BasicMathGate {
  /*
  Initializes the gate to the number to add.

    Args:
a (int): Number to add to a quantum register.

    It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  constructor(a) {
    super(x => [x + a])
    this.a = a
  }

  getInverse() {
    return SubConstant(this.a)
  }

  toString() {
    return `AddConstant(${this.a})`
  }

  equal(other) {
    return other instanceof AddConstant && other.a === this.a
  }
}

/*
Subtract a constant from a quantum number represented by a quantum
register, stored from low- to high-bit.

    Args:
a (int): Constant to subtract

Example:
    .. code-block:: python

qunum = eng.allocate_qureg(5) # 5-qubit number
X | qunum[2] # qunum is now equal to 4
SubConstant(3) | qunum # qunum is now equal to 1
 */
export function SubConstant(a) {
  return new AddConstant(-a)
}

/*
Add a constant to a quantum number represented by a quantum register
modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

    Example:
.. code-block:: python

qunum = eng.allocate_qureg(5) # 5-qubit number
X | qunum[1] # qunum is now equal to 2
AddConstantModN(3, 4) | qunum # qunum is now equal to 1
 */
export class AddConstantModN extends BasicMathGate {
  /*
  Initializes the gate to the number to add modulo N.

    Args:
a (int): Number to add to a quantum register (0 <= a < N).
N (int): Number modulo which the addition is carried out.

    It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  constructor(a, N) {
    super(x => [(x + a) % N])
    this.a = a
    this.N = N
  }

  toString() {
    return `AddConstantModN(${this.a}, ${this.N})`
  }

  getInverse() {
    return SubConstantModN(this.a, this.N)
  }

  equal(other) {
    return other instanceof AddConstantModN && other.a === this.a && other.N === this.N
  }
}

/*
Subtract a constant from a quantum number represented by a quantum
register modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

    Args:
a (int): Constant to add
N (int): Constant modulo which the addition of a should be carried
out.

    Example:
.. code-block:: python

qunum = eng.allocate_qureg(3) # 3-qubit number
X | qunum[1] # qunum is now equal to 2
SubConstantModN(4,5) | qunum # qunum is now -2 = 6 = 1 (mod 5)
 */
export function SubConstantModN(a, N) {
  return new AddConstantModN(N - a, N)
}

/*
Multiply a quantum number represented by a quantum register by a constant
modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

    Example:
.. code-block:: python

qunum = eng.allocate_qureg(5) # 5-qubit number
X | qunum[2] # qunum is now equal to 4
MultiplyByConstantModN(3,5) | qunum # qunum is now 2.
 */
export class MultiplyByConstantModN extends BasicMathGate {
  /*
  Initializes the gate to the number to multiply with modulo N.

    Args:
a (int): Number by which to multiply a quantum register
(0 <= a < N).
N (int): Number modulo which the multiplication is carried out.

    It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  constructor(a, N) {
    super(x => [(a * x) % N])
    this.a = a
    this.N = N
  }

  toString() {
    return `MultiplyByConstantModN(${this.a}, ${this.N})`
  }

  equal(other) {
    return other instanceof MultiplyByConstantModN && other.a === this.a && other.N === this.N
  }
}