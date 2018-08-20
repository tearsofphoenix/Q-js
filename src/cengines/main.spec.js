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
import MainEngine from './main'
import {DummyEngine} from './testengine'
import {
  H, AllocateQubitGate, FlushGate, DeallocateQubitGate
} from '../ops/gates'
import BasicMapperEngine from './basicmapper'
import Simulator from "../backends/simulators/simulator";
import {getEngineList} from "../setups";
import LocalOptimizer from "./optimize";

describe('main engine test', () => {
  it('should test_main_engine_init', () => {
    const ceng1 = new DummyEngine()
    const ceng2 = new DummyEngine()
    const test_backend = new DummyEngine()
    const engine_list = [ceng1, ceng2]
    const eng = new MainEngine(test_backend, engine_list)

    expect(eng.next === ceng1).to.equal(true)
    expect(eng.main === eng).to.equal(true)
    expect(eng.isLastEngine).to.equal(false)

    expect(ceng1.next === ceng2).to.equal(true)
    expect(ceng1.main === eng).to.equal(true)
    expect(ceng1.isLastEngine).to.equal(false)

    expect(ceng2.next === test_backend).to.equal(true)
    expect(ceng2.main === eng).to.equal(true)
    expect(ceng2.isLastEngine).to.equal(false)

    expect(test_backend.isLastEngine).to.equal(true)
    expect(test_backend.main === eng).to.equal(true)
    expect(!!test_backend.next).to.equal(false)

    expect(engine_list.length).to.equal(2)

  });

  it('should test_main_engine_init_failure', () => {
    expect(() => {
      const eng = new MainEngine(DummyEngine)
    }).to.throw()
    expect(() => {
      const eng = new MainEngine(null, DummyEngine)
    }).to.throw()
    expect(() => {
      const eng = new MainEngine(null, [new DummyEngine(), DummyEngine])
    }).to.throw()
    expect(() => {
      const engine = new DummyEngine()
      const eng = new MainEngine(engine, [engine])
    }).to.throw()
  });

  it('should test_main_engine_init_defaults', () => {
    const eng = new MainEngine()
    const eng_list = []
    let current_engine = eng.next
    while (!current_engine.isLastEngine) {
      eng_list.push(current_engine)
      current_engine = current_engine.next
    }
    expect(eng_list[eng_list.length - 1].next instanceof Simulator).to.equal(true)
    const default_engines = getEngineList()
    default_engines.forEach((looper, i) => {
      expect(looper.constructor === eng_list[i].constructor).to.equal(true)
    })
  });

  it('should test_main_engine_init_mapper', () => {
    class LinearMapper extends BasicMapperEngine {

    }

    const mapper1 = new LinearMapper()
    const mapper2 = new BasicMapperEngine()
    const engine_list1 = [mapper1]
    const eng1 = new MainEngine(null, engine_list1)

    expect(eng1.mapper === mapper1).to.equal(true)
    const engine_list2 = [mapper2]
    const eng2 = new MainEngine(null, engine_list2)
    expect(eng2.mapper === mapper2).to.equal(true)

    const engine_list3 = [mapper1, mapper2]
    expect(() => new MainEngine(null, engine_list3)).to.throw()
  });

  it('should test_main_engine_del', () => {
    // Clear previous exceptions of other tests

    // need engine which caches commands to test that del calls flush
    const caching_engine = new LocalOptimizer(5)
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [caching_engine])
    const qubit = eng.allocateQubit()
    H.or(qubit)
    expect(backend.receivedCommands.length).to.equal(0)

    eng.deallocate()
    // Allocate, H, Deallocate, and Flush Gate
    expect(backend.receivedCommands.length).to.equal(4)
  });

  it('should test_main_engine_set_and_get_measurement_result', () => {
    const eng = new MainEngine(new DummyEngine(), [])
    const qubit0 = eng.allocateQubit()
    const qubit1 = eng.allocateQubit()

    expect(() => qubit0.toNumber()).to.throw()

    eng.setMeasurementResult(qubit0[0], true)
    eng.setMeasurementResult(qubit1[0], false)

    expect(qubit0.toNumber()).to.equal(1)
    expect(qubit1.toNumber()).to.equal(0)
  });

  it('should test_main_engine_get_qubit_id', () => {
    // Test that ids are not identical
    const eng = new MainEngine(new DummyEngine(), [])
    const ids = []
    const total = 10
    for (let i = 0; i < total; ++i) {
      ids.push(eng.getNewQubitID())
    }
    expect(new Set(ids).size).to.equal(total)
  });
  it('should test_main_engine_flush', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qubit = eng.allocateQubit()
    H.or(qubit)
    eng.flush()

    expect(backend.receivedCommands.length).to.equal(3)
    expect(backend.receivedCommands[0].gate.equal(new AllocateQubitGate())).to.equal(true)
    expect(backend.receivedCommands[1].gate.equal(H)).to.equal(true)
    expect(backend.receivedCommands[2].gate.equal(new FlushGate())).to.equal(true)

    eng.flush(true)

    expect(backend.receivedCommands.length).to.equal(5)
    expect(backend.receivedCommands[3].gate.equal(new DeallocateQubitGate())).to.equal(true)

    // keep the qubit alive until at least here
    expect(qubit.toString().length).not.to.equal(0)
  });
  // TODO
  // it('should test_main_engine_atexit_with_error', () => {
  //   // sys.last_type = "Something"
  //   const backend = new DummyEngine(true)
  //   const eng = new MainEngine(backend, [])
  //   const qb = eng.allocateQubit()
  //   // eng._delfun(weakref.ref(eng))
  //   // assert len(backend.received_commands) == 1
  //   // assert backend.received_commands[0].gate == AllocateQubitGate()
  //   //
  // });
  it('should test_exceptions_are_forwarded', () => {
    class ErrorEngine extends DummyEngine {
      receive() {
        throw new Error('TypeError')
      }
    }
    const eng = new MainEngine(new ErrorEngine(), [])
    expect(() => eng.allocateQubit()).to.throw()

    const eng2 = new MainEngine(new ErrorEngine(), [], true)
    expect(() => eng2.allocateQubit()).to.throw()
  });
})
