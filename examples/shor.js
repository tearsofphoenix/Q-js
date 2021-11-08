
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
Runs the quantum subroutine of Shor's algorithm for factoring.

@param
    eng (MainEngine): Main compiler engine to use.
N (int): Number to factor.
a (int): Relative prime to use as a base for a^x mod N.
verbose (bool): If true, display intermediate measurement results.

    @returns
r (float): Potential period of a.
 */
import math from 'mathjs'
import { AddConstant, AddConstantModN, MultiplyByConstantModN } from '../src/libs/math/gates';
import {
  All, H, Measure, X, R, BasicMathGate, QFT, Swap
} from '../src/ops';
import { Control } from '../src/meta';
import { getInverse } from '../src/ops/_cycle';
import ResourceCounter from '../src/backends/resource';
import { DecompositionRuleSet } from '../src/cengines/replacer/decompositionruleset';
import { AutoReplacer, InstructionFilter } from '../src/cengines';
import { TagRemover } from '../src/cengines/tagremover';
import { LocalOptimizer } from '../src/cengines/optimize';
import { MainEngine } from '../src/cengines/main';
import { Simulator } from '../src/backends/simulators/simulator';
import decompositions from '../src/setups/decompositions'
import mathRules from '../src/libs/math/defaultrules'
import { expmod } from '../src/libs/polyfill';

function run_shor(eng, N, a, verbose = false) {
  const n = Math.ceil(Math.log2(N))

  const x = eng.allocateQureg(n)

  X.or(x[0])

  const measurements = new Array(2 * n) // will hold the 2n measurement results
  for (let i = 0; i < 2 * n; ++i) {
    measurements[i] = 0
  }
  const ctrl_qubit = eng.allocateQubit()

  for (let k = 0; k < 2 * n; ++k) {
    const t = 1 << (2 * n - 1 - k)
    const current_a = expmod(a, t, N)
    // one iteration of 1-qubit QPE
    H.or(ctrl_qubit)

    Control(eng, ctrl_qubit, () => new MultiplyByConstantModN(current_a, N).or(x))

    // perform inverse QFT --> Rotations conditioned on previous outcomes
    for (let i = 0; i < k; ++i) {
      if (measurements[i]) {
        new R(-Math.pi / (1 << (k - i))).or(ctrl_qubit)
      }
    }
    H.or(ctrl_qubit)

    // and measure
    Measure.or(ctrl_qubit)
    eng.flush()
    measurements[k] = ctrl_qubit.toNumber()
    if (measurements[k]) {
      X.or(ctrl_qubit)
    }

    if (verbose) {
      console.log(`${measurements[k]}`)
    }
  }

  new All(Measure).or(x)
  // turn the measured values into a number in [0,1)

  let sum = 0
  for (let i = 0; i < 2 * n; ++i) {
    sum += measurements[2 * n - 1 - i] * 1.0 / (1 << (i + 1))
  }
  const y = sum

  // continued fraction expansion to get denominator (the period?)
  const r = Fraction(y).limit_denominator(N - 1).denominator

  // return the (potential) period
  return r
}


// Filter function, which defines the gate set for the first optimization
// (don't decompose QFTs and iQFTs to make cancellation easier)
function high_level_gates(eng, cmd) {
  const g = cmd.gate
  if (g.equal(QFT) || getInverse(g).equal(QFT) || g.equal(Swap)) {
    return true
  }
  if (g instanceof BasicMathGate) {
    return false
  }

  if (g instanceof AddConstant) {
    return true
  } else if (g instanceof AddConstantModN) {
    return true
  }
  return eng.next.isAvailable(cmd)
}

// build compilation engine list
const resource_counter = new ResourceCounter()
const rule_set = new DecompositionRuleSet([...mathRules, ...decompositions])
const compilerengines = [
  new AutoReplacer(rule_set),
  new InstructionFilter(high_level_gates),
  new TagRemover(),
  new LocalOptimizer(3),
  new AutoReplacer(rule_set),
  new TagRemover(),
  new LocalOptimizer(3),
  resource_counter]

// make the compiler and run the circuit on the simulator backend
const eng = new MainEngine(new Simulator(), compilerengines)

// console.log welcome message and ask the user for the number to factor
console.log("\n\tprojectq\n\t--------\n\tImplementation of Shor's algorithm.")
const N = Math.floor(Math.random() * 1000)

console.log(`\n\tNumber to factor: ${N}`)
console.log(`\n\tFactoring N = ${N}: `)

// choose a base at random:
const a = Math.floor(Math.random() * N)
const g = math.gcd(a, N)
if (g !== 1) {
  console.log('\n\n\tOoops, we were lucky: Chose non relative prime by accident :)')
  console.log(`\tFactor: ${g}`)
} else {
  // run the quantum subroutine
  let r = run_shor(eng, N, a, true)

  // try to determine the factors
  if (r % 2 !== 0) {
    r *= 2
  }
  const apowrhalf = expmod(a, r >> 1, N)
  let f1 = math.gcd(apowrhalf + 1, N)
  let f2 = math.gcd(apowrhalf - 1, N)
  if (f1 * f2 !== N && f1 * f2 > 1 && Math.floor(1.0 * N / (f1 * f2)) * f1 * f2 === N) {
    const t1 = f1 * f2
    const t2 = Math.floor(N / (f1 * f2))
    f1 = t1
    f2 = t2
    if (f1 * f2 === N && f1 > 1 && f2 > 1) {
      console.log(`\n\n\tFactors found :-) : ${f1} * ${f2} = ${N}`)
    } else {
      console.log(`\n\n\t[91mBad luck: Found ${f1} and ${f2}`)
    }
  }
  console.log(resource_counter) // console.log resource usage
}
