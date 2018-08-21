
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

// Draper's addition by constant https://arxiv.org/abs/quant-ph/0008033

/**
Adds a classical constant c to the quantum integer (qureg) quint using
Draper addition.

    Note: Uses the Fourier-transform adder from
https://arxiv.org/abs/quant-ph/0008033.
 */
import assert from 'assert'
import math from 'mathjs'
import {Compute, CustomUncompute, Uncompute} from '../../meta/compute'
import {QFT} from '../../ops/qftgate'
import {R, Swap, X} from '../../ops/gates'
import {
  AddConstant, AddConstantModN, SubConstant, SubConstantModN
} from './gates';
import {tuple} from '../util';
import {CNOT} from '../../ops/shortcuts';
import {Control} from '../../meta/control';
import {len} from '../polyfill';

/**
 * Adds a classical constant c to the quantum integer (qureg) quint using Draper addition.
 * Note: Uses the Fourier-transform adder from `https://arxiv.org/abs/quant-ph/0008033`.
 */
export function add_constant(eng, c, quint) {
  Compute(eng, () => QFT.or(quint))

  for (let i = 0; i < quint.length; ++i) {
    for (let j = i; j > -1; j -= 1) {
      if ((c >> j) & 1) {
        new R(math.pi / (1 << (i - j))).or(quint[i])
      }
    }
  }

  Uncompute(eng)
}

// Modular adder by Beauregard https://arxiv.org/abs/quant-ph/0205095
/**
Adds a classical constant c to a quantum integer (qureg) quint modulo N
using Draper addition and the construction from `https://arxiv.org/abs/quant-ph/0205095`.
 */
export function add_constant_modN(eng, c, N, quint) {
  assert(c < N && c >= 0)

  new AddConstant(c).or(quint)

  let ancilla

  Compute(eng, () => {
    SubConstant(N).or(quint)
    ancilla = eng.allocateQubit()
    CNOT.or(tuple(quint[quint.length - 1], ancilla))
    Control(eng, ancilla, () => new AddConstant(N).or(quint))
  })

  SubConstant(c).or(quint)

  CustomUncompute(eng, () => {
    X.or(quint[quint.length - 1])
    CNOT.or(tuple(quint[quint.length - 1], ancilla))
    X.or(quint[quint.length - 1])
    ancilla.deallocate()
  })

  new AddConstant(c).or(quint)
}


// calculates the inverse of a modulo N
function inv_mod_N(a, N) {
  let s = 0
  let old_s = 1
  let r = N
  let old_r = a
  while (r !== 0) {
    const q = Math.floor(old_r / r)
    let tmp = r
    r = old_r - q * r
    old_r = tmp
    tmp = s
    s = old_s - q * s
    old_s = tmp
  }
  return (old_s + N) % N
}

// Modular multiplication by modular addition & shift, followed by uncompute
// from https://arxiv.org/abs/quant-ph/0205095

/**
Multiplies a quantum integer by a classical number a modulo N, i.e.,

|x> -> |a*x mod N>

(only works if a and N are relative primes, otherwise the modular inverse
does not exist).
 */
export function mul_by_constant_modN(eng, c, N, quint_in) {
  assert(c < N && c >= 0)
  assert(math.gcd(c, N) === 1)

  const n = len(quint_in)
  const quint_out = eng.allocateQureg(n + 1)

  for (let i = 0; i < n; ++i) {
    Control(eng, quint_in[i], () => new AddConstantModN((c << i) % N, N).or(quint_out))
  }

  for (let i = 0; i < n; ++i) {
    Swap.or(tuple(quint_out[i], quint_in[i]))
  }

  const cinv = inv_mod_N(c, N)

  for (let i = 0; i < n; ++i) {
    Control(eng, quint_in[i], () => SubConstantModN((cinv << i) % N, N).or(quint_out))
  }

  quint_out.deallocate()
}
