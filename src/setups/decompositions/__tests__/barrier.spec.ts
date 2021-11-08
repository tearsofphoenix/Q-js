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
import { _recognize_barrier } from '@/setups/decompositions/barrier'
import { DummyEngine } from '@/cengines/testengine'
import { MainEngine } from '@/cengines/main'
import { R, Barrier } from '@/ops/gates';
import { ICommand } from '@/interfaces';

describe('barrier test', () => {
  it('should test_recognize_barrier', () => {
    const saving_backend = new DummyEngine(true)
    const eng = new MainEngine(saving_backend, [])
    const qubit = eng.allocateQubit()
    new R(0.2).or(qubit)
    Barrier.or(qubit)
    eng.flush(true)
    // Don't test initial allocate and trailing deallocate and flush gate.
    let count = 0
    const cmds = saving_backend.receivedCommands
    cmds.slice(1, cmds.length - 2).forEach((cmd) => {
      count += _recognize_barrier(cmd) ? 1 : 0;
    })
    expect(count).to.equal(2) // recognizes all gates
  });

  it('should test_remove_barrier', () => {
    const saving_backend = new DummyEngine(true)

    const my_is_available = (cmd: ICommand) => cmd.gate !== Barrier

    // @ts-ignore
    saving_backend.isAvailable = my_is_available
    const eng = new MainEngine(saving_backend)
    const qubit = eng.allocateQubit()
    new R(0.2).or(qubit)
    Barrier.or(qubit)
    eng.flush(true)
    // Don't test initial allocate and trailing deallocate and flush gate.
    const cmds = saving_backend.receivedCommands
    const sub = cmds.slice(1, cmds.length - 2)
    sub.forEach((cmd) => {
      expect(cmd.gate.equal(Barrier)).to.equal(false)
    })
    expect(sub.length).to.equal(1)
  });
})
