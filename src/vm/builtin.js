import math from 'mathjs'
import {BasicGate} from '../ops'

const EPSILON = 1e-13

function trimValue(value) {
  if (math.im(value) < EPSILON) {
    const real = math.re(value)
    return real < EPSILON ? 0 : real
  }
  if (math.abs(value) < EPSILON) {
    return 0
  }
  return value
}

export function UMatrix(theta, phi, lambda) {
  const mc = math.complex
  const mm = math.multiply
  const e = math.exp
  const a = mm(e(mc(0, -(phi + lambda) / 2)), math.cos(theta / 2))
  const b = mm(mm(e(mc(0, -(phi - lambda) / 2)), -1), math.sin(theta / 2))
  const c = mm(e(mc(0, (phi - lambda) / 2)), math.sin(theta / 2))
  const d = mm(e(mc(0, (phi + lambda) / 2)), math.cos(theta / 2))
  return math.matrix([
    [trimValue(a), trimValue(b)],
    [trimValue(c), trimValue(d)]
  ])
}

class UniformGate extends BasicGate {
  constructor(theta, phi, lambda) {
    super()
    this.theta = theta
    this.phi = phi
    this.lambda = lambda
    this._matrix = UMatrix(this.theta, this.phi, this.lambda)
  }

  toString() {
    return 'U'
  }

  get matrix() {
    return this._matrix
  }
}

export function U(theta, phi, lambda) {
  return new UniformGate(theta, phi, lambda)
}
