import math from 'mathjs'

// QubitOperator stores a sum of Pauli operators acting on qubits."""
import {isNumeric, symmetricDifference} from '../utils/polyfill'

const mc = math.complex

const EQ_TOLERANCE = 1e-12


// Define products of all Pauli operators for symbolic multiplication.
export const PAULI_OPERATOR_PRODUCTS = {
  [['I', 'I']]: [1.0, 'I'],
  [['I', 'X']]: [1.0, 'X'],
  [['X', 'I']]: [1.0, 'X'],
  [['I', 'Y']]: [1.0, 'Y'],
  [['Y', 'I']]: [1.0, 'Y'],
  [['I', 'Z']]: [1.0, 'Z'],
  [['Z', 'I']]: [1.0, 'Z'],
  [['X', 'X']]: [1.0, 'I'],
  [['Y', 'Y']]: [1.0, 'I'],
  [['Z', 'Z']]: [1.0, 'I'],
  [['X', 'Y']]: [mc(0, 1), 'Z'],
  [['X', 'Z']]: [mc(0, -1), 'Y'],
  [['Y', 'X']]: [mc(0, -1), 'Z'],
  [['Y', 'Z']]: [mc(0, 1), 'X'],
  [['Z', 'X']]: [mc(0, 1), 'Y'],
  [['Z', 'Y']]: [mc(0, -1), 'X']
}

/*

A sum of terms acting on qubits, e.g., 0.5 * 'X0 X5' + 0.3 * 'Z1 Z2'.

    A term is an operator acting on n qubits and can be represented as:

coefficent * local_operator[0] x ... x local_operator[n-1]

where x is the tensor product. A local operator is a Pauli operator
('I', 'X', 'Y', or 'Z') which acts on one qubit. In math notation a term
is, for example, 0.5 * 'X0 X5', which means that a Pauli X operator acts
on qubit 0 and 5, while the identity operator acts on all other qubits.

    A QubitOperator represents a sum of terms acting on qubits and overloads
operations for easy manipulation of these objects by the user.

    Note for a QubitOperator to be a Hamiltonian which is a hermitian
operator, the coefficients of all terms must be real.

    .. code-block:: python

hamiltonian = 0.5 * QubitOperator('X0 X5') + 0.3 * QubitOperator('Z0')

Attributes:
    terms (dict): **key**: A term represented by a tuple containing all
non-trivial local Pauli operators ('X', 'Y', or 'Z').
A non-trivial local Pauli operator is specified by a
tuple with the first element being an integer
indicating the qubit on which a non-trivial local
operator acts and the second element being a string,
    either 'X', 'Y', or 'Z', indicating which non-trivial
Pauli operator acts on that qubit. Examples:
((1, 'X'),) or ((1, 'X'), (4,'Z')) or the identity ().
    The tuples representing the non-trivial local terms
are sorted according to the qubit number they act on,
    starting from 0.
**value**: Coefficient of this term as a (complex) float
 */

function checkTerm(term) {
  term.forEach((localOperator) => {
    if (!Array.isArray(localOperator) || localOperator.length !== 2) {
      throw new Error('term specified incorrectly')
    }
    const [qubitNum, action] = localOperator
    if (typeof action !== 'string' || 'XYZ'.indexOf(action) === -1) {
      throw new Error('Invalid action provided: must be string \'X\', \'Y\', or \'Z\'.')
    }
    if (typeof qubitNum !== 'number' || qubitNum < 0) {
      throw new Error('Invalid qubit number '
          + 'provided to QubitTerm: '
          + 'must be a non-negative '
          + 'int.')
    }
  })
}

