
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

// phase function
import { MainEngine } from '../src/cengines/main'
import { Compute, Uncompute } from '../src/meta'
import {
  All, H, X, Measure
} from '../src/ops'

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
