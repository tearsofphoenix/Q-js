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

import MainEngine from '@/cengines/main'
import { DummyEngine } from '@/cengines/testengine'
import { H, Rx } from '@/ops/gates'
import Command from '@/ops/command'
import { ComputeTag, UncomputeTag, DirtyQubitTag } from '@/meta/tag'
import { Control, ControlEngine } from '@/meta/control'
import { Compute, Uncompute } from '@/meta/compute'
import { IQureg } from '@/interfaces';

describe('control test', () => {
  it('should control engine has compute tag', () => {
    const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
    const qubit = eng.allocateQubit()
    const test_cmd0 = new Command(eng, H, [qubit])
    const test_cmd1 = new Command(eng, H, [qubit])
    const test_cmd2 = new Command(eng, H, [qubit])
    test_cmd0.tags = [DirtyQubitTag, new ComputeTag(), DirtyQubitTag]
    test_cmd1.tags = [DirtyQubitTag, new UncomputeTag(), DirtyQubitTag]
    test_cmd2.tags = [DirtyQubitTag]
    const control_eng = new ControlEngine('MockEng' as any);
    expect(control_eng.hasComputeUnComputeTag(test_cmd0)).to.equal(true)
    expect(control_eng.hasComputeUnComputeTag(test_cmd1)).to.equal(true)
    expect(control_eng.hasComputeUnComputeTag(test_cmd2)).to.equal(false)
  });

  it('should test control', () => {
    const backend = new DummyEngine(true)
    const eng = new MainEngine(backend, [new DummyEngine()])
    const qureg = eng.allocateQureg(2)
    let qubit: IQureg;
    Control(eng, qureg, () => {
      qubit = eng.allocateQubit()
      Compute(eng, () => {
        new Rx(0.5).or(qubit)
      })
      H.or(qubit)
      Uncompute(eng)
    })

    Control(eng, qureg[0], () => {
      H.or(qubit)
    })

    eng.flush()

    backend.receivedCommands.forEach(cmd => console.log(cmd.toString()))
    expect(backend.receivedCommands.length).to.equal(8)
    expect(backend.receivedCommands[0].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[1].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[2].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[3].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[4].controlQubits.length).to.equal(2)
    expect(backend.receivedCommands[5].controlQubits.length).to.equal(0)
    expect(backend.receivedCommands[6].controlQubits.length).to.equal(1)
    expect(backend.receivedCommands[7].controlQubits.length).to.equal(0)

    expect(backend.receivedCommands[4].controlQubits[0].id).to.equal(qureg[0].id)
    expect(backend.receivedCommands[4].controlQubits[1].id).to.equal(qureg[1].id)
    expect(backend.receivedCommands[6].controlQubits[0].id).to.equal(qureg[0].id)
  });
})
