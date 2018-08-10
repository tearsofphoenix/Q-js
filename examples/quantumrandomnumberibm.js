// create a main compiler engine
import MainEngine from '../cengines/main';
import IBMBackend from '../backends/ibm/ibm';
import {getEngineList} from '../setups/ibm';
import {Measure, H} from '../ops';

const eng = new MainEngine(new IBMBackend({user: '', password: ''}), getEngineList())

// allocate one qubit
const q1 = eng.allocateQubit()

// put it in superposition
H.or(q1)

// measure
Measure.or(q1)

eng.flush()
// // print the result:
// console.log(`Measured: ${q1.toNumber()}`)
