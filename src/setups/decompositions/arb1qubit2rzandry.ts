import math, { Complex, Matrix } from 'mathjs'
import { Control } from '@/meta';
import { len, productLoop, productLoop3 } from '@/libs/polyfill';
import { DecompositionRule } from '@/cengines/replacer/decompositionrule';
import {
  BasicGate, Rz, Ry, Ph
} from '@/ops';
import { ICommand, IMathGate } from '@/interfaces';

const TOLERANCE = 1e-12

export function phase(c: number | Complex): number {
  if (typeof c === 'number') {
    return Math.atan2(0, c)
  }
  return Math.atan2(c.im, c.re)
}

/**
* 
Recognize an arbitrary one qubit gate which has a matrix property.

    It does not allow gates which have control qubits as otherwise the
AutoReplacer might go into an infinite loop. Use
carb1qubit2cnotrzandry instead.
 */
export const _recognize_arb1qubit = (cmd: ICommand) => {
  try {
    const m = (cmd.gate as IMathGate).matrix;
    return len(m) === 2 && cmd.controlCount === 0
  } catch (e) {
    return false
  }
}

/**
* 
It builds matrix U with parameters (a, b/2, c/2, d/2) and compares against
matrix.

    U = [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]

  @param matrix 2x2 matrix
  @param a parameter of U
  @param b_half b/2. parameter of U
  @param c_half c/2. parameter of U
  @param d_half d/2. parameter of U

@return true if matrix elements of U and `matrix` are TOLERANCE close.
 */
const _test_parameters = (matrix: Matrix, a: number, b_half: number, c_half: number, d_half: number) => {
  const mc = math.complex
  const mm = math.multiply
  const U = [
    [
      mm(math.exp(mc(0, a - b_half - d_half)), math.cos(c_half)),
      mm(mm(math.exp(mc(0, a - b_half + d_half)), -1), math.sin(c_half))
    ],
    [
      mm(math.exp(mc(0, a + b_half - d_half)), math.sin(c_half)),
      mm(math.exp(mc(0, a + b_half + d_half)), math.cos(c_half))
    ]
  ] as number[][];
  return math.deepEqual(U, matrix)
}

/**
* 
Given a 2x2 unitary matrix, find the parameters
a, b/2, c/2, and d/2 such that
matrix == [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]

Note:
    If the matrix is element of SU(2) (determinant == 1), then
we can choose a = 0.

@param matrix 2x2 unitary matrix

@return parameters of the matrix: (a, b/2, c/2, d/2)
 */
