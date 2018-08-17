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

// create a main compiler engine
import MainEngine from '../src/cengines/main';
import IBMBackend from '../src/backends/ibm/ibm';
import {getEngineList} from '../src/setups/ibm';
import {Measure, H} from '../src/ops';

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
