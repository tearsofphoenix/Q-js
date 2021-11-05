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

import {expect} from 'chai'
import math from 'mathjs'
import QubitOperator, {PAULI_OPERATOR_PRODUCTS} from '../../src/ops/qubitoperator'
import {tuple} from '../../src/libs/util'

const mc = math.complex

describe('qubit operator test', () => {
  it('should test pauli operator product unchanged', () => {
    const correct = {
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

    Object.keys(correct).forEach((key) => {
      const value = correct[key]
      const v2 = PAULI_OPERATOR_PRODUCTS[key]
      expect(value).to.deep.equal(v2)
    })
  });

  it('should test init defaults', () => {
    const op = new QubitOperator()
    expect(Object.keys(op.terms).length).to.equal(0)
  });

  it('should test_init_tuple', () => {
    const coefficients = [0.5, mc(0, 0.6), 2.303, mc(0, -1)]
    coefficients.forEach((coefficient) => {
      const loc_op = tuple([0, 'X'], [5, 'Y'], [6, 'Z'])
      const qubit_op = new QubitOperator(loc_op, coefficient)
      expect(Object.keys(qubit_op.terms).length).to.equal(1)
      expect(math.equal(qubit_op.terms[loc_op], coefficient)).to.equal(true)
    })
  });

  it('should test_init_str', () => {
    const qubit_op = new QubitOperator('X0 Y5 Z12', -1.0)
    const correct = tuple([0, 'X'], [5, 'Y'], [12, 'Z'])
    const value = qubit_op.terms[correct]
    expect(typeof value !== 'undefined').to.equal(true)
    expect(value).to.equal(-1.0)
  });

  it('should test_init_str_identity', () => {
    const qubit_op = new QubitOperator('', 2.0)
    expect(Object.keys(qubit_op.terms).length).to.equal(1)
    const value = qubit_op.terms[[]]
    expect(typeof value !== 'undefined').to.equal(true)
    expect(value).to.equal(2.0)
  });

  it('should test_init_bad_coefficient', () => {
    expect(() => new QubitOperator('X0', '0.5')).to.throw()
  });

  it('should test_init_bad_action', () => {
    expect(() => new QubitOperator('Q0')).to.throw()
  });

  it('should test_init_bad_action_in_tuple', () => {
    expect(() => new QubitOperator(tuple([1, 'Q']))).to.throw()
  });

  it('should test_init_bad_qubit_num_in_tuple', () => {
    expect(() => new QubitOperator(tuple(['1', 'X']))).to.throw()
  });

  it('should test_init_bad_tuple', () => {
    expect(() => new QubitOperator(tuple([0, 1, 'X']))).to.throw()
  });

  it('should test_init_bad_str', () => {
    expect(() => new QubitOperator('X')).to.throw()
  });

  it('should test_init_bad_qubit_num', () => {
    expect(() => new QubitOperator('X-1')).to.throw()
  });

  it('should test_isclose_abs_tol', () => {
    let a = new QubitOperator('X0', -1.0)
    let b = new QubitOperator('X0', -1.05)
    let c = new QubitOperator('X0', -1.11)

    expect(a.isClose(b, 1e-14, 0.1)).to.equal(true)
    expect(a.isClose(c, 1e-14, 0.1)).to.equal(false)
    a = new QubitOperator('X0', mc(0, -1.0))
    b = new QubitOperator('X0', mc(0, -1.05))
    c = new QubitOperator('X0', mc(0, -1.11))
    expect(a.isClose(b, 1e-14, 0.1)).to.equal(true)
    expect(a.isClose(c, 1e-14, 0.1)).to.equal(false)
  });

  it('should test compress', () => {
    const Complex = mc().constructor
    let a = new QubitOperator('X0', 0.9e-12)
    expect(Object.keys(a.terms).length).to.equal(1)
    a.compress()
    expect(Object.keys(a.terms).length).to.equal(0)
    a = new QubitOperator('X0', mc(1.0, 1))
    a.compress(0.5)
    expect(Object.keys(a.terms).length).to.equal(1)
    Object.keys(a.terms).forEach((key) => {
      const v = a.terms[key]
      expect(math.equal(v, mc(1.0, 1))).to.equal(true)
    })

    a = new QubitOperator('X0', mc(1.1, 1))
    a.compress(1.0)

    expect(Object.keys(a.terms).length).to.equal(1)
    Object.keys(a.terms).forEach((key) => {
      const v = a.terms[key]
      expect(math.equal(v, 1.1)).to.equal(true)
    })

    a = new QubitOperator('X0', mc(1.1, 1)).add(new QubitOperator('X1', mc(0, 1.e-6)))
    a.compress()
    expect(Object.keys(a.terms).length).to.equal(2)
    Object.keys(a.terms).forEach((key) => {
      const v = a.terms[key]
      expect(v instanceof Complex).to.equal(true)
    })

    a.compress(1.e-5)
    expect(Object.keys(a.terms).length).to.equal(1)
    Object.keys(a.terms).forEach((key) => {
      const v = a.terms[key]
      expect(v instanceof Complex).to.equal(true)
    })

    a.compress(1.0)
    expect(Object.keys(a.terms).length).to.equal(1)
    Object.keys(a.terms).forEach((key) => {
      const v = a.terms[key]
      expect(typeof v === 'number').to.equal(true)
    })
  });

  it('should test_isclose_rel_tol', () => {
    const a = new QubitOperator('X0', 1)
    const b = new QubitOperator('X0', 2)
    expect(a.isClose(b, 2.5, 0.1)).to.equal(true)
    // Test symmetry
    expect(a.isClose(b, 1, 0.1)).to.equal(true)
    expect(b.isClose(a, 1, 0.1)).to.equal(true)
  });

  it('should test_isclose_zero_terms', () => {
    const op = new QubitOperator(tuple([1, 'Y'], [0, 'X']), mc(0, -1)).mul(0)
    expect(op.isClose(new QubitOperator([], 0.0), 1e-12, 1e-12)).to.equal(true)
    expect(new QubitOperator([], 0.0).isClose(op, 1e-12, 1e-12)).to.equal(true)
  });

  it('should test_isclose_different_terms', () => {
    const a = new QubitOperator(tuple([1, 'Y']), mc(0, -0.1))
    const b = new QubitOperator(tuple([1, 'X']), mc(0, -0.1))
    expect(a.isClose(b, 1e-12, 0.2)).to.equal(true)
    expect(a.isClose(b, 1e-12, 0.05)).to.equal(false)
    expect(b.isClose(a, 1e-12, 0.2)).to.equal(true)
    expect(b.isClose(a, 1e-12, 0.05)).to.equal(false)
  });

  it('should test_isclose_different_num_terms', () => {
    const a = new QubitOperator(tuple([1, 'Y']), mc(0, -0.1))
    a.iadd(new QubitOperator(tuple([2, 'Y']), mc(0, -0.1)))
    const b = new QubitOperator(tuple([1, 'X']), mc(0, -0.1))

    expect(a.isClose(b, 1e-12, 0.05)).to.equal(false)
    expect(b.isClose(a, 1e-12, 0.05)).to.equal(false)
  });

  it('should test_imul_inplace', () => {
    const qubit_op = new QubitOperator('X1')
    const prev_id = qubit_op
    qubit_op.imul(3)
    expect(qubit_op === prev_id).to.equal(true)
  });

  it('should test_imul_scalar', () => {
    const data = [0.5, mc(0, 0.6), 2.303, mc(0, -1)]
    data.forEach((multiplier) => {
      const loc_op = tuple([1, 'X'], [2, 'Y'])
      const qubit_op = new QubitOperator(loc_op)
      qubit_op.imul(multiplier)
      const v = qubit_op.terms[loc_op]
      expect(math.equal(v, multiplier)).to.equal(true)
    })
  });

  it('should test_imul_qubit_op', () => {
    const op1 = new QubitOperator(tuple([0, 'Y'], [3, 'X'], [8, 'Z'], [11, 'X']), mc(0, 3.0))
    const op2 = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    op1.imul(op2)
    const correct_coefficient = math.multiply(math.multiply(mc(0, 1.0), mc(0, 3.0)), 0.5)
    const correct_term = tuple([0, 'Y'], [1, 'X'], [3, 'Z'], [11, 'X'])

    expect(Object.keys(op1.terms).length).to.equal(1)
    const v = op1.terms[correct_term]
    expect(math.equal(v, correct_coefficient)).to.equal(true)
  });

  it('should test_imul_qubit_op_2', () => {
    const op3 = new QubitOperator(tuple([1, 'Y'], [0, 'X']), mc(0, -1))
    const op4 = new QubitOperator(tuple([1, 'Y'], [0, 'X'], [2, 'Z']), -1.5)

    op3.imul(op4)
    op4.imul(op3)
    const v = op3.terms[[2, 'Z']]
    expect(!!v).to.equal(true)
    expect(math.equal(v, mc(0, 1.5))).to.equal(true)
  });

  it('should test_imul_bidir', () => {
    const op_a = new QubitOperator(tuple([1, 'Y'], [0, 'X']), mc(0, -1))
    const op_b = new QubitOperator(tuple([1, 'Y'], [0, 'X'], [2, 'Z']), -1.5)
    op_a.imul(op_b)
    op_b.imul(op_a)

    const v = op_a.terms[[2, 'Z']]
    expect(math.equal(v, mc(0, 1.5))).to.equal(true)
    const c = op_b.terms[[[0, 'X'], [1, 'Y']]]
    expect(math.equal(c, mc(0, -2.25))).to.equal(true)
  });

  it('should test_imul_bad_multiplier', () => {
    const op = new QubitOperator(tuple([1, 'Y'], [0, 'X']), mc(0, -1))
    expect(() => op.imul('1')).to.throw()
  });

  it('should test_mul_by_scalarzero', () => {
    const op = new QubitOperator(tuple([1, 'Y'], [0, 'X']), mc(0, -1)).mul(0)
    const key = [[0, 'X'], [1, 'Y']]
    const v = op.terms[key]
    expect(math.equal(v, mc(0, 0))).to.equal(true)
  });

  it('should test_mul_bad_multiplier', () => {
    let op = new QubitOperator(tuple([1, 'Y'], [0, 'X']), mc(0, -1))
    expect(() => op = op.mul('0.5')).to.throw()
  });

  it('should test_mul_out_of_place', () => {
    const op1 = new QubitOperator(tuple([0, 'Y'], [3, 'X'], [8, 'Z'], [11, 'X']), mc(0, 3.0))
    const op2 = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    const op3 = op1.mul(op2)
    const correct_coefficient = math.multiply(math.multiply(mc(0, 1), mc(0, 3)), 0.5)
    const correct_term = tuple([0, 'Y'], [1, 'X'], [3, 'Z'], [11, 'X'])

    expect(op1.isClose(new QubitOperator(tuple([0, 'Y'], [3, 'X'], [8, 'Z'], [11, 'X']), mc(0, 3.0)))).to.equal(true)
    expect(op2.isClose(new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5))).to.equal(true)
    expect(op3.isClose(new QubitOperator(correct_term, correct_coefficient))).to.equal(true)
  });

  it('should test_mul_npfloat64', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y']), 0.5)
    const res = op.mul(0.5)
    expect(res.isClose(new QubitOperator(tuple([1, 'X'], [3, 'Y']), 0.5 * 0.5))).to.equal(true)
  });

  it('should test_mul_multiple_terms', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    op.iadd(new QubitOperator(tuple([1, 'Z'], [3, 'X'], [8, 'Z']), 1.2))
    op.iadd(new QubitOperator(tuple([1, 'Z'], [3, 'Y'], [9, 'Z']), mc(0, 1.4)))
    const res = op.mul(op)
    const correct = new QubitOperator([], math.add((0.5 ** 2) + (1.2 ** 2), math.pow(mc(0, 1.4), 2)))
    correct.iadd(new QubitOperator(tuple([1, 'Y'], [3, 'Z']), math.multiply(math.multiply(mc(0, 2), mc(0, 1)), 0.6)))
    expect(res.isClose(correct)).to.equal(true)
  });

  it('should test_truediv_and_div', () => {
    const divisors = [0.5, mc(0, 0.6), 2.303, mc(0, -1), 2]
    divisors.forEach((divisor) => {
      const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
      const op2 = op.copy()
      const original = op.copy()
      const res = op.div(divisor)
      const correct = op.mul(math.divide(1.0, divisor))

      expect(res.isClose(correct)).to.equal(true)
      // Test if done out of place
      expect(op.isClose(original)).to.equal(true)
      expect(op2.isClose(original)).to.equal(true)
    })
  });

  it('should test_truediv_bad_divisor', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    expect(() => op.div('0.5')).to.throw()
  });

  it('should test_itruediv_and_idiv', () => {
    const divisors = [0.5, mc(0, 0.6), 2.303, mc(0, -1), 2]
    divisors.forEach((divisor) => {
      const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
      const op2 = op.copy()
      const original = op.copy()
      const correct = op.mul(math.divide(1.0, divisor))

      op.idiv(divisor)
      op2.idiv(divisor)

      expect(op.isClose(correct)).to.equal(true)
      expect(op2.isClose(correct)).to.equal(true)

      // Test if done out of place
      expect(op.isClose(original)).to.equal(false)
      expect(op2.isClose(original)).to.equal(false)
    })
  });

  it('should test_itruediv_bad_divisor', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    expect(() => op.idiv('0.5')).to.throw()
  });

  it('should test_iadd_cancellation', () => {
    const term_a = tuple([1, 'X'], [3, 'Y'], [8, 'Z'])
    const term_b = tuple([1, 'X'], [3, 'Y'], [8, 'Z'])
    const a = new QubitOperator(term_a, 1.0)
    a.iadd(new QubitOperator(term_b, -1.0))
    expect(Object.keys(a.terms).length).to.equal(0)
  });

  it('should test_iadd_different_term', () => {
    const term_a = tuple([1, 'X'], [3, 'Y'], [8, 'Z'])
    const term_b = tuple([1, 'Z'], [3, 'Y'], [8, 'Z'])
    const a = new QubitOperator(term_a, 1.0)
    a.iadd(new QubitOperator(term_b, 0.5))
    expect(Object.keys(a.terms).length).to.equal(2)
    expect(a.terms[term_a]).to.be.closeTo(1.0, 1e-12)
    expect(a.terms[term_b]).to.be.closeTo(0.5, 1e-12)

    a.iadd(new QubitOperator(term_b, 0.5))

    expect(Object.keys(a.terms).length).to.equal(2)
    expect(a.terms[term_a]).to.be.closeTo(1.0, 1e-12)
    expect(a.terms[term_b]).to.be.closeTo(1.0, 1e-12)
  });

  it('should test_iadd_bad_addend', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    expect(() => op.iadd('0.5')).to.throw()
  });

  it('should test add', () => {
    const term_a = tuple([1, 'X'], [3, 'Y'], [8, 'Z'])
    const term_b = tuple([1, 'Z'], [3, 'Y'], [8, 'Z'])
    const a = new QubitOperator(term_a, 1.0)
    const b = new QubitOperator(term_b, 0.5)
    const res = a.add(b).add(b)
    expect(Object.keys(res.terms).length).to.equal(2)
    expect(res.terms[term_a]).to.be.closeTo(1.0, 1e-12)
    expect(res.terms[term_b]).to.be.closeTo(1.0, 1e-12)
    // Test out of place
    expect(a.isClose(new QubitOperator(term_a, 1.0))).to.equal(true)
    expect(b.isClose(new QubitOperator(term_b, 0.5))).to.equal(true)
  });

  it('should test_add_bad_addend', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    expect(() => op.add('0.5')).to.throw()
  });

  it('should test sub', () => {
    const term_a = tuple([1, 'X'], [3, 'Y'], [8, 'Z'])
    const term_b = tuple([1, 'Z'], [3, 'Y'], [8, 'Z'])
    const a = new QubitOperator(term_a, 1.0)
    const b = new QubitOperator(term_b, 0.5)
    const res = a.sub(b)
    expect(Object.keys(res.terms).length).to.equal(2)
    expect(res.terms[term_a]).to.be.closeTo(1.0, 1e-12)
    expect(res.terms[term_b]).to.be.closeTo(-0.5, 1e-12)

    const res2 = b.sub(a)
    expect(Object.keys(res2.terms).length).to.equal(2)
    expect(res2.terms[term_a]).to.be.closeTo(-1.0, 1e-12)
    expect(res2.terms[term_b]).to.be.closeTo(0.5, 1e-12)
  });

  it('should test_sub_bad_addend', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    expect(() => op.sub('0.5')).to.throw()
  });

  it('should test_isub_different_term', () => {
    const term_a = tuple([1, 'X'], [3, 'Y'], [8, 'Z'])
    const term_b = tuple([1, 'Z'], [3, 'Y'], [8, 'Z'])
    const a = new QubitOperator(term_a, 1.0)
    a.isub(new QubitOperator(term_b, 0.5))
    expect(Object.keys(a.terms).length).to.equal(2)
    expect(a.terms[term_a]).to.be.closeTo(1.0, 1e-12)
    expect(a.terms[term_b]).to.be.closeTo(-0.5, 1e-12)

    a.isub(new QubitOperator(term_b, 0.5))
    expect(Object.keys(a.terms).length).to.equal(2)
    expect(a.terms[term_a]).to.be.closeTo(1.0, 1e-12)
    expect(a.terms[term_b]).to.be.closeTo(-1, 1e-12)
  });

  it('should test_isub_bad_addend', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    expect(() => op.isub('0.5')).to.throw()
  });

  it('should test_neg', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    op.negative()
    // out of place
    expect(op.isClose(new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5))).to.equal(true)
    const correct = op.mul(-1)
    expect(correct.isClose(op.negative())).to.equal(true)
  });

  it('should test to string', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    expect(op.toString()).to.equal('0.5 X1 Y3 Z8')
    const op2 = new QubitOperator([], 2)
    expect(op2.toString()).to.equal('2 I')
  });

  it('should test_str_empty', () => {
    const op = new QubitOperator()
    expect(op.toString()).to.equal('0')
  });

  it('should test_str_multiple_terms', () => {
    const op = new QubitOperator(tuple([1, 'X'], [3, 'Y'], [8, 'Z']), 0.5)
    op.iadd(new QubitOperator(tuple([1, 'Y'], [3, 'Y'], [8, 'Z']), 0.6))
    expect(op.toString() === '0.5 X1 Y3 Z8 +\n0.6 Y1 Y3 Z8' || op.toString() === '0.6 Y1 Y3 Z8 +\n0.5 X1 Y3 Z8').to.equal(true)
    const op2 = new QubitOperator([], 2)
    expect(op2.toString()).to.equal('2 I')
  });
})