export default class QubitOperator {
  /*
    Inits a QubitOperator.

    The init function only allows to initialize one term. Additional terms
have to be added using += (which is fast) or using + of two
QubitOperator objects:

    Example:
        .. code-block:: python

ham = ((QubitOperator('X0 Y3', 0.5)
    + 0.6 * QubitOperator('X0 Y3')))
# Equivalently
ham2 = QubitOperator('X0 Y3', 0.5)
ham2 += 0.6 * QubitOperator('X0 Y3')

Note:
    Adding terms to QubitOperator is faster using += (as this is done
by in-place addition). Specifying the coefficient in the __init__
is faster than by multiplying a QubitOperator with a scalar as
calls an out-of-place multiplication.

    Args:
coefficient (complex float, optional): The coefficient of the
first term of this QubitOperator. Default is 1.0.
term (optional, empy tuple, a tuple of tuples, or a string):
1) Default is None which means there are no terms in the
QubitOperator hence it is the "zero" Operator
2) An empty tuple means there are no non-trivial Pauli
operators acting on the qubits hence only identities
with a coefficient (which by default is 1.0).
3) A sorted tuple of tuples. The first element of each tuple
is an integer indicating the qubit on which a non-trivial
local operator acts, starting from zero. The second element
of each tuple is a string, either 'X', 'Y' or 'Z',
    indicating which local operator acts on that qubit.
4) A string of the form 'X0 Z2 Y5', indicating an X on
qubit 0, Z on qubit 2, and Y on qubit 5. The string should
be sorted by the qubit number. '' is the identity.

    Raises:
QubitOperatorError: Invalid operators provided to QubitOperator.
     */
  constructor(term, coefficient = 1.0) {
    // TODO assert coefficient as numeric
    this.terms = {}
    if (!isNumeric(coefficient)) {
      throw new Error('Coefficient must be a numeric type.')
    }

    if (typeof term === 'undefined') {
      // leave it empty
    } else if (Array.isArray(term)) {
      if (term.length === 0) {
        this.terms[[]] = coefficient
      } else {
        checkTerm(term)
        term = term.sort((a, b) => a[0] - b[0])
        this.terms[term] = coefficient
      }
    } else if (typeof term === 'string') {
      const listOPs = []
      const parts = term.split(/\s+/).filter(item => item.length > 0)
      parts.forEach((el) => {
        if (el.length < 2) {
          throw new Error('term specified incorrectly.')
        }
        listOPs.push([parseInt(el.substring(1), 10), el[0]])
      })

      checkTerm(listOPs)

      term = listOPs.sort((a, b) => a[0] - b[0])
      this.terms[term] = coefficient
    } else {
      throw new Error('term specified incorrectly.')
    }
  }

  /*
    Eliminates all terms with coefficients close to zero and removes
imaginary parts of coefficients that are close to zero.

    Args:
abs_tol(float): Absolute tolerance, must be at least 0.0
     */
  compress(absTolerance = 1e-12) {
    const new_terms = {}
    Object.keys(this.terms).forEach((key) => {
      let coeff = this.terms[key]
      if (math.abs(math.im(coeff)) <= absTolerance) {
        coeff = math.re(coeff)
      }
      if (math.abs(coeff) > absTolerance) {
        new_terms[key] = coeff
      }
    })
    this.terms = new_terms
  }

  /*
    Returns True if other (QubitOperator) is close to self.

    Comparison is done for each term individually. Return True
if the difference between each term in self and other is
less than the relative tolerance w.r.t. either other or self
(symmetric test) or if the difference is less than the absolute
tolerance.

    Args:
other(QubitOperator): QubitOperator to compare against.
rel_tol(float): Relative tolerance, must be greater than 0.0
abs_tol(float): Absolute tolerance, must be at least 0.0
     */
  isClose(other, realTolerance = 1e-12, absTolerance = 1e-12) {
    // terms which are in both:
    const otherKeys = new Set(Object.keys(other.terms))
    const myKeys = Object.keys(this.terms)
    const intersection = new Set(myKeys.filter(x => otherKeys.has(x)))
    for (const term of intersection) {
      const a = this.terms[term]
      const b = other.terms[term]
      //
      const tmp = math.multiply(realTolerance, math.max(math.abs(a), math.abs(b)))
      if (math.abs(math.subtract(a, b)) > math.max(tmp, absTolerance)) {
        return false
      }
    }
    const diff = symmetricDifference(new Set(myKeys), otherKeys)
    // terms only in one (compare to 0.0 so only abs_tol)
    for (const term of diff) {
      const value = this.terms[term]
      if (typeof value !== 'undefined') {
        if (math.abs(value) > absTolerance) {
          return false
        }
      } else if (math.abs(other.terms[term]) > absTolerance) {
        return false
      }
    }
    return true
  }

