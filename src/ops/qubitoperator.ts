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

import { hashArray as ha, arrayFromHash as ah, kEmptyTerms } from '@/libs/term';
import { abs, complex, Complex, multiply, max, re, im, subtract, divide, add } from 'mathjs'

// QubitOperator stores a sum of Pauli operators acting on qubits."""
import { isNumeric, symmetricDifference } from '../libs/polyfill'

type NumericScalar = Complex | number;

const mc = complex

const EQ_TOLERANCE = 1e-12

/**
 * Define products of all Pauli operators for symbolic multiplication.
 * 
 */
export const PAULI_OPERATOR_PRODUCTS = {
  [ha(['I', 'I'])]: [1.0, 'I'],
  [ha(['I', 'X'])]: [1.0, 'X'],
  [ha(['X', 'I'])]: [1.0, 'X'],
  [ha(['I', 'Y'])]: [1.0, 'Y'],
  [ha(['Y', 'I'])]: [1.0, 'Y'],
  [ha(['I', 'Z'])]: [1.0, 'Z'],
  [ha(['Z', 'I'])]: [1.0, 'Z'],
  [ha(['X', 'X'])]: [1.0, 'I'],
  [ha(['Y', 'Y'])]: [1.0, 'I'],
  [ha(['Z', 'Z'])]: [1.0, 'I'],
  [ha(['X', 'Y'])]: [mc(0, 1), 'Z'],
  [ha(['X', 'Z'])]: [mc(0, -1), 'Y'],
  [ha(['Y', 'X'])]: [mc(0, -1), 'Z'],
  [ha(['Y', 'Z'])]: [mc(0, 1), 'X'],
  [ha(['Z', 'X'])]: [mc(0, 1), 'Y'],
  [ha(['Z', 'Y'])]: [mc(0, -1), 'X']
}

export function stringToArray(key: string) {
  const parts = key.split(',').filter(item => item.length > 0)
  if (parts.length % 2 === 0) {
    const result = []
    for (let i = 0; i < parts.length; i += 2) {
      result.push([parseInt(parts[i], 10), parts[i + 1]])
    }
    return result
  } else {
    throw new Error(`invalid key ${key}`)
  }
}

function checkTerm(term: any[][]) {
  term.forEach((localOperator) => {
    if (!Array.isArray(localOperator) || localOperator.length !== 2) {
      throw new Error('term specified incorrectly')
    }
    const [qubitNum, action] = localOperator
    if (typeof action !== 'string' || 'XYZ'.indexOf(action) === -1) {
      throw new Error(`Invalid action provided: must be string 'X', 'Y', or 'Z'.`)
    }
    if (typeof qubitNum !== 'number' || qubitNum < 0) {
      throw new Error(`Invalid qubit number provided to QubitTerm: must be a non-negative int.`);
    }
  });
}

