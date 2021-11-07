import math, { complex, multiply, Matrix } from 'mathjs'
import assert from 'assert'
import DecompositionRule from '@/cengines/replacer/decompositionrule';
import {
  BasicGate, Ph, Ry, Rz, X
} from '@/ops';
import { Control } from '@/meta';
import { len, productLoop } from '@/libs/polyfill';
import { _find_parameters, phase } from './arb1qubit2rzandry'
import { ICommand, IMathGate } from '@/interfaces';

const mm = multiply
const mc = complex
const TOLERANCE = 1e-12

/**
* 
 * Recognize single controlled one qubit gates with a matrix.
 * @param {Command} cmd
 * @return {boolean}
 * @private
 */
export function _recognize_carb1qubit(cmd: ICommand) {
  if (cmd.controlCount === 1) {
    try {
      const m = (cmd.gate as IMathGate).matrix
      if (len(m) === 2) {
        return true
      }
    } catch (e) {
      return false
    }
  }
  return false
}

/**
It builds matrix V with parameters (a, b, c/2) and compares against
matrix.

    V = [[-sin(c/2) * exp(j*a), exp(j*(a-b)) * cos(c/2)],
  [exp(j*(a+b)) * cos(c/2), exp(j*a) * sin(c/2)]]

  @param matrix 2x2 matrix
  @param a Parameter of V
  @param b Parameter of V
  @param c_half c/2. Parameter of V

  @return {boolean} true if matrix elements of V and `matrix` are TOLERANCE close.
 */
function _test_parameters(matrix: Matrix, a: number, b: number, c_half: number): boolean {
  const { exp } = math
  const cosc = math.cos(c_half)
  const sinc = math.sin(c_half)
  const V = [
    [mm(mm(sinc, exp(mc(0, a))), -1), mm(exp(mc(0, a - b)), cosc)],
    [mm(exp(mc(0, a + b)), cosc), mm(exp(mc(0, a)), sinc)]] as any;
  return Boolean(math.deepEqual(V, matrix));
}

/**
* 
Recognizes a matrix which can be written in the following form:

    V = [[-sin(c/2) * exp(j*a), exp(j*(a-b)) * cos(c/2)],
      [exp(j*(a+b)) * cos(c/2), exp(j*a) * sin(c/2)]]

  @param {Array.<number[]>} matrix 2x2 matrix
  @return {boolean} false if it is not possible otherwise (a, b, c/2)
 */
export function _recognize_v(matrix: Matrix) {
  let a: number;
  let b: number = 0;
  let c_half: number = 0;
  const PI = Math.PI;
  if (math.abs(matrix[0][0]) < TOLERANCE) {
    const t = phase(mm(matrix[0][1], matrix[1][0]))
    const two_a = math.mod(t, 2 * PI)
    if (math.abs(two_a) < TOLERANCE || math.abs(two_a) > 2 * PI - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0
    } else {
      a = two_a / 2.0
    }
    const two_b = phase(matrix[1][0]) - phase(matrix[0][1])
    const possible_b = [math.mod(two_b / 2.0, 2 * PI),
    math.mod(two_b / 2.0 + PI, 2 * PI)]
    const possible_c_half = [0, PI]
    let found = false
    productLoop(possible_b, possible_c_half, (_b, _c) => {
      b = _b
      c_half = _c
      if (_test_parameters(matrix, a, b, c_half)) {
        found = true
        return true
      }
      return false;
    });

    assert(found) // It should work for all matrices with matrix[0][0]==0.
    return [a, b, c_half]
  } else if (math.abs(matrix[0][1]) < TOLERANCE) {
    const t = phase(mm(mm(matrix[0][0], matrix[1][1]), -1))
    const two_a = math.mod(t, 2 * PI)
    if (math.abs(two_a) < TOLERANCE || math.abs(two_a) > 2 * PI - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0
    } else {
      a = two_a / 2.0
    }
    b = 0
    const possible_c_half = [PI / 2.0, 3.0 / 2.0 * PI]
    const found = false
    for (let i = 0; i < possible_c_half.length; ++i) {
      c_half = possible_c_half[i]
      if (_test_parameters(matrix, a, b, c_half)) {
        return [a, b, c_half]
      }
    }
    return []
  } else {
    const t = mm(mm(-1.0, matrix[0][0]), matrix[1][1])
    const two_a = math.mod(phase(t), 2 * PI)
    if (math.abs(two_a) < TOLERANCE || math.abs(two_a) > 2 * PI - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0
    } else {
      a = two_a / 2.0
    }
    const two_b = phase(matrix[1][0]) - phase(matrix[0][1])
    const possible_b = [
      math.mod((two_b / 2.0), 2 * PI),
      math.mod((two_b / 2.0 + PI), 2 * PI)]
    const tmp = math.acos(math.abs(matrix[1][0]))
    const possible_c_half = [
      math.mod(tmp, 2 * PI),
      math.mod(tmp + PI, 2 * PI),
      math.mod(-1.0 * tmp, 2 * PI),
      math.mod(-1.0 * tmp + PI, 2 * PI)]
    let found = false
    productLoop(possible_b, possible_c_half, (_b, _c) => {
      b = _b
      c_half = _c
      if (_test_parameters(matrix, a, b, c_half)) {
        found = true
        return true
      }
      return false;
    })
    if (!found) {
      return []
    }
    return [a, b, c_half]
  }
}