  /*
    In-place multiply (*=) terms with scalar or QubitOperator.

    Args:
multiplier(complex float, or QubitOperator): multiplier
     */
  imul(multiplier) {
    // Handle scalars.
    if (isNumeric(multiplier)) {
      Object.keys(this.terms).forEach((key) => {
        this.terms = math.multiply(this.terms[key], multiplier)
      })
      return this
    }

    // Handle QubitOperator.
    if (multiplier instanceof QubitOperator) {
      const result_terms = {}
      Object.keys(this.terms).forEach((left_term) => {
        const leftKey = left_term.split(',')
        Object.keys(multiplier.terms).forEach((right_term) => {
          let new_coefficient = math.multiply(this.terms[left_term], multiplier.terms[right_term])
          // Loop through local operators and create new sorted list
          // of representing the product local operator:
          let product_operators = []
          let left_operator_index = 0
          let right_operator_index = 0
          const rightKey = right_term.split(',')
          const n_operators_left = leftKey.length
          const n_operators_right = rightKey.length

          while (left_operator_index < n_operators_left && right_operator_index < n_operators_right) {
            const [left_qubit, left_loc_op] = leftKey[left_operator_index]
            const [right_qubit, right_loc_op] = rightKey[right_operator_index]

            // Multiply local operators acting on the same qubit
            if (left_qubit === right_qubit) {
              left_operator_index += 1
              right_operator_index += 1
              const [scalar, loc_op] = PAULI_OPERATOR_PRODUCTS[[left_loc_op, right_loc_op]]

              // Add new term.
              if (loc_op !== 'I') {
                product_operators.push([left_qubit, loc_op])
                new_coefficient = math.multiply(new_coefficient, scalar)
              }
              // Note if loc_op == 'I', then scalar == 1.0

              // If left_qubit > right_qubit, add right_loc_op; else,
              // add left_loc_op.
            } else if (left_qubit > right_qubit) {
              product_operators.push([right_qubit, right_loc_op])
              right_operator_index += 1
            } else {
              product_operators.push([left_qubit, left_loc_op])
              left_operator_index += 1
            }
          }

          // Finish the remainding operators:
          if (left_operator_index === n_operators_left) {
            product_operators = product_operators.concat(rightKey.slice(right_operator_index))
          } else if (right_operator_index === n_operators_right) {
            product_operators = product_operators.concat(leftKey.slice(left_operator_index))
          }

          // Add to result dict
          const tmp_key = product_operators
          if (tmp_key in result_terms) {
            result_terms[tmp_key] += new_coefficient
          } else {
            result_terms[tmp_key] = new_coefficient
          }
        })
      })
      this.terms = result_terms
      return this
    } else {
      throw new Error('Cannot in-place multiply term of invalid type '
        + 'to QubitTerm.')
    }
  }

  /*
  Return self * multiplier for a scalar, or a QubitOperator.

    Args:
multiplier: A scalar, or a QubitOperator.

    Returns:
product: A QubitOperator.

    Raises:
TypeError: Invalid type cannot be multiply with QubitOperator.
   */
  mul(multiplier) {
    if (isNumeric(multiplier) || multiplier instanceof QubitOperator) {
      const product = this.copy()
      return product.imul(multiplier)
    }
    throw new Error('Object of invalid type cannot multiply with QubitOperator.')
  }

  iadd(addend) {
    if (addend instanceof QubitOperator) {
      Object.keys(addend.terms).forEach((key) => {
        const value = this.terms[key]
        const ov = addend.terms[key]
        if (typeof value !== 'undefined') {
          const tmp = math.add(ov, value)
          if (math.abs(tmp) > 0) {
            this.terms[key] = tmp
          } else {
            delete this.terms[key]
          }
        } else {
          this.terms[key] = ov
        }
      })
    } else {
      throw new Error('Cannot add invalid type to QubitOperator.')
    }
    return this
  }

  add(addend) {
    const inst = this.copy()
    inst.iadd(addend)
    return inst
  }

  copy() {
    const terms = {}
    Object.assign(terms, this.terms)
    const inst = new QubitOperator([])
    inst.terms = terms
    return inst
  }
}

//
// # Loop through local operators and create new sorted list
// # of representing the product local operator:
//     product_operators = []
// left_operator_index = 0
// right_operator_index = 0
// n_operators_left = len(left_term)
// n_operators_right = len(right_term)
// while (left_operator_index < n_operators_left and
// right_operator_index < n_operators_right):
// (left_qubit, left_loc_op) = (
//     left_term[left_operator_index])
// (right_qubit, right_loc_op) = (
//     right_term[right_operator_index])
//
// # Multiply local operators acting on the same qubit
// if left_qubit == right_qubit:
// left_operator_index += 1
// right_operator_index += 1
// (scalar, loc_op) = _PAULI_OPERATOR_PRODUCTS[
//     (left_loc_op, right_loc_op)]
//
// # Add new term.
// if loc_op != 'I':
// product_operators += [(left_qubit, loc_op)]
// new_coefficient *= scalar
// # Note if loc_op == 'I', then scalar == 1.0
//
// # If left_qubit > right_qubit, add right_loc_op; else,
// # add left_loc_op.
//     elif left_qubit > right_qubit:
// product_operators += [(right_qubit, right_loc_op)]
// right_operator_index += 1
// else:
// product_operators += [(left_qubit, left_loc_op)]
// left_operator_index += 1
//
// # Finish the remainding operators:
//     if left_operator_index == n_operators_left:
// product_operators += right_term[
//     right_operator_index::]
// elif right_operator_index == n_operators_right:
// product_operators += left_term[left_operator_index::]
//
// # Add to result dict
// tmp_key = tuple(product_operators)
// if tmp_key in result_terms:
// result_terms[tmp_key] += new_coefficient
// else:
// result_terms[tmp_key] = new_coefficient
// self.terms = result_terms
// return self
// else:
// raise TypeError('Cannot in-place multiply term of invalid type ' +
//     'to QubitTerm.')
//

