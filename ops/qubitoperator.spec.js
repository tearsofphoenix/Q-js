import {expect} from 'chai'
import math from 'mathjs'
import QubitOperator, {PAULI_OPERATOR_PRODUCTS} from './qubitoperator'
import {tuple} from '../libs/util'

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
})

// def test_imul_qubit_op_2():
// op3 = new QubitOperator(((1, 'Y'), (0, 'X')), -1j)
// op4 = new QubitOperator(((1, 'Y'), (0, 'X'), (2, 'Z')), -1.5)
// op3 *= op4
// op4 *= op3
// assert ((2, 'Z'),) in op3.terms
// assert op3.terms[((2, 'Z'),)] == 1.5j
//
//
// def test_imul_bidir():
// op_a = new QubitOperator(((1, 'Y'), (0, 'X')), -1j)
// op_b = new QubitOperator(((1, 'Y'), (0, 'X'), (2, 'Z')), -1.5)
// op_a *= op_b
// op_b *= op_a
// assert ((2, 'Z'),) in op_a.terms
// assert op_a.terms[((2, 'Z'),)] == 1.5j
// assert ((0, 'X'), (1, 'Y')) in op_b.terms
// assert op_b.terms[((0, 'X'), (1, 'Y'))] == -2.25j
//
//
// def test_imul_bad_multiplier():
// op = new QubitOperator(((1, 'Y'), (0, 'X')), -1j)
// with pytest.raises(TypeError):
// op *= "1"
//
//
// def test_mul_by_scalarzero():
// op = new QubitOperator(((1, 'Y'), (0, 'X')), -1j) * 0
// assert ((0, 'X'), (1, 'Y')) in op.terms
// assert op.terms[((0, 'X'), (1, 'Y'))] == pytest.approx(0.0)
//
//
// def test_mul_bad_multiplier():
// op = new QubitOperator(((1, 'Y'), (0, 'X')), -1j)
// with pytest.raises(TypeError):
// op = op * "0.5"
//
//
// def test_mul_out_of_place():
// op1 = new QubitOperator(((0, 'Y'), (3, 'X'), (8, 'Z'), (11, 'X')), 3.j)
// op2 = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// op3 = op1 * op2
// correct_coefficient = 1.j * 3.0j * 0.5
// correct_term = ((0, 'Y'), (1, 'X'), (3, 'Z'), (11, 'X'))
// assert op1.isclose(new QubitOperator(
//     ((0, 'Y'), (3, 'X'), (8, 'Z'), (11, 'X')), 3.j))
// assert op2.isclose(new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5))
// assert op3.isclose(new QubitOperator(correct_term, correct_coefficient))
//
//
// def test_mul_npfloat64():
// op = new QubitOperator(((1, 'X'), (3, 'Y')), 0.5)
// res = op * numpy.float64(0.5)
// assert res.isclose(new QubitOperator(((1, 'X'), (3, 'Y')), 0.5 * 0.5))
//
//
// def test_mul_multiple_terms():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// op += new QubitOperator(((1, 'Z'), (3, 'X'), (8, 'Z')), 1.2)
// op += new QubitOperator(((1, 'Z'), (3, 'Y'), (9, 'Z')), 1.4j)
// res = op * op
// correct = new QubitOperator((), 0.5**2 + 1.2**2 + 1.4j**2)
// correct += new QubitOperator(((1, 'Y'), (3, 'Z')),
//     2j * 1j * 0.5 * 1.2)
// assert res.isclose(correct)
//
//
// @pytest.mark.parametrize("multiplier", [0.5, 0.6j, numpy.float64(2.303),
//   numpy.complex128(-1j)])
// def test_rmul_scalar(multiplier):
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// res1 = op * multiplier
// res2 = multiplier * op
// assert res1.isclose(res2)
//
//
// def test_rmul_bad_multiplier():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// with pytest.raises(TypeError):
// op = "0.5" * op
//
//
// @pytest.mark.parametrize("divisor", [0.5, 0.6j, numpy.float64(2.303),
//   numpy.complex128(-1j), 2])
// def test_truediv_and_div(divisor):
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// op2 = copy.deepcopy(op)
// original = copy.deepcopy(op)
// res = op / divisor
// res2 = op2.__div__(divisor)  # To test python 2 version as well
// correct = op * (1. / divisor)
// assert res.isclose(correct)
// assert res2.isclose(correct)
// # Test if done out of place
// assert op.isclose(original)
// assert op2.isclose(original)
//
//
// def test_truediv_bad_divisor():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// with pytest.raises(TypeError):
// op = op / "0.5"
//
//
// @pytest.mark.parametrize("divisor", [0.5, 0.6j, numpy.float64(2.303),
//   numpy.complex128(-1j), 2])
// def test_itruediv_and_idiv(divisor):
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// op2 = copy.deepcopy(op)
// original = copy.deepcopy(op)
// correct = op * (1. / divisor)
// op /= divisor
// op2.__idiv__(divisor)  # To test python 2 version as well
// assert op.isclose(correct)
// assert op2.isclose(correct)
// # Test if done in-place
//   assert not op.isclose(original)
// assert not op2.isclose(original)
//
//
// def test_itruediv_bad_divisor():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// with pytest.raises(TypeError):
// op /= "0.5"
//
//
// def test_iadd_cancellation():
// term_a = ((1, 'X'), (3, 'Y'), (8, 'Z'))
// term_b = ((1, 'X'), (3, 'Y'), (8, 'Z'))
// a = new QubitOperator(term_a, 1.0)
// a += new QubitOperator(term_b, -1.0)
// assert len(a.terms) == 0
//
//
// def test_iadd_different_term():
// term_a = ((1, 'X'), (3, 'Y'), (8, 'Z'))
// term_b = ((1, 'Z'), (3, 'Y'), (8, 'Z'))
// a = new QubitOperator(term_a, 1.0)
// a += new QubitOperator(term_b, 0.5)
// assert len(a.terms) == 2
// assert a.terms[term_a] == pytest.approx(1.0)
// assert a.terms[term_b] == pytest.approx(0.5)
// a += new QubitOperator(term_b, 0.5)
// assert len(a.terms) == 2
// assert a.terms[term_a] == pytest.approx(1.0)
// assert a.terms[term_b] == pytest.approx(1.0)
//
//
// def test_iadd_bad_addend():
// op = new QubitOperator((), 1.0)
// with pytest.raises(TypeError):
// op += "0.5"
//
//
// def test_add():
// term_a = ((1, 'X'), (3, 'Y'), (8, 'Z'))
// term_b = ((1, 'Z'), (3, 'Y'), (8, 'Z'))
// a = new QubitOperator(term_a, 1.0)
// b = new QubitOperator(term_b, 0.5)
// res = a + b + b
// assert len(res.terms) == 2
// assert res.terms[term_a] == pytest.approx(1.0)
// assert res.terms[term_b] == pytest.approx(1.0)
// # Test out of place
// assert a.isclose(new QubitOperator(term_a, 1.0))
// assert b.isclose(new QubitOperator(term_b, 0.5))
//
//
// def test_add_bad_addend():
// op = new QubitOperator((), 1.0)
// with pytest.raises(TypeError):
// op = op + "0.5"
//
//
// def test_sub():
// term_a = ((1, 'X'), (3, 'Y'), (8, 'Z'))
// term_b = ((1, 'Z'), (3, 'Y'), (8, 'Z'))
// a = new QubitOperator(term_a, 1.0)
// b = new QubitOperator(term_b, 0.5)
// res = a - b
// assert len(res.terms) == 2
// assert res.terms[term_a] == pytest.approx(1.0)
// assert res.terms[term_b] == pytest.approx(-0.5)
// res2 = b - a
// assert len(res2.terms) == 2
// assert res2.terms[term_a] == pytest.approx(-1.0)
// assert res2.terms[term_b] == pytest.approx(0.5)
//
//
// def test_sub_bad_subtrahend():
// op = new QubitOperator((), 1.0)
// with pytest.raises(TypeError):
// op = op - "0.5"
//
//
// def test_isub_different_term():
// term_a = ((1, 'X'), (3, 'Y'), (8, 'Z'))
// term_b = ((1, 'Z'), (3, 'Y'), (8, 'Z'))
// a = new QubitOperator(term_a, 1.0)
// a -= new QubitOperator(term_b, 0.5)
// assert len(a.terms) == 2
// assert a.terms[term_a] == pytest.approx(1.0)
// assert a.terms[term_b] == pytest.approx(-0.5)
// a -= new QubitOperator(term_b, 0.5)
// assert len(a.terms) == 2
// assert a.terms[term_a] == pytest.approx(1.0)
// assert a.terms[term_b] == pytest.approx(-1.0)
//
//
// def test_isub_bad_addend():
// op = new QubitOperator((), 1.0)
// with pytest.raises(TypeError):
// op -= "0.5"
//
//
// def test_neg():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
//     -op
// # out of place
// assert op.isclose(new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5))
// correct = -1.0 * op
// assert correct.isclose(-op)
//
//
// def test_str():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// assert str(op) == "0.5 X1 Y3 Z8"
// op2 = new QubitOperator((), 2)
// assert str(op2) == "2 I"
//
//
// def test_str_empty():
// op = new QubitOperator()
// assert str(op) == '0'
//
//
// def test_str_multiple_terms():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// op += new QubitOperator(((1, 'Y'), (3, 'Y'), (8, 'Z')), 0.6)
// assert (str(op) == "0.5 X1 Y3 Z8 +\n0.6 Y1 Y3 Z8" or
// str(op) == "0.6 Y1 Y3 Z8 +\n0.5 X1 Y3 Z8")
// op2 = new QubitOperator((), 2)
// assert str(op2) == "2 I"
//
//
// def test_rep():
// op = new QubitOperator(((1, 'X'), (3, 'Y'), (8, 'Z')), 0.5)
// # Not necessary, repr could do something in addition
//     assert repr(op) == str(op)
