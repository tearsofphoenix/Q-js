import {Toffoli, CZ, CRz} from '../ops'

function U(theta, phi, lambda) {
  return (qureg) => {

  }
}

// gate u3(theta,phi,lambda) q { U(theta,phi,lambda) q; }
const u3 = (theta, phi, lambda) => qureg => U(theta, phi, lambda)(qureg);
// gate u2(phi,lambda) q { U(pi/2,phi,lambda) q; }

const u2 = (phi, lambda) => qureg => U(Math.PI / 2, phi, lambda)(qureg);
// gate u1(lambda) q { U(0,0,lambda) q; }
const u1 = lambda => qureg => U(0, 0, lambda)(qureg);
// idle gate (identity)
const id = () => qureg => U(0, 0, 0)(qureg);

// idle gate (identity) with length gamma*sqglen
// gate u0(gamma) q { U(0,0,0) q; }
const u0 = gamma => q => U(0, 0, 0)(q)

// Pauli gate: bit-flip
// gate x a { u3(pi,0,pi) a; }
const x = () => a => u3(Math.PI, 0, Math.PI)(a)

// Pauli gate: bit and phase flip
// gate y a { u3(pi,pi/2,pi/2) a; }
const y = () => a => u3(Math.PI, Math.PI / 2, Math.PI / 2)(a)
// Pauli gate: phase flip
// gate z a { u1(pi) a; }
const z = () => a => u1(Math.PI)(a)
// Clifford gate: Hadamard
// gate h a { u2(0,pi) a; }
const h = () => a => u2(0, Math.PI)(a)

// Clifford gate: sqrt(Z) phase gate
// gate s a { u1(pi/2) a; }
const s = () => a => u1(Math.PI / 2)(a)

// Clifford gate: conjugate of sqrt(Z)
// gate sdg a { u1(-pi/2) a; }
const sdg = () => a => u1(-Math.PI / 2)(a)
// C3 gate: sqrt(S) phase gate
// gate t a { u1(pi/4) a; }
const t = () => a => u1(Math.PI / 4)(a)
// C3 gate: conjugate of sqrt(S)
// gate tdg a { u1(-pi/4) a; }
const tdg = () => a => u1(-Math.PI / 4)(a)

// --- Standard rotations ---
// Rotation around X-axis
// gate rx(theta) a { u3(theta, -pi/2,pi/2) a; }
const rx = theta => a => u3(theta, -Math.PI / 2, Math.PI / 2)(a)
// rotation around Y-axis
// gate ry(theta) a { u3(theta,0,0) a; }
const ry = theta => a => u3(theta, 0, 0)(a)
// rotation around Z axis
// gate rz(phi) a { u1(phi) a; }
const rz = phi => a => u1(phi)(a)

const cz = () => qureg => CZ.or(qureg)

const ccx = () => qureg => Toffoli.or(qureg)

const crz = lambda => qureg => CRz(lambda).or(qureg)

export default {
  u3,
  u2,
  u1,
  id,
  x,
  y,
  z,
  h,
  s,
  sdg,
  t,
  tdg,

  rx,
  ry,
  rz,

  cz,
  ccx,
  crz
}
