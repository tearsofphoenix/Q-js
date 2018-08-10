import {getEngineList} from '../setups/ibm';
import MainEngine from '../cengines/main';
import IBMBackend from '../backends/ibm/ibm';
import {All, Entangle, Measure} from '../ops';

function run_entangle(eng, num_qubits = 5) {
  /*
  Runs an entangling operation on the provided compiler engine.

      Args:
  eng (MainEngine): Main compiler engine to use.
  num_qubits (int): Number of qubits to entangle.

      Returns:
  measurement (list<int>): List of measurement outcomes.
  */
// allocate the quantum register to entangle
  const qureg = eng.allocateQureg(num_qubits)

  // entangle the qureg
  Entangle.or(qureg)

  // measure; should be all-0 or all-1
  new All(Measure).or(qureg)

  // run the circuit
  eng.flush()

  // access the probabilities via the back-end:
  const results = eng.backend.getProbabilities(qureg)

  // return one (random) measurement outcome.
  return qureg.map(q => q.toNumber())
}


// create main compiler engine for the IBM back-end
const eng = new MainEngine(new IBMBackend({
  use_hardware: true,
  num_runs: 1024,
  verbose: false,
  device: 'ibmqx4'
}),
getEngineList())

// run the circuit and print the result
console.log(run_entangle(eng))
