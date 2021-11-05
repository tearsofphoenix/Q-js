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
import {getEngineList} from '../../../src/setups/index';
import {tuple} from '../../../src/libs/util'
import {CNOT, CZ} from '../../../src/ops/shortcuts'
import {Control} from '../../../src/meta/control';
import {Measure, X, Z} from '../../../src/ops/gates';
import {_recognize_cnot} from '../../../src/setups/decompositions/cnot2cz'
import {DummyEngine} from '../../../src/cengines/testengine';
import MainEngine from '../../../src/cengines/main';
import {All} from '../../../src/ops/metagates';
import DecompositionRuleSet from '../../../src/cengines/replacer/decompositionruleset';
import {AutoReplacer, InstructionFilter} from '../../../src/cengines/replacer/replacer';
import Simulator from '../../../src/backends/simulators/simulator';
import cnot2cz from '../../../src/setups/decompositions/cnot2cz';

describe('cnot2cz test', () => {
  it('should test_recognize_gates', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, getEngineList(), true)
    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const qubit3 = eng.allocateQubit()
    eng.flush()
    CZ.or(tuple(qubit1, qubit2))
    Control(eng, qubit2, () => {
      Z.or(qubit1)
      X.or(qubit1)
    })
    Control(eng, qubit2.concat(qubit3), () => {
      Z.or(qubit1)
    })

    eng.flush() // To make sure gates arrive before deallocate gates
    eng.flush(true)
    // Don't test initial 4 allocate and flush

    saving_backend.receivedCommands.slice(5, 7).forEach(cmd => expect(_recognize_cnot(cmd)).to.equal(true))
    saving_backend.receivedCommands.slice(7, 9).forEach(cmd => expect(_recognize_cnot(cmd)).to.equal(false))
  });

  it('should test_cnot_decomposition', () => {
    const _decomp_gates = (eng, cmd) => {
      const g = cmd.gate
      if (cmd.controlQubits.length === 1 && cmd.gate instanceof X.constructor) {
        return false
      }
      return true
    }

    for (let basis_state_index = 0; basis_state_index < 4; ++basis_state_index) {
      const basis_state = [0, 0, 0, 0]
      basis_state[basis_state_index] = 1.0
      const correct_dummy_eng = new DummyEngine(true)
      const correct_eng = new MainEngine(new Simulator(), [correct_dummy_eng])
      const rule_set = new DecompositionRuleSet(cnot2cz)
      const test_dummy_eng = new DummyEngine(true)

      const test_eng = new MainEngine(new Simulator(),
        [new AutoReplacer(rule_set), new InstructionFilter(_decomp_gates), test_dummy_eng])
      const test_sim = test_eng.backend
      const correct_sim = correct_eng.backend
      const correct_qb = correct_eng.allocateQubit()
      const correct_ctrl_qb = correct_eng.allocateQubit()
      correct_eng.flush()
      const test_qb = test_eng.allocateQubit()
      const test_ctrl_qb = test_eng.allocateQubit()
      test_eng.flush()

      correct_sim.setWavefunction(basis_state, correct_qb.concat(correct_ctrl_qb))
      test_sim.setWavefunction(basis_state, test_qb.concat(test_ctrl_qb))
      CNOT.or(tuple(test_ctrl_qb, test_qb))
      CNOT.or(tuple(correct_ctrl_qb, correct_qb))

      test_eng.flush()
      correct_eng.flush()

      expect(correct_dummy_eng.receivedCommands.length).to.equal(5)
      expect(test_dummy_eng.receivedCommands.length).to.equal(7)

      for (let fstate = 0; fstate < 4; ++fstate) {
        let binary_state = fstate.toString(2)
        if (binary_state.length < 2) {
          binary_state = `0${binary_state}`
        }
        const test = test_sim.getAmplitude(binary_state, test_qb.concat(test_ctrl_qb))
        const correct = correct_sim.getAmplitude(binary_state, correct_qb.concat(correct_ctrl_qb))

        expect(correct.re).to.be.closeTo(test.re, 1e-12, 1e-12)
        expect(correct.im).to.be.closeTo(test.im, 1e-12, 1e-12)
      }

      new All(Measure).or(test_qb.concat(test_ctrl_qb))
      new All(Measure).or(correct_qb.concat(correct_ctrl_qb))
      test_eng.flush(true)
      correct_eng.flush(true)
    }
  });
})