/**
 * @class QubitOperator
 * @desc
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

 @example

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
export default class QubitOperator {
  terms: {
    [key: string]: NumericScalar;
  };
  /**
    The init function only allows to initialize one term. Additional terms
have to be added using += (which is fast) or using + of two
QubitOperator objects:

    @example

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

    @param coefficient The coefficient of the
first term of this QubitOperator. Default is 1.0.
    @param term (optional, empy array, a array of arrays, or a string):
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

    @throws Invalid operators provided to QubitOperator.
     */
  constructor(term?: any[][] | string, coefficient: NumericScalar = 1.0) {
    // assert coefficient as numeric
    this.terms = {}
    if (!isNumeric(coefficient)) {
      throw new Error('Coefficient must be a numeric type.')
    }

    if (typeof term === 'undefined') {
      // leave it empty
    } else if (Array.isArray(term)) {
      if (term.length === 0) {
        this.terms[kEmptyTerms] = coefficient;
      } else {
        checkTerm(term);
        term = term.sort((a, b) => a[0] - b[0])
        this.terms[ha(term)] = coefficient;
      }
    } else if (typeof term === 'string') {
      const listOPs = ah(term);
      checkTerm(listOPs);
      this.terms[ha(listOPs)] = coefficient;
    } else {
      throw new Error('term specified incorrectly.')
    }
  }

  /**
    Eliminates all terms with coefficients close to zero and removes
imaginary parts of coefficients that are close to zero.

    @param absTolerance Absolute tolerance, must be at least 0.0
     */
  compress(absTolerance: number = 1e-12) {
    const new_terms = {}
    Object.keys(this.terms).forEach((key) => {
      let coeff = this.terms[key]
      if (abs(im(coeff) as number) <= absTolerance) {
        coeff = re(coeff) as number;
      }
      if (abs(coeff as number) > absTolerance) {
        new_terms[key] = coeff
      }
    })
    this.terms = new_terms
  }

  /**
    Returns true if other (QubitOperator) is close to this.

    Comparison is done for each term individually. Return true
if the difference between each term in self and other is
less than the relative tolerance w.r.t. either other or self
(symmetric test) or if the difference is less than the absolute
tolerance.

    @param other QubitOperator to compare against.
    @param realTolerance Relative tolerance, must be greater than 0.0
    @param absTolerance Absolute tolerance, must be at least 0.0
  */
  isClose(other: QubitOperator, realTolerance: number = EQ_TOLERANCE, absTolerance: number = EQ_TOLERANCE) {
    // terms which are in both
    const otherKeys = new Set(Object.keys(other.terms))
    const myKeys = Object.keys(this.terms)
    const intersection = new Set(myKeys.filter(x => otherKeys.has(x)))
    for (const term of intersection) {
      const a = this.terms[term]
      const b = other.terms[term]
      //
      const tmp = multiply(realTolerance, max(abs(a as number), abs(b as number)));
      if (abs(subtract(a as number, b as number)) > max(tmp, absTolerance)) {
        return false
      }
    }
    const diff = symmetricDifference(new Set(myKeys), otherKeys)
    // terms only in one (compare to 0.0 so only abs_tol)
    for (const term of diff) {
      const value = this.terms[term]
      if (typeof value !== 'undefined') {
        if (abs(value as number) > absTolerance) {
          return false
        }
      } else if (abs(other.terms[term] as number) > absTolerance) {
        return false
      }
    }
    return true
  }

  /**
    In-place multiply (*=) terms with scalar or QubitOperator.
  */
  imul(multiplier: NumericScalar | QubitOperator) {
    // Handle QubitOperator.
    if (multiplier instanceof QubitOperator) {
      const result_terms = {}
      Object.keys(this.terms).forEach((left_term) => {
        const leftKey = ah(left_term);
        Object.keys(multiplier.terms).forEach((right_term) => {
          let new_coefficient = multiply(this.terms[left_term], multiplier.terms[right_term])
          // Loop through local operators and create new sorted list
          // of representing the product local operator
          let product_operators = []
          let left_operator_index = 0
          let right_operator_index = 0
          const rightKey = ah(right_term);
          const n_operators_left = leftKey.length
          const n_operators_right = rightKey.length

          while (left_operator_index < n_operators_left && right_operator_index < n_operators_right) {
            const [left_qubit, left_loc_op] = leftKey[left_operator_index]
            const [right_qubit, right_loc_op] = rightKey[right_operator_index]

            // Multiply local operators acting on the same qubit
            if (left_qubit === right_qubit) {
              left_operator_index += 1
              right_operator_index += 1
              const [scalar, loc_op] = PAULI_OPERATOR_PRODUCTS[ha([left_loc_op, right_loc_op])];

              // Add new term.
              if (loc_op !== 'I') {
                product_operators.push([left_qubit, loc_op])
                new_coefficient = multiply(new_coefficient, scalar as NumericScalar);
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

          // Finish the remainding operators
          if (left_operator_index === n_operators_left) {
            product_operators = product_operators.concat(rightKey.slice(right_operator_index))
          } else if (right_operator_index === n_operators_right) {
            product_operators = product_operators.concat(leftKey.slice(left_operator_index))
          }

          // Add to result dict
          const tmp_key = product_operators
          const tk = ha(tmp_key);

          if (tk in result_terms) {
            result_terms[tk] = add(result_terms[tk], new_coefficient);
          } else {
            result_terms[tk] = new_coefficient;
          }
        })
      })
      this.terms = result_terms
      return this
    } else // Handle scalars.
      if (isNumeric(multiplier)) {
        Object.keys(this.terms).forEach((key) => {
          this.terms[key] = multiply(this.terms[key], multiplier) as NumericScalar;
        })
        return this
      } else {
        throw new Error('Cannot in-place multiply term of invalid type '
          + 'to QubitTerm.')
      }
  }

  /**
  Return self * multiplier for a scalar, or a QubitOperator.

    @param multiplier A scalar, or a QubitOperator.

    @throws Invalid type cannot be multiply with QubitOperator.
   */
  mul(multiplier: NumericScalar | QubitOperator) {
    if (isNumeric(multiplier) || multiplier instanceof QubitOperator) {
      const product = this.copy()
      return product.imul(multiplier)
    }
    throw new Error('Object of invalid type cannot multiply with QubitOperator.')
  }

  /**
   * in-Place add
   */
  iadd(addend: NumericScalar | QubitOperator): QubitOperator {
    if (addend instanceof QubitOperator) {
      Object.keys(addend.terms).forEach((key) => {
        const value = this.terms[key]
        const ov = addend.terms[key]
        if (typeof value !== 'undefined') {
          const tmp = add(ov, value) as NumericScalar;
          if (abs(tmp as number) > 0) {
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

  add(addend: NumericScalar | QubitOperator) {
    const inst = this.copy()
    inst.iadd(addend)
    return inst
  }

  div(divisor: NumericScalar) {
    if (isNumeric(divisor)) {
      return this.mul(divide(1.0, divisor) as NumericScalar);
    } else {
      throw new Error('Cannot divide QubitOperator by non-scalar type.')
    }
  }

  /**
   * in-Place dived by divisor
   */
  idiv(divisor: NumericScalar) {
    if (isNumeric(divisor)) {
      return this.imul(divide(1.0, divisor) as NumericScalar)
    } else {
      throw new Error('Cannot divide QubitOperator by non-scalar type.')
    }
  }

  /**
   * in-Place subtract
   */
  isub(subtrahend: NumericScalar | QubitOperator) {
    if (subtrahend instanceof QubitOperator) {
      Object.keys(subtrahend.terms).forEach((key) => {
        const ov = subtrahend.terms[key]
        const v = this.terms[key]
        if (typeof v !== 'undefined') {
          if (abs(subtract(v, ov) as number) > 0) {
            this.terms[key] = subtract(v, ov) as number;
          } else {
            delete this.terms[key]
          }
        } else {
          this.terms[key] = subtract(0, ov) as number;
        }
      })
    } else {
      throw new Error('Cannot subtract invalid type from QubitOperator.')
    }
    return this
  }

  sub(subtrahend: NumericScalar | QubitOperator) {
    const ret = this.copy()
    return ret.isub(subtrahend)
  }

  /**
   * return negative of current qubit operator
   */
  negative() {
    return this.mul(-1.0)
  }

  /**
   * return copy of current qubit operator
   */
  copy() {
    const terms = {}
    Object.assign(terms, this.terms)
    const inst = new QubitOperator([])
    inst.terms = terms
    return inst
  }

  /**
   * string description of current qubit operator
   */
  toString() {
    const keys = Object.keys(this.terms)
    if (keys.length === 0) {
      return '0'
    }
    let string_rep = ''
    keys.forEach((term) => {
      const parts = ah(term);
      const v = this.terms[term]
      let tmp_string = `${v}`
      if (parts.length === 0) {
        tmp_string += ' I'
      }
      parts.forEach((operator) => {
        switch (operator[1]) {
          case 'X':
          case 'Y':
          case 'Z': {
            tmp_string += ` ${operator[1]}${operator[0]}`
            break
          }
          default: {
            throw new Error('invalid operator')
            break
          }
        }
      })
      string_rep += `${tmp_string} +\n`
    })

    return string_rep.substring(0, string_rep.length - 3)
  }
}