/**
Decompose the single controlled 1 qubit gate into CNOT, Rz, Ry, C(Ph).

    See Nielsen and Chuang chapter 4.3.

    An arbitrary one qubit gate matrix can be writen as
U = [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]
where a,b,c,d are real numbers.
    Then U = exp(j*a) Rz(b) Ry(c) Rz(d).

    Then C(U) = C(exp(ja)) * A * CNOT * B * CNOT * C with
    A = Rz(b) * Ry(c/2)
  B = Ry(-c/2) * Rz(-(d+b)/2)
C = Rz((d-b)/2)
Note that a == 0 if U is element of SU(2). Also note that
the controlled phase C(exp(ia)) can be implemented with single
  qubit gates.

    If the one qubit gate matrix can be writen as
V = [[-sin(c/2) * exp(j*a), exp(j*(a-b)) * cos(c/2)],
  [exp(j*(a+b)) * cos(c/2), exp(j*a) * sin(c/2)]]
Then C(V) = C(exp(ja))* E * CNOT * D with
    E = Rz(b)Ry(c/2)
D = Ry(-c/2)Rz(-b)
This improvement is important for C(Y) or C(Z)

For a proof follow Lemma 5.5 of Barenco et al.
 */
function _decompose_carb1qubit(cmd: ICommand) {
  const matrix = (cmd.gate as IMathGate).matrix;
  const qb = cmd.qubits
  const eng = cmd.engine

  // Case 1: Unitary matrix which can be written in the form of V:
  const parameters_for_v = _recognize_v(matrix)
  if (parameters_for_v.length > 0) {
    const [a, b, c_half] = parameters_for_v
    if (!new Rz(-b).equal(new Rz(0))) {
      new Rz(-b).or(qb)
    }
    if (!new Ry(-c_half).equal(new Ry(0))) {
      new Ry(-c_half).or(qb)
    }
    Control(eng, cmd.controlQubits, () => X.or(qb))
    if (!new Ry(c_half).equal(new Ry(0))) {
      new Ry(c_half).or(qb)
    }
    if (!new Rz(b).equal(new Rz(0))) {
      new Rz(b).or(qb)
    }
    if (a !== 0) {
      Control(eng, cmd.controlQubits, () => new Ph(a).or(qb))
    }
    // Case 2: General matrix U:
  } else {
    const [a, b_half, c_half, d_half] = _find_parameters(matrix)
    const d = 2 * d_half
    const b = 2 * b_half
    if (!new Rz((d - b) / 2.0).equal(new Rz(0))) {
      new Rz((d - b) / 2.0).or(qb)
    }
    Control(eng, cmd.controlQubits, () => X.or(qb))
    if (!new Rz(-(d + b) / 2.0).equal(new Rz(0))) {
      new Rz(-(d + b) / 2.0).or(qb)
    }
    if (!new Ry(-c_half).equal(new Ry(0))) {
      new Ry(-c_half).or(qb)
    }
    Control(eng, cmd.controlQubits, () => X.or(qb))
    if (!new Ry(c_half).equal(new Ry(0))) {
      new Ry(c_half).or(qb)
    }
    if (!new Rz(b).equal(new Rz(0))) {
      new Rz(b).or(qb)
    }
    if (a !== 0) {
      Control(eng, cmd.controlQubits, () => new Ph(a).or(qb))
    }
  }
}

export default [
  new DecompositionRule(BasicGate, _decompose_carb1qubit, _recognize_carb1qubit)
]
