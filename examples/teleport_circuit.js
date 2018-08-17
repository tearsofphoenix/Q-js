
// create a main compiler engine with a simulator backend:
import {CircuitDrawer} from '../src/backends/circuits/drawer';
import MainEngine from '../src/cengines/main';
import {run_teleport} from './teleport';

const drawing_engine = new CircuitDrawer()
const locations = {0: 1, 1: 2, 2: 0}
drawing_engine.setQubitLocations(locations)
const eng = new MainEngine(drawing_engine)

// we just want to draw the teleportation circuit
const create_state = (eng, qb) => {

}

// run the teleport and then, let Bob try to uncompute his qubit:
run_teleport(eng, create_state, false)

// print latex code to draw the circuit:
console.log(drawing_engine.getLatex())
