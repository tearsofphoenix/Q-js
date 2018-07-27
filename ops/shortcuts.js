import {C} from './metagates'
import {Rz, NOT, Z} from './gates'

export function CRz(angle) {
  return C(Rz(angle), 1)
}

export const CNOT = C(NOT)

export const CX = CNOT

export const CZ = C(Z)

export const Toffoli = C(CNOT)
