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

import {expect, assert} from 'chai'
import {H, X, Rx} from '../../ops/gates';
import {tuple} from '../../libs/util';
import {Command} from '../../ops/command';
import {DummyEngine} from '../testengine';
import MainEngine from '../main';
import {InstructionFilter, AutoReplacer} from './replacer';
import {BasicGate, ClassicalInstructionGate} from '../../ops/basics';
import DecompositionRuleSet from './decompositionruleset'
import DecompositionRule from './decompositionrule'
import '../../ops/metagates'
import {NoGateDecompositionError} from '../../meta/error';

describe('replacer test', () => {
  class SomeGateClass extends BasicGate {}

  const SomeGate = new SomeGateClass()
  const make_decomposition_rule_set = () => {
    const result = new DecompositionRuleSet()
    // BasicGate with no get_inverse used for testing:
    // with pytest.raises(NotInvertible):
    // SomeGate.get_inverse()

    // Loading of decomposition rules:
    const decompose_test1 = cmd => X.or(cmd.qubits)

    const recognize_test = () => true

    result.addDecompositionRule(new DecompositionRule(SomeGateClass, decompose_test1, recognize_test))

    const decompose_test2 = cmd => H.or(cmd.qubits)

    result.addDecompositionRule(new DecompositionRule(SomeGateClass, decompose_test2, recognize_test))

    assert(result.decompositions[SomeGateClass.name].length === 2)
    return result
  }

  const rule_set = make_decomposition_rule_set()

  const fixture_gate_filter = () => {
    // Filter which doesn't allow SomeGate
    const test_gate_filter_func = (eng, cmd) => cmd.gate !== SomeGate
    return new InstructionFilter(test_gate_filter_func)
  }

  it('should test_filter_engine', () => {
    const my_filter = cmd => cmd.gate.equal(H)

    const filter_eng = new InstructionFilter(my_filter)
    const eng = new MainEngine(new DummyEngine(), [filter_eng])
    const qubit = eng.allocateQubit()
    const cmd = new Command(eng, H, tuple(qubit))
    const cmd2 = new Command(eng, X, tuple(qubit))
    expect(eng.isAvailable(cmd)).to.equal(true)
    expect(eng.isAvailable(cmd2)).to.equal(false)
    expect(filter_eng.isAvailable(cmd)).to.equal(true)
    expect(filter_eng.isAvailable(cmd2)).to.equal(false)
  });

  it('should test_auto_replacer_default_chooser', () => {
    const filter = fixture_gate_filter()
    // Test that default decomposition_chooser takes always first rule.
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new AutoReplacer(rule_set), filter])

    expect(rule_set.decompositions[SomeGateClass.name].length).to.equal(2)
    expect(backend.receivedCommands.length).to.equal(0)

    const qb = eng.allocateQubit()
    SomeGate.or(qb)
    eng.flush()
    expect(backend.receivedCommands.length).to.equal(3)
    expect(backend.receivedCommands[1].gate.equal(X)).to.equal(true)
  });

  it('should test_auto_replacer_decomposition_chooser', () => {
    // Supply a decomposition chooser which always chooses last rule.
    const test_decomp_chooser = (cmd, decomposition_list) => decomposition_list[decomposition_list.length - 1]
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new AutoReplacer(rule_set, test_decomp_chooser), fixture_gate_filter()])

    expect(rule_set.decompositions[SomeGateClass.name].length).to.equal(2)
    expect(backend.receivedCommands.length).to.equal(0)

    const qb = eng.allocateQubit()
    SomeGate.or(qb)
    eng.flush()

    expect(backend.receivedCommands.length).to.equal(3)
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
  });

  it('should test_auto_replacer_no_rule_found', () => {
    // Check that exception is thrown if no rule is found
    // For both the cmd and it's inverse (which exists)
    const h_filter_func = (eng, cmd) => !cmd.gate.equal(H)

    const h_filter = new InstructionFilter(h_filter_func)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new AutoReplacer(rule_set), h_filter])
    const qubit = eng.allocateQubit()

    expect(() => H.or(qubit)).to.throw(NoGateDecompositionError)
    eng.flush()
  });

  it('should test_auto_replacer_use_inverse_decomposition', () => {
    // Check that if there is no decomposition for the gate, that
    // AutoReplacer runs the decomposition for the inverse gate in reverse

    // Create test gate and inverse
    class NoMagicGate extends BasicGate {

    }

    class MagicGate extends BasicGate {
      getInverse() {
        return new NoMagicGate()
      }
    }

    const decompose_no_magic_gate = (cmd) => {
      const qb = cmd.qubits
      new Rx(0.6).or(qb)
      H.or(qb)
    }

    const recognize_no_magic_gate = cmd => true

    rule_set.addDecompositionRule(new DecompositionRule(NoMagicGate, decompose_no_magic_gate, recognize_no_magic_gate))

    const magic_filter = (eng, cmd) => !(cmd.gate instanceof MagicGate)

    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new AutoReplacer(rule_set), new InstructionFilter(magic_filter)])

    expect(backend.receivedCommands.length).to.equal(0)

    const qb = eng.allocateQubit()
    new MagicGate().or(qb)
    eng.flush()

    backend.receivedCommands.forEach(cmd => console.log(cmd.toString()))
    expect(backend.receivedCommands.length).to.equal(4)
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[2].gate.equal(new Rx(-0.6))).to.equal(true)
  });

  it('should test_auto_replacer_adds_tags', () => {
    // Test that AutoReplacer puts back the tags
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new AutoReplacer(rule_set), fixture_gate_filter()])

    expect(rule_set.decompositions[SomeGateClass.name].length).to.equal(2)
    expect(backend.receivedCommands.length).to.equal(0)
    const qb = eng.allocateQubit()
    const cmd = new Command(eng, SomeGate, tuple(qb))
    cmd.tags = ['AddedTag']
    eng.send([cmd])
    eng.flush()

    expect(backend.receivedCommands.length).to.equal(3)
    expect(backend.receivedCommands[1].gate.equal(X)).to.equal(true)
    expect(backend.receivedCommands[1].tags.length).to.equal(1)
    expect(backend.receivedCommands[1].tags[0]).to.equal('AddedTag')
  });

  it('should test_auto_replacer_searches_parent_class_for_rule', () => {
    class DerivedSomeGate extends SomeGateClass {

    }

    const test_gate_filter_func = (eng, cmd) => (cmd.gate.equal(X) || cmd.gate.equal(H) || (cmd.gate instanceof ClassicalInstructionGate))

    const i_filter = new InstructionFilter(test_gate_filter_func)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new AutoReplacer(rule_set), i_filter])
    const qb = eng.allocateQubit()
    new DerivedSomeGate().or(qb)
    eng.flush()
    const received_gate = backend.receivedCommands[1].gate
    expect(received_gate.equal(X) || received_gate.equal(H)).to.equal(true)
  });
})
