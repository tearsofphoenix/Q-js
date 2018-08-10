
// phase function
import MainEngine from '../cengines/main'
import {Compute, Uncompute} from '../meta'
import {
  All, H, X, Measure
} from '../ops'

function f(a, b, c, d) {
  return (a && b) ^ (c && d)
}

const eng = new MainEngine()

const qubits = eng.allocateQureg(4)

const [x1, x2, x3, x4] = qubits

Compute(eng, () => {
  new All(H).or(qubits)
  X.or(x1)
})

new PhaseOracle(f).or(qubits)
Uncompute(eng)

new PhaseOracle(f).or(qubits)
new All(H).or(qubits)
new All(Measure).or(qubits)

eng.flush()

console.log(`Shift is ${8 * x4.toNumber() + 4 * x3.toNumber() + 2 * x2.toNumber() + x1.toNumber()}`)