//
// def __rmul__(self, multiplier):
// """
// Return multiplier * self for a scalar.
//
//     We only define __rmul__ for scalars because the left multiply
// exist for  QubitOperator and left multiply
// is also queried as the default behavior.
//
//     Args:
// multiplier: A scalar to multiply by.
//
//     Returns:
// product: A new instance of QubitOperator.
//
//     Raises:
// TypeError: Object of invalid type cannot multiply QubitOperator.
// """
// if not isinstance(multiplier, (int, float, complex)):
// raise TypeError(
//     'Object of invalid type cannot multiply with QubitOperator.')
// return self * multiplier
//
// def __truediv__(self, divisor):
// """
// Return self / divisor for a scalar.
//
//     Note:
// This is always floating point division.
//
//     Args:
// divisor: A scalar to divide by.
//
//     Returns:
// A new instance of QubitOperator.
//
//     Raises:
// TypeError: Cannot divide local operator by non-scalar type.
// """
// if not isinstance(divisor, (int, float, complex)):
// raise TypeError('Cannot divide QubitOperator by non-scalar type.')
// return self * (1.0 / divisor)
//
// def __div__(self, divisor):
// """ For compatibility with Python 2. """
// return self.__truediv__(divisor)
//
// def __itruediv__(self, divisor):
// if not isinstance(divisor, (int, float, complex)):
// raise TypeError('Cannot divide QubitOperator by non-scalar type.')
// self *= (1.0 / divisor)
// return self
//
// def __idiv__(self, divisor):
// """ For compatibility with Python 2. """
// return self.__itruediv__(divisor)
//
// def __iadd__(self, addend):
// """
// In-place method for += addition of QubitOperator.
//
//     Args:
// addend: A QubitOperator.
//
//     Raises:
// TypeError: Cannot add invalid type.
// """
// if isinstance(addend, QubitOperator):
// for term in addend.terms:
// if term in self.terms:
// if abs(addend.terms[term] + self.terms[term]) > 0.:
// self.terms[term] += addend.terms[term]
// else:
// del self.terms[term]
// else:
// self.terms[term] = addend.terms[term]
// else:
// raise TypeError('Cannot add invalid type to QubitOperator.')
// return self
//
// def __add__(self, addend):
// """ Return self + addend for a QubitOperator. """
// summand = copy.deepcopy(self)
// summand += addend
// return summand
//
// def __isub__(self, subtrahend):
// """
// In-place method for -= subtraction of QubitOperator.
//
//     Args:
// subtrahend: A QubitOperator.
//
//     Raises:
// TypeError: Cannot subtract invalid type from QubitOperator.
// """
// if isinstance(subtrahend, QubitOperator):
// for term in subtrahend.terms:
// if term in self.terms:
// if abs(self.terms[term] - subtrahend.terms[term]) > 0.:
// self.terms[term] -= subtrahend.terms[term]
// else:
// del self.terms[term]
// else:
// self.terms[term] = -subtrahend.terms[term]
// else:
// raise TypeError('Cannot subtract invalid type from QubitOperator.')
// return self
//
// def __sub__(self, subtrahend):
// """ Return self - subtrahend for a QubitOperator. """
// minuend = copy.deepcopy(self)
// minuend -= subtrahend
// return minuend
//
// def __neg__(self):
// return -1. * self
//
// def __str__(self):
// """Return an easy-to-read string representation."""
// if not self.terms:
// return '0'
// string_rep = ''
// for term in self.terms:
// tmp_string = '{}'.format(self.terms[term])
// if term == ():
// tmp_string += ' I'
// for operator in term:
// if operator[1] == 'X':
// tmp_string += ' X{}'.format(operator[0])
// elif operator[1] == 'Y':
// tmp_string += ' Y{}'.format(operator[0])
// else:
// assert operator[1] == 'Z'
// tmp_string += ' Z{}'.format(operator[0])
// string_rep += '{} +\n'.format(tmp_string)
// return string_rep[:-3]
//
// def __repr__(self):
// return str(self)
