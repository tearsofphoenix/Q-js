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

import {expect} from 'chai'
import math from 'mathjs'
import {BasicMathGate, ClassicalInstructionGate} from '../../src/ops/basics';
import {len} from '../../src/libs/polyfill';
import DecompositionRuleSet from '../../src/cengines/replacer/decompositionruleset';
import qft2crandhadamard from '../../src/setups/decompositions/qft2crandhadamard';
import swap2cnot from '../../src/setups/decompositions/swap2cnot';
import defaultrules from '../../src/libs/math/defaultrules'
import {AutoReplacer, InstructionFilter} from '../../src/cengines/replacer/replacer';
import {AddConstant, AddConstantModN, MultiplyByConstantModN} from '../../src/libs/math/gates';
import {All} from '../../src/ops/metagates';
import {Measure, X} from '../../src/ops/gates';
import Simulator from '../../src/backends/simulators/simulator';
import MainEngine from '../../src/cengines/main';

function init(engine, quint, value) {
  for (let i = 0; i < quint.length; ++i) {
    if (((value >> i) & 1) == 1) {
      X.or(quint[i])
    }
  }
}

function no_math_emulation(eng, cmd) {
  if (cmd.gate instanceof BasicMathGate) {
    return false
  }
  if (cmd.gate instanceof ClassicalInstructionGate) {
    return true
  }

  try {
    return len(cmd.gate.matrix) === 2
  } catch (e) {
    return false
  }
}

const rule_set = new DecompositionRuleSet([...defaultrules, ...qft2crandhadamard, ...swap2cnot])

describe('constant math test', () => {
  it('should test_adder', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [new AutoReplacer(rule_set),
      new InstructionFilter(no_math_emulation)])
    const qureg = eng.allocateQureg(4)
    init(eng, qureg, 4)

    new AddConstant(3).or(qureg)

    let m = sim.cheat()[1]
    let v = m[7]
    expect(math.abs(math.complex(v.re, v.im))).to.be.closeTo(1, 1e-12)

    init(eng, qureg, 7) // reset
    init(eng, qureg, 2)

    // check for overflow -> should be 15+2 = 1 (mod 16)
    new AddConstant(15).or(qureg)
    m = sim.cheat()[1]
    v = m[1]
    expect(math.abs(math.complex(v.re, v.im))).to.be.closeTo(1, 1e-12)

    new All(Measure).or(qureg)
  });

  it('should test_modadder', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [new AutoReplacer(rule_set),
      new InstructionFilter(no_math_emulation)])

    const qureg = eng.allocateQureg(4)
    init(eng, qureg, 4)

    new AddConstantModN(3, 6).or(qureg)
    let m = sim.cheat()[1]
    let v = m[1]
    expect(math.abs(math.complex(v.re, v.im))).to.closeTo(1, 1e-12)

    init(eng, qureg, 1) // reset
    init(eng, qureg, 7)

    new AddConstantModN(10, 13).or(qureg)
    m = sim.cheat()[1]
    v = m[4]
    expect(math.abs(math.complex(v.re, v.im))).to.closeTo(1, 1e-12)

    new All(Measure).or(qureg)
  });

  it('should test_modmultiplier', () => {
    const sim = new Simulator()
    const eng = new MainEngine(sim, [new AutoReplacer(rule_set),
      new InstructionFilter(no_math_emulation)])

    const qureg = eng.allocateQureg(4)
    init(eng, qureg, 4)

    new MultiplyByConstantModN(3, 7).or(qureg)

    let m = sim.cheat()[1]
    let v = m[5]
    expect(math.abs(math.complex(v.re, v.im))).to.closeTo(1, 1e-12)

    init(eng, qureg, 5) // reset
    init(eng, qureg, 7)

    new MultiplyByConstantModN(4, 13).or(qureg)

    m = sim.cheat()[1]
    v = m[2]
    expect(math.abs(math.complex(v.re, v.im))).to.closeTo(1, 1e-12)

    new All(Measure).or(qureg)
  });
})
