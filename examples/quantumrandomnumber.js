
// create a main compiler engine
import MainEngine from '../cengines/main'
import {H, Measure} from '../ops/gates'

const eng = new MainEngine()

// allocate one qubit
const q1 = eng.allocateQubit()

// put it in superposition
H.or(q1)

// measure
Measure.or(q1)

eng.flush()
// print the result:
console.log(`Measured: ${q1.toNumber()}`)
