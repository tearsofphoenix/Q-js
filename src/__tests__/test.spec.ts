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

import { expect } from 'chai'
import * as math from 'mathjs'

import { getInverse } from '@/ops/_cycle';
import {
  BasicMathGate, QFT, Swap, Measure, All, H, X
} from '@/ops/index';
import {
  DecompositionRuleSet, MainEngine, AutoReplacer,
  DummyEngine, InstructionFilter, TagRemover, LocalOptimizer
} from '@/cengines/index'
import { MultiplyByConstantModN } from '@/libs/math/gates'
import { Control } from '@/meta/index'
import { Simulator } from '@/backends/simulators/simulator'
import decompositions from '@/setups/decompositions/index'
import mathrules from '@/libs/math/defaultrules'
import { expmod } from '@/libs/polyfill'

describe('test', () => {
  const rule_set = new DecompositionRuleSet([...mathrules, ...decompositions])

  function high_level_gates(eng, cmd) {
    const g = cmd.gate
    if (g.equal(QFT) || getInverse(g).equal(QFT) || g.equal(Swap)) {
      return true
    }
    if (g instanceof BasicMathGate) {
      return false
    }

    return eng.next.isAvailable(cmd)
  }


  function get_main_engine(sim, dummy) {
    const engine_list = [new AutoReplacer(rule_set),
    new InstructionFilter(high_level_gates),
    new TagRemover(),
    new LocalOptimizer(3),
    new AutoReplacer(rule_set),
    new TagRemover(),
    new LocalOptimizer(3)
    ]
    if (dummy) {
      engine_list.push(dummy)
    }
    return new MainEngine(sim, engine_list)
  }

  it('should ', () => {
    const sim = new Simulator()
    const dummy = new DummyEngine(true)
    const eng = get_main_engine(dummy, sim)

    const ctrl_qubit = eng.allocateQubit()

    const N = 15
    const a = 2

    const x = eng.allocateQureg(4)
    X.or(x[0])

    H.or(ctrl_qubit)
    let cheat_tpl = sim.cheat()
    Control(eng, ctrl_qubit, () => new MultiplyByConstantModN(expmod(a, 2 ** 7, N), N).or(x))
    cheat_tpl = sim.cheat()
    H.or(ctrl_qubit)
    cheat_tpl = sim.cheat()
    eng.flush()
    dummy.receivedCommands.forEach(cmd => console.log(cmd.toString()))
    cheat_tpl = sim.cheat()
    let idx = cheat_tpl[0][ctrl_qubit[0].id]
    let vec = cheat_tpl[1]

    vec.forEach((v, i) => {
      v = math.complex(v.re, v.im)
      console.log(v, i)
      if (math.abs(v) > 1e-8) {
        expect((i >> idx) & i).to.equal(0)
      }
    })

    Measure.or(ctrl_qubit)

    expect(ctrl_qubit.toNumber()).to.equal(0)

    vec.deallocate()
    cheat_tpl

    H.or(ctrl_qubit)
    Control(eng, ctrl_qubit, () => new MultiplyByConstantModN(math.pow(a, 2) % N, N).or(x))

    H.or(ctrl_qubit)
    eng.flush()
    cheat_tpl = sim.cheat()
    idx = cheat_tpl[0][ctrl_qubit[0].id]
    vec = cheat_tpl[1]

    let probability = 0.0

    vec.forEach((v, i: number) => {
      v = math.complex(v.re, v.im)
      if (math.abs(v) > 1e-8) {
        if ((i >> idx) & 1 === 0) {
          probability += math.abs(v) ** 2
        }
      }
    })

    expect(probability).to.be.closeTo(0.5, 1e-12)

    Measure.or(ctrl_qubit)
    new All(Measure).or(x)
  });
})
