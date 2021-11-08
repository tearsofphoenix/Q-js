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

/*
Returns a Bell-pair (two qubits in state :math:`|A\rangle \otimes |B
    \rangle = \frac 1{\sqrt 2} \left( |0\rangle\otimes|0\rangle + |1\rangle
    \otimes|1\rangle \right)`).

@param
    eng (MainEngine): MainEngine from which to allocate the qubits.

    @returns
bell_pair (tuple<Qubits>): The Bell-pair.
 */

import {
  CNOT, H, Measure, Rz, X, Z
} from '../src/ops'
import { tuple } from '../src/libs/util'
import { MainEngine } from '../src/cengines/main';
import { Control, Dagger } from '../src/meta';

function create_bell_pair(eng) {
  const b1 = eng.allocateQubit()
  const b2 = eng.allocateQubit()

  H.or(b1)
  CNOT.or(tuple(b1, b2))

  return [b1, b2]
}

/*
Runs quantum teleportation on the provided main compiler engine.

    Creates a state from |0> using the state_creation_function, teleports this
state to Bob who then tries to uncompute his qubit using the inverse of
the state_creation_function. If successful, deleting the qubit won't raise
an error in the underlying Simulator back-end (else it will).

@param
    eng (MainEngine): Main compiler engine to run the circuit on.
state_creation_function (function): Function which accepts the main
engine and a qubit in state |0>, which it then transforms to the
state that Alice would like to send to Bob.
verbose (bool): If true, info messages will be printed.
 */
export function run_teleport(eng, state_creation_function, verbose = false) {
  // make a Bell-pair
  const [b1, b2] = create_bell_pair(eng)

  // Alice creates a nice state to send
  const psi = eng.allocateQubit()
  if (verbose) {
    console.log('Alice is creating her state from scratch, i.e., |0>.')
  }

  state_creation_function(eng, psi)
  // entangle it with Alice's b1
  CNOT.or(tuple(psi, b1))
  if (verbose) {
    console.log('Alice entangled her qubit with her share of the Bell-pair.')
  }
  // measure two values (once in Hadamard basis) and send the bits to Bob
  H.or(psi)
  Measure.or(psi)
  Measure.or(b1)
  const msg_to_bob = [psi.toNumber(), b1.toNumber()]
  if (verbose) {
    console.log(`Alice is sending the message ${msg_to_bob} to Bob.`)
  }
  // Bob may have to apply up to two operation depending on the message sent
  // by Alice:
  Control(eng, b1, () => X.or(b2))
  Control(eng, psi, () => Z.or(b2))

  // try to uncompute the psi state
  if (verbose) {
    console.log('Bob is trying to uncompute the state.')
  }

  Dagger(eng, () => state_creation_function(eng, b2))
  // check whether the uncompute was successful. The simulator only allows to
  // delete qubits which are in a computational basis state.
  b2.deallocate()
  eng.flush()

  if (verbose) {
    console.log('Bob successfully arrived at |0>')
  }
}
// create a main compiler engine with a simulator backend:
const eng = new MainEngine()

// define our state-creation routine, which transforms a |0> to the state
// we would like to send. Bob can then try to uncompute it and, if he
// arrives back at |0>, we know that the teleportation worked.
function create_state(eng, qb) {
  H.or(qb)
  new Rz(1.21).or(qb)
}

// run the teleport and then, let Bob try to uncompute his qubit:
run_teleport(eng, create_state, true)