export const _find_parameters = (matrix: Matrix) => {
  // Determine a, b/2, c/2 and d/2 (3 different cases).
  // Note: everything is modulo 2pi.
  let a: number;
  let b_half: number = 0;
  let c_half: number = 0;
  let d_half: number = 0;
  const mm = math.multiply;
  const PI = Math.PI;
  // Case 1: sin(c/2) == 0:
  if (math.abs(matrix[0][1]) < TOLERANCE) {
    const t = phase(mm(matrix[0][0], matrix[1][1]))
    const two_a = math.mod(t, 2 * PI)
    if (math.abs(two_a) < TOLERANCE || math.abs(two_a) > 2 * PI - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0
    } else {
      a = two_a / 2.0
    }
    d_half = 0 // w.l.g
    const b = phase(matrix[1][1]) - phase(matrix[0][0])
    const possible_b_half = [math.mod(b / 2.0, 2 * PI), math.mod(b / 2.0 + PI, 2 * PI)]
    // As we have fixed a, we need to find correct sign for cos(c/2)
    const possible_c_half = [0.0, PI]
    let found = false
    productLoop(possible_b_half, possible_c_half, (_b: number, _c: number) => {
      b_half = _b;
      c_half = _c;
      if (_test_parameters(matrix, a, b_half, c_half, d_half)) {
        found = true
        return true
      }
      return false;
    })

    if (!found) {
      throw new Error(`Couldn't find parameters for matrix ${matrix},
        This shouldn't happen. Maybe the matrix is 
        not unitary?`)
    }
  }
  // Case 2: cos(c/2) == 0:
  else if (math.abs(matrix[0][0]) < TOLERANCE) {
    const t = phase(mm(mm(matrix[0][1], matrix[1][0]), -1))
    const two_a = math.mod(t, 2 * PI)
    if (math.abs(two_a) < TOLERANCE || math.abs(two_a) > 2 * PI - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0
    } else {
      a = two_a / 2.0
    }
    d_half = 0 // w.l.g
    const b = phase(matrix[1][0]) - phase(matrix[0][1]) + PI
    const possible_b_half = [math.mod(b / 2.0, 2 * PI), math.mod(b / 2.0 + PI, 2 * PI)]
    // As we have fixed a, we need to find correct sign for sin(c/2)
    const possible_c_half = [PI / 2.0, 3.0 / 2.0 * PI]
    let found = false
    productLoop(possible_b_half, possible_c_half, (_b, _c) => {
      b_half = _b
      c_half = _c
      if (_test_parameters(matrix, a, b_half, c_half, d_half)) {
        found = true
        return true
      }
      return false;
    })
    if (!found) {
      throw new Error(`Couldn't find parameters for matrix ${matrix},
        This shouldn't happen. Maybe the matrix is 
        not unitary?`)
    }
  }
  // Case 3: sin(c/2) != 0 and cos(c/2) !=0:
  else {
    const t = phase(mm(matrix[0][0], matrix[1][1]))
    const two_a = math.mod(t, 2 * PI)
    if (math.abs(two_a) < TOLERANCE || math.abs(two_a) > 2 * PI - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0
    } else {
      a = two_a / 2.0
    }
    const two_d = 2.0 * phase(matrix[0][1]) - 2.0 * phase(matrix[0][0]);
    const possible_d_half = [
      math.mod(two_d / 4.0, 2 * PI),
      math.mod(two_d / 4.0 + PI / 2.0, 2 * PI),
      math.mod(two_d / 4.0 + PI, 2 * PI),
      math.mod(two_d / 4.0 + 3.0 / 2.0 * PI, 2 * PI)]
    const two_b = 2.0 * phase(matrix[1][0]) - 2.0 * phase(matrix[0][0])
    const possible_b_half = [
      math.mod(two_b / 4.0, 2 * PI),
      math.mod(two_b / 4.0 + PI / 2.0, 2 * PI),
      math.mod(two_b / 4.0 + PI, 2 * PI),
      math.mod(two_b / 4.0 + 3.0 / 2.0 * PI, 2 * PI)]
    const tmp = math.acos(math.abs(matrix[1][1]))
    const possible_c_half = [
      math.mod(tmp, 2 * PI),
      math.mod(tmp + PI, 2 * PI),
      math.mod(-1.0 * tmp, 2 * PI),
      math.mod(-1.0 * tmp + PI, 2 * PI)]
    let found = false
    productLoop3(possible_b_half, possible_c_half, possible_d_half, (_b, _c, _d) => {
      b_half = _b
      c_half = _c
      d_half = _d
      if (_test_parameters(matrix, a, b_half, c_half, d_half)) {
        found = true
        return true
      }
      return false;
    })
    if (!found) {
      throw new Error(`Couldn't find parameters for matrix ${matrix},
        This shouldn't happen. Maybe the matrix is 
        not unitary?`)
    }
  }
  return [a, b_half, c_half, d_half]
}

/**
 * @param cmd
Use Z-Y decomposition of Nielsen and Chuang (Theorem 4.1).

An arbitrary one qubit gate matrix can be writen as
U = [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]
where a,b,c,d are real numbers.
    Then U = exp(j*a) Rz(b) Ry(c) Rz(d).
    If the matrix is element of SU(2) (determinant == 1), then
we can choose a = 0.
 */
const _decompose_arb1qubit = (cmd: ICommand) => {
  const matrix = (cmd.gate as IMathGate).matrix.clone() as any;
  const [a, b_half, c_half, d_half] = _find_parameters(matrix)
  const qb = cmd.qubits
  const eng = cmd.engine
  Control(eng, cmd.controlQubits, () => {
    if (!new Rz(2 * d_half).equal(new Rz(0))) {
      new Rz(2 * d_half).or(qb)
    }

    if (!new Ry(2 * c_half).equal(new Ry(0))) {
      new Ry(2 * c_half).or(qb)
    }
    if (!new Rz(2 * b_half).equal(new Rz(0))) {
      new Rz(2 * b_half).or(qb)
    }
    if (a !== 0) {
      new Ph(a).or(qb)
    }
  })
}


export default [
  new DecompositionRule(BasicGate, _decompose_arb1qubit, _recognize_arb1qubit)
]
