/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {getEngineList} from '../src/setups/ibm';
import MainEngine from '../src/cengines/main';
import IBMBackend from '../src/backends/ibm/ibm';
import {All, Entangle, Measure} from '../src/ops';

function run_entangle(eng, num_qubits = 5) {
  /*
  Runs an entangling operation on the provided compiler engine.

      @param
  eng (MainEngine): Main compiler engine to use.
  num_qubits (int): Number of qubits to entangle.

      @returns
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
